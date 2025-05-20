"use strict";
// import express,{Request, Response} from "express"
// import { prisma } from "../src/config/prisma"
// const router = express.Router()
// router.post("/new", async(req: Request, res:Response)=>{
//     try {
//         const batchYear = req.body
//         await prisma.batchYear.create({data: batchYear})
//         res.status(200).json({message: "OK"})
//     } catch (error) {
//         console.log(error);
//     }finally{
//         await prisma.$disconnect()
//     }
// })
// router.get("/list", async(req: Request, res:Response)=>{
//     try {
//         const data = await prisma.batchYear.findMany()
//         res.status(200).json(data)
//     } catch (error) {
//         console.log(error);
//     }finally{
//         await prisma.$disconnect()
//     }
// })
// export default router
