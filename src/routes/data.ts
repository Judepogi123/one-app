import express, { Request, Response } from 'express';
import { prisma, TeamLeaderAttendance, StabCollection, QRcode } from '../../prisma/prisma';

const route = express.Router();

route.post('/attendance', async (req: Request, res: Response) => {
  try {
    const { barangayID, attendance } = req.body;
    console.log({ barangayID, attendance });

    if (!barangayID || attendance.length === 0) {
      return res.status(400).send('Bad request');
    }
    const attendanceData: TeamLeaderAttendance[] = attendance;
    const [barangay, existedAttendance] = await prisma.$transaction([
      prisma.barangays.findUnique({
        where: {
          id: barangayID,
        },
      }),
      prisma.teamLeaderAttendance.findMany({
        where: {
          id: { in: attendanceData.map((item) => item.id) },
        },
      }),
    ]);
    if (!barangay) {
      return res.status(400).send('Bad request');
    }
    const existingIds = new Set(existedAttendance.map((item) => item.id));
    const newAttendance = attendanceData.filter((item) => !existingIds.has(item.id));
    console.log({ existingIds, newAttendance });

    if (newAttendance.length > 0) {
      await prisma.teamLeaderAttendance.createMany({
        data: newAttendance.map((item: any) => {
          return {
            id: item.id,
            date: new Date(item.date as string).toISOString(),
            teamLeaderId: item.teamLeader_id,
            status: item.status,
            usersUid: item.userUid,
          };
        }),
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error });
  }
});

route.post('/member-stabs', async (req: Request, res: Response) => {
  const data = req.body.stab as string;
  if (!data) {
    return res.status(400).json({
      success: false,
      message: 'Bad request: Missing stab ID',
    });
  }

  try {
    const checkedStab = await prisma.qRcode.findUnique({
      where: { id: data },
    });

    if (!checkedStab) {
      return res.status(200).json({
        success: false,
        message: 'QR code not found',
        code: 0,
      });
    }

    if (checkedStab.scannedDateTime !== 'N/A') {
      return res.status(200).json({
        success: false,
        message: checkedStab.scannedDateTime,
        code: 1,
      });
    }

    await prisma.qRcode.update({
      where: { id: checkedStab.id },
      data: { scannedDateTime: new Date().toISOString() },
    });

    res.status(200).json({
      success: true,
      message: 'Scan saved successfully',
      code: 2,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

route.post('update-voter-precincts', async () => {
  try {
  } catch (error) {}
});

export default route;
