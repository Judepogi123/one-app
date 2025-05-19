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

  console.log(data);

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
route.post('/barangay-list', async (req: Request, res: Response) => {
  try {
    const { zipCode } = req.body;
    console.log({ zipCode });

    if (!zipCode) {
      return res.status(400).send('Bad request!');
    }
    const parsedZipCode = parseInt(zipCode, 10);
    const [municipal, barangays] = await prisma.$transaction([
      prisma.municipals.findUnique({
        where: {
          id: parsedZipCode,
        },
      }),
      prisma.barangays.findMany({
        where: {
          municipalId: parsedZipCode,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    if (!municipal || barangays.length === 0) {
      return res.status(400).send('Municiapl or Barangay not found');
    }
    return res.status(200).send({
      municipal,
      barangayList: barangays,
    });
  } catch (error) {
    res.status(500).send(`Internal servel Error: ${error}`);
  }
});
route.post('reset-stab', async (req: Request, res: Response) => {
  try {
    const id = req.body.id;
    if (!id) {
      return res.status(400).send('Bad request');
    }
    const checked = await prisma.qRcode.findFirst({
      where: {
        id: id,
      },
    });
    if (!checked) {
      return res.status(404).send('Not found!');
    }
    await prisma.qRcode.update({
      where: {
        id: checked.id,
      },
      data: {
        scannedDateTime: 'N/A',
      },
    });
  } catch (error) {
    res.status(500).send('Internal Server error');
  }
});
route.post('/check-stab-code', async (req: Request, res: Response) => {
  try {
    const { id, barnagayNumber, zipCode, stamp } = req.body;
    console.log('ID: ', id, barnagayNumber, zipCode, stamp);

    if (!id || !barnagayNumber || !zipCode || !stamp) {
      return res.status(400).send('Bad Request');
    }
    const [barangay] = await prisma.$transaction([
      prisma.barangays.findFirst({
        where: {
          number: parseInt(barnagayNumber, 10),
          municipalId: parseInt(zipCode, 10),
        },
      }),
    ]);
    if (!barangay) {
      return res.status(400).send('Barangay not found!');
    }
    const qrData = await prisma.qRcode.findFirst({
      where: {
        voter: {
          idNumber: id,
          barangaysId: barangay.id,
        },
        stamp: parseInt(stamp, 10),
      },
    });

    if (!qrData) {
      return res.status(404).send('NO Data found!');
    }
    const voter = await prisma.voters.findUnique({
      where: {
        id: qrData.votersId as string,
      },
      include: {
        barangay: {
          select: {
            name: true,
          },
        },
        municipal: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!voter) {
      return res.status(404).send('Voter not found!');
    }
    const team = await prisma.team.findUnique({
      where: {
        id: voter.teamId as string,
      },
      include: {
        TeamLeader: {
          select: {
            voter: {
              select: {
                firstname: true,
                lastname: true,
                idNumber: true,
                id: true,
              },
            },
            barangay: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!team || !voter || !qrData)
      return res.status(200).send({ voter: null, team: null, qrCode: null });
    const { TeamLeader, ...teamProps } = team;
    const { municipal, ...voterProps } = voter;
    return res.status(200).send({
      voter: { municipality: municipal, ...voterProps },
      team: { teamLeader: TeamLeader, ...teamProps },
      qrCode: qrData,
    });
  } catch (error) {
    console.log('Error:', error);

    res.status(500).send('Internal Server Error');
  }
});
route.post('/check-stab', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    console.log('ID: ', id);

    if (!id) {
      return res.status(400).send('Bad Request');
    }
    const qrData = await prisma.qRcode.findUnique({
      where: {
        id: id.toString(),
      },
    });
    if (!qrData) {
      return res.status(404).send('NO Data found!');
    }
    const voter = await prisma.voters.findUnique({
      where: {
        id: qrData.votersId as string,
      },
      include: {
        barangay: {
          select: {
            name: true,
          },
        },
        municipal: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!voter) {
      return res.status(404).send('Voter not found!');
    }
    const team = await prisma.team.findUnique({
      where: {
        id: voter.teamId as string,
      },
      include: {
        TeamLeader: {
          select: {
            voter: {
              select: {
                firstname: true,
                lastname: true,
                idNumber: true,
                id: true,
              },
            },
            barangay: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!team || !voter || !qrData)
      return res.status(200).send({ voter: null, team: null, qrCode: null });
    const { TeamLeader, ...teamProps } = team;
    const { municipal, ...voterProps } = voter;
    return res.status(200).send({
      voter: { municipality: municipal, ...voterProps },
      team: { teamLeader: TeamLeader, ...teamProps },
      qrCode: qrData,
    });
  } catch (error) {
    console.log('Error:', error);

    res.status(500).send('Internal Server Error');
  }
});

route.post('update-voter-precincts', async () => {
  try {
  } catch (error) {}
});

export default route;
