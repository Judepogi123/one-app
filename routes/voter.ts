import express from "express";
import { prisma } from "../prisma/prisma";
const router = express.Router();

router.get("/new-voter", async (req, res) => {
  const data = req.body;
  if (data) {
    res.status(404).json({ message: "No data provided" });
    return;
  }
  try {
    const newVoter = await prisma.voters.findFirst({
      where: {},
    });
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  }
});

export default router;
