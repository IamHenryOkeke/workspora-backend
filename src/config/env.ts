import dotenv from "dotenv";
dotenv.config();

export const getEnv = (name: string, defaultValue = ""): string => {
  const value = process.env[name.toUpperCase()] || defaultValue;
  if (!value) {
    throw new Error(
      `Environment variable ${name} is not set and no default value was provided.`,
    );
  }

  return value;
};
