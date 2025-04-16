import express, { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();

router.post('/new', async (req: Request, res: Response) => {
  try {
    const data = await prisma.precents.create({
      data: {
        precintNumber: req.body.precintNumber,
        municipalsId: req.body.municipalId,
        id: req.body.precintNumber,
      },
    });

    if (data) {
      res.status(200).jsonp(data);
      return;
    }
    res.status(404).json({});
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

export default router;
