import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private authRepo: AuthRepository) {}

  async signUp(email: string, password: string) {
    const existingUser = await this.authRepo.findUserByEmail(email);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.authRepo.createUser({
      email,
      password: hashedPassword,
    });
  }
}
