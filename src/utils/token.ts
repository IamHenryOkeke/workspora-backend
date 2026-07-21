import crypto from "crypto";

export const generateToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
};
