import cloudinary from "../config/stoage";
import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const uploadDir = path.join(__dirname, "uploads");
const upload = multer({ dest: uploadDir });

router.post(
  "/image",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const imagePath = path.join(uploadDir, req.file.filename);
      const result = await cloudinary.uploader.upload(imagePath);

      const url = await cloudinary.api.resource(result.public_id);

      res.status(200).json(url);
    } catch (error) {
      console.log("Error uploading", error);

      res.status(500).send("Internal server error");
    }
  }
);

export default router;
