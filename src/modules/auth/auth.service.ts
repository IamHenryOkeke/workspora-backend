import { getEnv } from "../../config/env";
import { AppError } from "../../error/error-handler";
import { TokenType } from "../../generated/prisma/enums";
import { AuthRepository } from "./auth.repository";
import * as argon2 from "argon2";
import crypto from "crypto";
import { emailQueue } from "../../queues/email.queue";
import { queueConfig } from "../../utils/queue-config";
import { signJWT } from "../../utils/jwt";

const FRONTEND_URL = getEnv("FRONTEND_URL");

export class AuthService {
  constructor(private authRepo: AuthRepository) {}

  private async hashPassword(password: string) {
    const result = await argon2.hash(password);
    return result;
  }

  private async comparePassword(hashedPassword: string, password: string) {
    const result = await argon2.verify(hashedPassword, password);
    return result;
  }

  private createToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  async register(data: { email: string; password: string; fullName: string }) {
    const normalizedEmail = data.email.toLowerCase();

    const existingUser = await this.authRepo.getUserByEmail(normalizedEmail);
    if (existingUser)
      throw new AppError("Email already used. Please use another email.", 409);

    const hashedPassword = await this.hashPassword(data.password);

    const values = {
      email: normalizedEmail,
      password: hashedPassword,
      fullName: data.fullName.trim(),
    };

    const newUser = await this.authRepo.createUser(values);

    await this.authRepo.deleteToken(newUser.id);

    const token = this.createToken();
    await this.authRepo.createToken({
      token,
      expires: new Date(Date.now() + 60 * 10 * 1000),
      user: {
        connect: {
          id: newUser.id,
        },
      },
      type: TokenType.EMAIL_VERIFICATION,
    });

    const verificationLink = `${FRONTEND_URL}/verify-account?token=${token}`;

    await emailQueue.add(
      "send-welcome-email",
      {
        title: "Welcome to AlphaBlocks!",
        to: newUser.email,
        name: newUser.fullName,
        content: `
          <div>
            <p>Hello ${newUser.fullName || newUser.email},</p>
            <p>Welcome to AlphaBlocks! We're excited to have you on board.</p>
            <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
            <p>Link expires in 10 minutes</p>
          </div>
        `,
      },
      queueConfig,
    );

    const user = {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
    };

    return {
      message:
        "Registration successful. Please check your email for a verification link",
      user,
    };
  }

  async verifyAccount(token: string) {
    const existingToken = await this.authRepo.getToken(
      token,
      TokenType.EMAIL_VERIFICATION,
    );

    if (!existingToken)
      throw new AppError("Reset token is invalid or has expired.", 400);

    const user = await this.authRepo.getUserById(existingToken.userId);

    if (!user) throw new AppError("User not found", 404);

    if (user.isVerified) return { message: "Account is already verified." };

    const values = { isVerified: true };

    await this.authRepo.updateUser(user.id, values);

    return { message: "Account verification successful." };
  }

  async logIn(data: { email: string; password: string }) {
    const { email, password } = data;
    const isExistingUser = await this.authRepo.getUserByEmail(
      email.toLowerCase(),
    );

    if (!isExistingUser) throw new AppError("invalid credentials", 401);

    if (!isExistingUser.password) {
      if (isExistingUser.googleId)
        throw new AppError("Please login with Google.", 400);

      throw new AppError("Invalid credentials", 401);
    }

    if (!isExistingUser.isVerified) {
      await this.authRepo.deleteToken(isExistingUser.id);

      const token = this.createToken();

      await this.authRepo.createToken({
        token,
        expires: new Date(Date.now() + 60 * 10 * 1000),
        user: {
          connect: {
            id: isExistingUser.id,
          },
        },
        type: TokenType.EMAIL_VERIFICATION,
      });

      const verificationLink = `${FRONTEND_URL}/verify-account?token=${token}`;

      await emailQueue.add(
        "send-verification-email",
        {
          title: "Verify Your account!",
          to: isExistingUser.email,
          name: isExistingUser.fullName,
          content: `
            <div>
              <p>Hello ${isExistingUser.fullName || isExistingUser.email},</p>
              <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
            </div>
          `,
        },
        queueConfig,
      );

      throw new AppError(
        "Please verify your account through the link sent to your mail before logging in.",
        403,
      );
    }

    const isValidPassword = await this.comparePassword(
      isExistingUser.password,
      password.trim(),
    );

    if (!isValidPassword) throw new AppError("invalid credentials", 401);

    const user = {
      id: isExistingUser.id,
      fullName: isExistingUser.fullName,
    };

    const token = signJWT(user, 60 * 15);

    return {
      message: "Login successful",
      user,
      token,
    };
  }

