import { prisma } from '../../prisma/prisma';
import qrcode from 'qrcode';
export const getTLData = async (
  code: string,
  level: number,
  bcID: string | undefined,
  pcID: string | undefined,
  candidateId: string,
) => {
  let headerId: any = {};
  let voterTeamId: string | undefined | null = '';
  if (level === 1 && pcID && bcID) {
    const [pc, bc] = await prisma.$transaction([
      prisma.teamLeader.findUnique({
        where: {
          id: pcID,
        },
      }),
      prisma.teamLeader.findUnique({
        where: {
          id: bcID,
        },
      }),
    ]);
    headerId = {
      barangayCoorId: bc?.id,
      purokCoorsId: pc?.purokCoorsId,
    };
    voterTeamId = pc?.teamId as string | undefined;
  } else if (level === 2) {
    const [bc] = await prisma.$transaction([
      prisma.teamLeader.findUnique({
        where: {
          id: bcID,
        },
      }),
    ]);
    headerId = {
      barangayCoorId: bc?.id,
      purokCoorsId: null,
    };
    voterTeamId = bc?.teamId as string | undefined;
  } else {
    headerId = {
      barangayCoorId: null,
      purokCoorsId: null,
    };
    voterTeamId = null;
  }
  const voter = await prisma.voters.findFirst({
    where: {
      idNumber: code,
    },
  });
  if (voter) {
    const [header] = await prisma.$transaction([
      prisma.teamLeader.findFirst({
        where: {
          votersId: voter.id,
        },
      }),
    ]);
    if (header) return header;
    else {
      const newTL = await prisma.teamLeader.create({
        data: {
          votersId: voter.id,
          barangaysId: voter.barangaysId,
          municipalsId: voter.municipalsId,
          purokId: voter.purokId as string,
          level,
          hubId: '',
          teamlLeaderQRcodesId: null,
          candidatesId: candidateId,
          ...headerId,
        },
      });
      const newTeam = await prisma.team.create({
        data: {
          teamLeaderId: newTL.id,
          candidatesId: candidateId,
          purokId: newTL.purokId as string,
          municipalsId: voter.municipalsId,
          barangaysId: voter.barangaysId,
          level,
        },
      });
      const qrcodeData = await qrcode.toDataURL(newTL.id);
      const qrCode = await prisma.teamlLeaderQRcodes.create({
        data: {
          qrCode: qrcodeData,
        },
      });
      await prisma.$transaction([
        prisma.teamLeader.update({
          where: { id: newTL.id },
          data: { teamId: newTeam.id, teamlLeaderQRcodesId: qrCode.id },
        }),
        prisma.team.update({
          where: { id: newTeam.id },
          data: { teamLeaderId: newTL.id },
        }),
        prisma.voters.update({
          where: {
            id: voter.id,
          },
          data: {
            teamId: voterTeamId,
          },
        }),
      ]);

      return newTL;
    }
  }
};
const main = async () => {
  const [members, candidateCode] = await prisma.$transaction([
    prisma.voters.findMany({
      where: {
        idNumber: { in: ['dasdas', 'dasdas'] },
      },
    }),
    prisma.candidates.findFirst({
      where: {
        code: { mode: 'insensitive', contains: 'dasdas' },
      },
      select: {
        id: true,
        code: true,
      },
    }),
  ]);
  const bc = await getTLData('A01', 3, 'dasdsa', '21312e', 'dasdasdas');
  const pc = await getTLData('A01', 2, 'dasdsa', '21312e', 'dasdasdas');
  const tl = await getTLData('A01', 1, 'dasdsa', '21312e', 'dasdasdas');

  if (tl) {
  }
};
