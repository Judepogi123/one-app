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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
    console.log(data);
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
route.post('/barangay-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { zipCode } = req.body;
        console.log({ zipCode });
        if (!zipCode) {
            return res.status(400).send('Bad request!');
        }
        const parsedZipCode = parseInt(zipCode, 10);
        const [municipal, barangays] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.municipals.findUnique({
                where: {
                    id: parsedZipCode,
                },
            }),
            prisma_1.prisma.barangays.findMany({
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
    }
    catch (error) {
        res.status(500).send(`Internal servel Error: ${error}`);
    }
}));
route.post('reset-stab', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.body.id;
        if (!id) {
            return res.status(400).send('Bad request');
        }
        const checked = yield prisma_1.prisma.qRcode.findFirst({
            where: {
                id: id,
            },
        });
        if (!checked) {
            return res.status(404).send('Not found!');
        }
        yield prisma_1.prisma.qRcode.update({
            where: {
                id: checked.id,
            },
            data: {
                scannedDateTime: 'N/A',
            },
        });
    }
    catch (error) {
        res.status(500).send('Internal Server error');
    }
}));
route.post('/check-stab-code', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, barnagayNumber, zipCode, stamp } = req.body;
        console.log('ID: ', id, barnagayNumber, zipCode, stamp);
        if (!id || !barnagayNumber || !zipCode || !stamp) {
            return res.status(400).send('Bad Request');
        }
        const [barangay] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.barangays.findFirst({
                where: {
                    number: parseInt(barnagayNumber, 10),
                    municipalId: parseInt(zipCode, 10),
                },
            }),
        ]);
        if (!barangay) {
            return res.status(400).send('Barangay not found!');
        }
        const qrData = yield prisma_1.prisma.qRcode.findFirst({
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
        const voter = yield prisma_1.prisma.voters.findUnique({
            where: {
                id: qrData.votersId,
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
        const team = yield prisma_1.prisma.team.findUnique({
            where: {
                id: voter.teamId,
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
        const { TeamLeader } = team, teamProps = __rest(team, ["TeamLeader"]);
        const { municipal } = voter, voterProps = __rest(voter, ["municipal"]);
        return res.status(200).send({
            voter: Object.assign({ municipality: municipal }, voterProps),
            team: Object.assign({ teamLeader: TeamLeader }, teamProps),
            qrCode: qrData,
        });
    }
    catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}));
route.post('/check-stab', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body;
        console.log('ID: ', id);
        if (!id) {
            return res.status(400).send('Bad Request');
        }
        const qrData = yield prisma_1.prisma.qRcode.findUnique({
            where: {
                id: id.toString(),
            },
        });
        if (!qrData) {
            return res.status(404).send('NO Data found!');
        }
        const voter = yield prisma_1.prisma.voters.findUnique({
            where: {
                id: qrData.votersId,
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
        const team = yield prisma_1.prisma.team.findUnique({
            where: {
                id: voter.teamId,
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
        const { TeamLeader } = team, teamProps = __rest(team, ["TeamLeader"]);
        const { municipal } = voter, voterProps = __rest(voter, ["municipal"]);
        return res.status(200).send({
            voter: Object.assign({ municipality: municipal }, voterProps),
            team: Object.assign({ teamLeader: TeamLeader }, teamProps),
            qrCode: qrData,
        });
    }
    catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}));
route.post('update-voter-precincts', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) { }
}));
exports.default = route;
