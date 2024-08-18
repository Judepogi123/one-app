import express,{Request, Response} from "express"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
const router = express.Router()

router.delete('/delete', async(req: Request, res: Response)=>{
    try {
        await prisma.voters.deleteMany()
        res.status(200).json({message: "Ok"})
    } catch (error) {
        res.status(500).json({message: `Internal Server Error: ${error}`})
    }
})

export default router