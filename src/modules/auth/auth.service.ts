import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private authRepo: AuthRepository) {}

  async signUp(data: { email: string; password: string; fullName: string }) {
    const { email, password, fullName } = data;
    const existingUser = await this.authRepo.getUserByEmail(email);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.authRepo.createUser({
      fullName,
      email,
      password: hashedPassword,
    });
  }
}
