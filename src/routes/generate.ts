import express, { Request, Response } from "express";
import qrcode  from "qrcode";
const router = express.Router();

router.get("/qrcode", async (req: Request, res: Response) => {

  try {

  } catch (error) {
    res.send({ status: 500, error: `Internal server error: ${error}` });
  }
});
