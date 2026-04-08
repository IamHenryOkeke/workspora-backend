import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import e from "express";
import { getEnv } from "./env";
import { AppError } from "../error/error-handler";

cloudinary.config({
  cloud_name: getEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getEnv("CLOUDINARY_API_KEY"),
  api_secret: getEnv("CLOUDINARY_API_SECRET"),
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, _file) => ({
    folder: "AlphaBlocks",
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});

const fileFilter = (
  _req: e.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  console.log(file);
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new AppError("Invalid input", 400, {
        image: `${file.mimetype} not allowed`,
      }),
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter,
});