  async sendVerificationEmail(email: string) {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.authRepo.getUserByEmail(normalizedEmail);

    if (!existingUser) throw new AppError("Invalid credentials.", 401);

    if (existingUser.isVerified)
      throw new AppError("Account verified already", 409);

    await this.authRepo.deleteToken(existingUser.id);

    const token = this.createToken();

    const values = {
      token,
      expires: new Date(Date.now() + 60 * 5 * 1000),
      user: {
        connect: {
          id: existingUser.id,
        },
      },
      type: TokenType.EMAIL_VERIFICATION,
    };

    await this.authRepo.createToken(values);

    const verificationLink = `${FRONTEND_URL}/verify-account?token=${token}`;

    await emailQueue.add(
      "send-verification-email",
      {
        title: "Verify Your account!",
        to: existingUser.email,
        name: existingUser.fullName,
        content: `
          <div>
            <p>Hello ${existingUser.fullName || existingUser.email},</p>
            <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
          </div>
        `,
      },
      queueConfig,
    );

    return {
      message:
        "Verification email sent successful. Please check your email for a verification link",
      email,
    };
  }

  async sendPasswordResetLink(email: string) {
    const normalizedEmail = email.toLowerCase();

    const existingUserByEmail =
      await this.authRepo.getUserByEmail(normalizedEmail);

    if (!existingUserByEmail) throw new AppError("Invalid credentials.", 409);

    await this.authRepo.deleteToken(existingUserByEmail.id);

    const token = this.createToken();

    const values = {
      token,
      expires: new Date(Date.now() + 60 * 5 * 1000),
      user: {
        connect: {
          id: existingUserByEmail.id,
        },
      },
      type: TokenType.PASSWORD_RESET,
    };

    await this.authRepo.createToken(values);

    const verificationLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    await emailQueue.add(
      "send-password-reset-email",
      {
        title: "Reset Your Password!",
        to: existingUserByEmail.email,
        name: existingUserByEmail.fullName,
        content: `
          <div>
            <p>Hello ${existingUserByEmail.fullName},</p>
            <p>You requested to reset your password. Click the button below:</p>
            <p><a href="${verificationLink}" style="padding: 10px 15px; background: #007BFF; color: white; text-decoration: none;">Reset Password</a></p>
            <p>If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      },
      queueConfig,
    );

    return {
      message: "Password reset email sent successful. Please check your email",
    };
  }

  async resetPassword(data: { token: string; password: string }) {
    const { token, password } = data;
    const existingToken = await this.authRepo.getToken(
      token,
      TokenType.PASSWORD_RESET,
    );

    if (!existingToken)
      throw new AppError("Reset token is invalid or has expired.", 400);

    const user = await this.authRepo.getUserById(existingToken.userId);

    if (!user) throw new AppError("User not found", 404);

    const hashedPassword = await this.hashPassword(password);

    await this.authRepo.updateUser(existingToken.userId, {
      password: hashedPassword,
    });

    await this.authRepo.deleteToken(existingToken.userId);

    return { message: "Password reset successful." };
  }
}
