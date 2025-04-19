"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTLData = void 0;
const prisma_1 = require("../../prisma/prisma");
const qrcode_1 = __importDefault(require("qrcode"));
const getTLData = (code, level, bcID, pcID, candidateId) => __awaiter(void 0, void 0, void 0, function* () {
    let headerId = {};
    let voterTeamId = '';
    if (level === 1 && pcID && bcID) {
        const [pc, bc] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.teamLeader.findUnique({
                where: {
                    id: pcID,
                },
            }),
            prisma_1.prisma.teamLeader.findUnique({
                where: {
                    id: bcID,
                },
            }),
        ]);
        headerId = {
            barangayCoorId: bc === null || bc === void 0 ? void 0 : bc.id,
            purokCoorsId: pc === null || pc === void 0 ? void 0 : pc.purokCoorsId,
        };
        voterTeamId = pc === null || pc === void 0 ? void 0 : pc.teamId;
    }
    else if (level === 2) {
        const [bc] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.teamLeader.findUnique({
                where: {
                    id: bcID,
                },
            }),
        ]);
        headerId = {
            barangayCoorId: bc === null || bc === void 0 ? void 0 : bc.id,
            purokCoorsId: null,
        };
        voterTeamId = bc === null || bc === void 0 ? void 0 : bc.teamId;
    }
    else {
        headerId = {
            barangayCoorId: null,
            purokCoorsId: null,
        };
        voterTeamId = null;
    }
    const voter = yield prisma_1.prisma.voters.findFirst({
        where: {
            idNumber: code,
        },
    });
    if (voter) {
        const [header] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.teamLeader.findFirst({
                where: {
                    votersId: voter.id,
                },
            }),
        ]);
        if (header)
            return header;
        else {
            const newTL = yield prisma_1.prisma.teamLeader.create({
                data: Object.assign({ votersId: voter.id, barangaysId: voter.barangaysId, municipalsId: voter.municipalsId, purokId: voter.purokId, level, hubId: '', teamlLeaderQRcodesId: null, candidatesId: candidateId }, headerId),
            });
            const newTeam = yield prisma_1.prisma.team.create({
                data: {
                    teamLeaderId: newTL.id,
                    candidatesId: candidateId,
                    purokId: newTL.purokId,
                    municipalsId: voter.municipalsId,
                    barangaysId: voter.barangaysId,
                    level,
                },
            });
            const qrcodeData = yield qrcode_1.default.toDataURL(newTL.id);
            const qrCode = yield prisma_1.prisma.teamlLeaderQRcodes.create({
                data: {
                    qrCode: qrcodeData,
                },
            });
            yield prisma_1.prisma.$transaction([
                prisma_1.prisma.teamLeader.update({
                    where: { id: newTL.id },
                    data: { teamId: newTeam.id, teamlLeaderQRcodesId: qrCode.id },
                }),
                prisma_1.prisma.team.update({
                    where: { id: newTeam.id },
                    data: { teamLeaderId: newTL.id },
                }),
                prisma_1.prisma.voters.update({
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
});
exports.getTLData = getTLData;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const [members, candidateCode] = yield prisma_1.prisma.$transaction([
        prisma_1.prisma.voters.findMany({
            where: {
                idNumber: { in: ['dasdas', 'dasdas'] },
            },
        }),
        prisma_1.prisma.candidates.findFirst({
            where: {
                code: { mode: 'insensitive', contains: 'dasdas' },
            },
            select: {
                id: true,
                code: true,
            },
        }),
    ]);
    const bc = yield (0, exports.getTLData)('A01', 3, 'dasdsa', '21312e', 'dasdasdas');
    const pc = yield (0, exports.getTLData)('A01', 2, 'dasdsa', '21312e', 'dasdasdas');
    const tl = yield (0, exports.getTLData)('A01', 1, 'dasdsa', '21312e', 'dasdasdas');
    if (tl) {
    }
});
