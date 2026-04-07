import argon2 from "argon2";

export const hashPassword = async (password: string) => {
  const result = await argon2.hash(password);
  return result;
};

export const comparePassword = async (
  hashedPassword: string,
  password: string,
) => {
  const result = await argon2.verify(hashedPassword, password);
  return result;
};
