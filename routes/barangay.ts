import express,{Request, Response} from "express"
import { prisma } from "../src/config/prisma"
const router = express.Router()

router.post("/new", async(req: Request, res:Response)=>{
    try {
        const barangay = req.body
        await prisma.barangays.create({data: barangay})
        res.status(200).json({message: "OK"})
    } catch (error) {
        console.log(error);
    }finally{
        await prisma.$disconnect()
    }
})

router.get("/list", async(req: Request, res:Response)=>{
    try {
        const data = await prisma.barangays.findMany()
        res.status(200).json(data)
    } catch (error) {
        console.log(error);
    }finally{
        await prisma.$disconnect()
    }
})

export default router