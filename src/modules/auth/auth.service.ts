import { getEnv } from "../../config/env";
import { AppError } from "../../error/error-handler";
import { TokenType } from "../../generated/prisma/enums";
import { AuthRepository } from "./auth.repository";
import crypto from "crypto";
import { emailQueue } from "../../queues/email.queue";
import { queueConfig } from "../../utils/queue-config";
import { signJWT } from "../../utils/jwt";
import { prisma } from "../../lib/prisma";
import { comparePassword, hashPassword } from "../../utils/password";

const FRONTEND_URL = getEnv("FRONTEND_URL");

const TOKEN_EXPIRY = {
  VERIFY_EMAIL: 10 * 60 * 1000,
  RESET_PASSWORD: 5 * 60 * 1000,
  ACCESS_TOKEN: 60 * 15,
};
export class AuthService {
  constructor(private authRepo: AuthRepository) {}

  private generateToken() {
    const raw = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(raw).digest("hex");
    return { raw, hashed };
  }

  private async issueVerificationToken(user: {
    id: string;
    email: string;
    fullName: string;
  }) {
    await this.authRepo.deleteTokens(user.id, TokenType.VERIFY_EMAIL);

    const { raw, hashed } = this.generateToken();

    await this.authRepo.createToken({
      token: hashed,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.VERIFY_EMAIL),
      user: { connect: { id: user.id } },
      type: TokenType.VERIFY_EMAIL,
    });

    const verificationLink = `${FRONTEND_URL}/verify-account?token=${raw}`;

    await emailQueue.add(
      "send-verification-email",
      {
        title: "Verify your account",
        to: user.email,
        name: user.fullName,
        content: `
        <div>
          <p>Hello ${user.fullName || user.email},</p>
          <p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>
          <p>Link expires in 10 minutes.</p>
        </div>
      `,
      },
      queueConfig,
    );
  }

  async register(data: { email: string; password: string; fullName: string }) {
    const normalizedEmail = data.email.toLowerCase();

    const existingUser = await this.authRepo.getUserByEmail(normalizedEmail);
    if (existingUser)
      throw new AppError("Email already used. Please use another email.", 409);

    const hashedPassword = await hashPassword(data.password);

    const values = {
      email: normalizedEmail,
      password: hashedPassword,
      fullName: data.fullName.trim(),
    };

    const newUser = await this.authRepo.createUser(values);

    await this.issueVerificationToken(newUser);

    return {
      message:
        "Registration successful. Please check your email for a verification link",
    };
  }

  async verifyAccount(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const existingToken = await this.authRepo.getToken(
      hashedToken,
      TokenType.VERIFY_EMAIL,
    );

    if (!existingToken)
      throw new AppError("Token is invalid or has expired.", 400);

    if (existingToken.user.deletedAt)
      throw new AppError("Account no longer exists.", 404);

    if (existingToken.user.isVerified)
      throw new AppError("Account is already verified.", 409);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingToken.userId },
          data: { isVerified: true },
        });
        await tx.token.deleteMany({
          where: {
            userId: existingToken.userId,
            type: TokenType.VERIFY_EMAIL,
          },
        });
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      throw new AppError("Failed to verify account. Please try again.", 500);
    }

    return { message: "Account verification successful." };
  }

  async logIn(data: { email: string; password: string }) {
    const { email, password } = data;
    const isExistingUser = await this.authRepo.getUserByEmail(
      email.toLowerCase(),
    );

    if (!isExistingUser) throw new AppError("Invalid credentials", 401);

    if (!isExistingUser.password) {
      if (isExistingUser.googleId)
        throw new AppError("Please login with Google.", 400);

      throw new AppError("Invalid credentials", 401);
    }

    if (!isExistingUser.isVerified) {
      await this.issueVerificationToken(isExistingUser);

      throw new AppError(
        "Please verify your account through the link sent to your mail before logging in.",
        403,
      );
    }

    const isValidPassword = await comparePassword(
      isExistingUser.password,
      password.trim(),
    );

    if (!isValidPassword) throw new AppError("Invalid credentials", 401);

    const user = {
      id: isExistingUser.id,
      fullName: isExistingUser.fullName,
    };

    const token = signJWT(user, TOKEN_EXPIRY.ACCESS_TOKEN);

    return {
      message: "Login successful",
      user,
      token,
    };
  }

  async sendVerificationEmail(email: string) {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.authRepo.getUserByEmail(normalizedEmail);

    if (!existingUser)
      return {
        message:
          "Verification email sent successful. Please check your email for a verification link",
      };

    if (existingUser.isVerified)
      throw new AppError("Account verified already", 409);

    await this.issueVerificationToken(existingUser);

    return {
      message:
        "Verification email sent successful. Please check your email for a verification link",
    };
  }

  async sendPasswordResetLink(email: string) {
    const normalizedEmail = email.toLowerCase();

    const existingUserByEmail =
      await this.authRepo.getUserByEmail(normalizedEmail);

    if (!existingUserByEmail)
      return {
        message: "If that email exists, a password reset link has been sent.",
      };

    await this.authRepo.deleteTokens(
      existingUserByEmail.id,
      TokenType.RESET_PASSWORD,
    );

    const { raw, hashed } = this.generateToken();

    const values = {
      token: hashed,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.RESET_PASSWORD),
      user: {
        connect: {
          id: existingUserByEmail.id,
        },
      },
      type: TokenType.RESET_PASSWORD,
    };

    await this.authRepo.createToken(values);

    const verificationLink = `${FRONTEND_URL}/reset-password?token=${raw}`;

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
      message: "If that email exists, a password reset link has been sent.",
    };
  }

  async resetPassword(data: { token: string; password: string }) {
    const { token, password } = data;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const existingToken = await this.authRepo.getToken(
      hashedToken,
      TokenType.RESET_PASSWORD,
    );

    if (!existingToken)
      throw new AppError("Reset token is invalid or has expired.", 400);

    if (existingToken.user.deletedAt)
      throw new AppError("Account no longer exists.", 404);

    const hashedPassword = await hashPassword(password);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existingToken.userId },
          data: { password: hashedPassword },
        });
        await tx.token.deleteMany({
          where: {
            userId: existingToken.userId,
            type: TokenType.RESET_PASSWORD,
          },
        });
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      throw new AppError("Failed to reset password. Please try again.", 500);
    }

    return { message: "Password reset successful." };
  }
}
