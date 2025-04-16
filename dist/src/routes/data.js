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
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../prisma/prisma");
const route = express_1.default.Router();
route.post('/attendance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { barangayID, attendance } = req.body;
        console.log({ barangayID, attendance });
        if (!barangayID || attendance.length === 0) {
            return res.status(400).send('Bad request');
        }
        const attendanceData = attendance;
        const [barangay, existedAttendance] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.barangays.findUnique({
                where: {
                    id: barangayID,
                },
            }),
            prisma_1.prisma.teamLeaderAttendance.findMany({
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
            yield prisma_1.prisma.teamLeaderAttendance.createMany({
                data: newAttendance.map((item) => {
                    return {
                        id: item.id,
                        date: new Date(item.date).toISOString(),
                        teamLeaderId: item.teamLeader_id,
                        status: item.status,
                        usersUid: item.userUid,
                    };
                }),
            });
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
}));
route.post('/member-stabs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body.stab;
    if (!data) {
        return res.status(400).json({
            success: false,
            message: 'Bad request: Missing stab ID',
        });
    }
    try {
        const checkedStab = yield prisma_1.prisma.qRcode.findUnique({
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
        yield prisma_1.prisma.qRcode.update({
            where: { id: checkedStab.id },
            data: { scannedDateTime: new Date().toISOString() },
        });
        res.status(200).json({
            success: true,
            message: 'Scan saved successfully',
            code: 2,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}));
route.post('update-voter-precincts', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) { }
}));
exports.default = route;
