import express,{Response, Request} from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = express.Router()

router.delete("/delete", async(req: Request, res: Response)=>{
    try {
        await prisma.purok.deleteMany()
        res.status(200).json({message: "OK"})
    } catch (error){
        res.status(500).json({message: "Internal server error"})
    }
})

export default router