import express, { Request, Response} from "express";
import { prisma,TeamLeaderAttendance } from "../../prisma/prisma";
const route = express.Router()

route.post("/attendance", async(req: Request, res: Response)=>{
    try {
        const {barangayID, attendance } = req.body
        console.log({barangayID, attendance });

        if(!barangayID || attendance.length === 0){
            return res.status(400).send("Bad request")
        }
        const attendanceData: TeamLeaderAttendance[] = attendance
        const [barangay, existedAttendance] = await prisma.$transaction([
            prisma.barangays.findUnique({
                where:{
                    id: barangayID
                }
            }),
            prisma.teamLeaderAttendance.findMany({
                where: {
                    id: { in: attendanceData.map((item)=> item.id)}
                }
            })
        ])
        if(!barangay){
            return res.status(400).send("Bad request")
        }
        const existingIds = new Set(existedAttendance.map((item)=> item.id))
        const newAttendance = attendanceData.filter((item)=>!existingIds.has(item.id))
        console.log({ existingIds, newAttendance});

        if(newAttendance.length > 0){
            await prisma.teamLeaderAttendance.createMany({
                data: newAttendance.map((item: any)=> {
                    return {
                        id: item.id,
                        date: new Date(item.date as string).toISOString(),
                        teamLeaderId: item.teamLeader_id,
                        status: item.status,
                        usersUid: item.userUid
                    }
                })
            })
        }

        res.status(200).send("OK")
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ message: error });
    }
})

export default route;