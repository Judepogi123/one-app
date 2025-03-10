import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/user", async (req: Request, res: Response) => {
  const user = req.body.username;
  const password = req.body.password;
  console.log({user, password});
  
  try {
    if (!user || !password) {
      res.status(200).json({
        error: 0,
        message: "Invalid username or password",
      });
      return;
    }
    const secretToken = process.env.JWT_SECRECT_TOKEN;

    if (!secretToken) {
      throw new Error("JWT secret token is not defined");
    }

    const userData = await prisma.users.findFirst({
      where: {
        username: user
      },
    });

    if (!userData) {
      res.status(200).json({
        error: 1,
        message: "User not found",
      });
      return;
    }

    if(userData.role !== 2 ){
      return res.status(200).json({
        error: 2,
        message: "Unauthorized Account",
      });
      
    }

    if(userData.status === 0 ){
      return res.status(200).json({
        error: 3,
        message: "Account Suspended",
      });
      return
    }

    const isPasswordValid = await argon2.verify(userData.password, password);
    if (!isPasswordValid) {
      return res.status(200).json({
        error: 4,
        message: "Incorrect password",
      });
    }

    const accessToken = jwt.sign({ user: userData.username }, secretToken, {
      expiresIn: "8h",
    });

    const { username, role, uid,forMunicipal } = userData;
    console.log( { username, role, uid,forMunicipal });
    
    res.status(200).json({ username, role, uid, accessToken, forMunicipal});
  } catch (error) {
    console.log(error);
    
    res.status(500).send("Internal Server Error");
  }
});


export default router;