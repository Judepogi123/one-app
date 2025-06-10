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
const stoage_1 = __importDefault(require("../config/stoage"));
const express_1 = __importDefault(require("express"));
const canvas_1 = require("canvas");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const prisma_1 = require("../config/prisma");
const qrcode_1 = __importDefault(require("qrcode"));
const data_1 = require("../utils/data");
const router = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, 'uploads');
const upload = (0, multer_1.default)({ dest: uploadDir });
router.post('/image', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    try {
        const imagePath = path_1.default.join(uploadDir, req.file.filename);
        const result = yield stoage_1.default.uploader.upload(imagePath);
        const url = yield stoage_1.default.api.resource(result.public_id);
        res.status(200).json(url);
    }
    catch (error) {
        console.log('Error uploading', error);
        res.status(500).send('Internal server error');
    }
}));
router.post('/generate-custom-id-front', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { templateId, voterIDs, all, barangayId, level } = req.body;
        console.log({ templateId, voterIDs, all, barangayId, level });
        if (!templateId || voterIDs.length === 0) {
            console.log('Error: 1');
            return res.status(400).send('Bad Request');
        }
        let tlData = [];
        if (all) {
            tlData = yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    barangaysId: barangayId,
                },
            });
        }
        else {
            tlData = yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    votersId: { in: voterIDs },
                },
                include: {
                    barangay: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                    voter: {
                        select: {
                            lastname: true,
                            level: true,
                            firstname: true,
                            id: true,
                        },
                    },
                    qrCode: {
                        select: {
                            qrCode: true,
                        },
                    },
                },
            });
        }
        const [template] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.templateId.findUnique({
                where: {
                    id: templateId,
                },
            }),
        ]);
        if (tlData.length === 0 || !template) {
            console.log('Error: 2');
            console.log({ tlData, template });
            return res.status(400).send('Bad Request: Voters or Template not found!');
        }
        const sizes = { w: 8.5, h: 10.5, Lfont: 20, Sfont: 24, LYname: 140, GYname: 125 };
        const cmToPx = 37.7953;
        const CM_TO_PT = 28.3465;
        const scaleFactor = 4;
        const IDsPerPage = 4;
        let generated = [];
        const doc = new pdfkit_1.default({ size: 'A4', margin: 0 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="VotersID.pdf"`);
        doc.pipe(res);
        const chunks = Array.from({ length: Math.ceil(tlData.length / IDsPerPage) }, (_, i) => tlData.slice(i * IDsPerPage, i * IDsPerPage + IDsPerPage));
        for (let index = 0; index < chunks.length; index++) {
            if (index > 0)
                doc.addPage();
            const chunk = chunks[index];
            for (let i = 0; i < chunk.length; i++) {
                const tl = chunk[i];
                const { voter } = tl;
                const baseWidth = sizes.w * cmToPx;
                const baseHeight = sizes.h * cmToPx;
                const width = baseWidth * scaleFactor;
                const height = baseHeight * scaleFactor;
                let voterQR = '';
                if (!tl.teamlLeaderQRcodesId) {
                    voterQR = yield qrcode_1.default.toDataURL(tl.id);
                    const qrCode = yield prisma_1.prisma.teamlLeaderQRcodes.create({
                        data: { qrCode: voterQR },
                    });
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: tl.id },
                        data: { teamlLeaderQRcodesId: qrCode.id },
                    });
                }
                else {
                    const qrCodeData = yield prisma_1.prisma.teamlLeaderQRcodes.findUnique({
                        where: { id: tl.teamlLeaderQRcodesId },
                    });
                    voterQR = (qrCodeData === null || qrCodeData === void 0 ? void 0 : qrCodeData.qrCode) || '';
                }
                const canvas = (0, canvas_1.createCanvas)(width, height);
                const ctx = canvas.getContext('2d');
                const imageUrl = template.url;
                // Load the image from the URL
                const image = yield (0, canvas_1.loadImage)(imageUrl);
                ctx.drawImage(image, 0, 0, width, height);
                const lastnameCount = (_a = voter.lastname.trim().length) !== null && _a !== void 0 ? _a : 0;
                const firstnameCount = (_b = voter.firstname.trim().length) !== null && _b !== void 0 ? _b : 0;
                const totalNameCount = firstnameCount + lastnameCount;
                console.log(totalNameCount);
                if (voterQR) {
                    const base64Data = voterQR.replace(/^data:image\/png;base64,/, '');
                    const qrImage = yield (0, canvas_1.loadImage)(Buffer.from(base64Data, 'base64'));
                    const qrX = width - 600;
                    const qrY = (height - 650) / 2;
                    const codeY = qrY + 20;
                    ctx.drawImage(qrImage, qrX, codeY, 420, 420);
                }
                const centerX = width / 2;
                if (totalNameCount >= 20) {
                    const nameY = height - 115 * scaleFactor;
                    ctx.font = `bold ${20 * scaleFactor}px Arial, sans-serif`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center'; // Align text to the right of `letterW`
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${voter.lastname},`, centerX, nameY);
                    ctx.fillText(`${voter.firstname}`, centerX, nameY + 100);
                    const barangayY = height - 65 * scaleFactor;
                    ctx.font = `${16 * scaleFactor}px Arial, sans-serif`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center'; // Align text to the right of `letterW`
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tl.barangay.name, centerX, barangayY);
                }
                else {
                    const nameY = height - 115 * scaleFactor;
                    ctx.font = `bold ${20 * scaleFactor}px Arial, sans-serif`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center'; // Align text to the right of `letterW`
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${voter.lastname}, ${voter.firstname}`, centerX, nameY);
                    const barangayY = height - 90 * scaleFactor;
                    ctx.font = `${16 * scaleFactor}px Arial, sans-serif`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center'; // Align text to the right of `letterW`
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tl.barangay.name, centerX, barangayY);
                }
                const imageBuffer = canvas.toBuffer('image/png', {
                    compressionLevel: 9,
                    resolution: 300,
                });
                const col = i % 2;
                const row = Math.floor(i / 2);
                const xOffset = 25 + col * (sizes.w * CM_TO_PT + 15);
                const yOffset = 25 + row * (sizes.h * CM_TO_PT + 15);
                doc.image(imageBuffer, xOffset, yOffset, {
                    width: sizes.w * CM_TO_PT + 3,
                    height: sizes.h * CM_TO_PT,
                });
                console.log('Voter: ', voter);
                generated.push(voter.id);
            }
        }
        if (generated.length > 0) {
            yield prisma_1.prisma.idRecords.createMany({
                data: generated.map((item) => {
                    return {
                        votersId: item,
                        templateIdId: templateId,
                    };
                }),
            });
        }
        doc.end();
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}));
router.post('/generate-custom-id-rear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { templateId, voterIDs, all, barangayId, level } = req.body;
        console.log({ templateId, voterIDs, all, barangayId, level });
        if (!templateId || voterIDs.length === 0) {
            console.log('Error: 1');
            return res.status(400).send('Bad Request');
        }
        let tlData = [];
        if (all) {
            tlData = yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    barangaysId: barangayId,
                },
            });
        }
        else {
            tlData = yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    votersId: { in: voterIDs },
                },
            });
        }
        const [template] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.templateId.findUnique({
                where: {
                    id: templateId,
                },
            }),
        ]);
        if (tlData.length === 0 || !template) {
            console.log('Error: 2');
            console.log({ tlData, template });
            return res.status(400).send('Bad Request: Voters or Template not found!');
        }
        const sizes = { w: 8.5, h: 10.5, Lfont: 20, Sfont: 24, LYname: 140, GYname: 125 };
        const cmToPx = 37.7953;
        const CM_TO_PT = 28.3465;
        const scaleFactor = 4;
        const IDsPerPage = 4;
        let generated = [];
        const doc = new pdfkit_1.default({ size: 'A4', margin: 0 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="VotersID.pdf"`);
        doc.pipe(res);
        const chunks = Array.from({ length: Math.ceil(tlData.length / IDsPerPage) }, (_, i) => tlData.slice(i * IDsPerPage, i * IDsPerPage + IDsPerPage));
        for (let index = 0; index < chunks.length; index++) {
            if (index > 0)
                doc.addPage();
            const chunk = chunks[index];
            for (let i = 0; i < chunk.length; i++) {
                const tl = chunk[i];
                const baseWidth = sizes.w * cmToPx;
                const baseHeight = sizes.h * cmToPx;
                const width = baseWidth * scaleFactor;
                const height = baseHeight * scaleFactor;
                const canvas = (0, canvas_1.createCanvas)(width, height);
                const ctx = canvas.getContext('2d');
                const imageUrl = template.url;
                // Load the image from the URL
                const image = yield (0, canvas_1.loadImage)(imageUrl);
                ctx.drawImage(image, 0, 0, width, height);
                const imageBuffer = canvas.toBuffer('image/png', {
                    compressionLevel: 9,
                    resolution: 300,
                });
                const col = i % 2;
                const row = Math.floor(i / 2);
                const xOffset = 70 + col * (sizes.w * CM_TO_PT + 15);
                const yOffset = 25 + row * (sizes.h * CM_TO_PT + 15);
                doc.image(imageBuffer, xOffset, yOffset, {
                    width: sizes.w * CM_TO_PT + 3,
                    height: sizes.h * CM_TO_PT,
                });
            }
        }
        if (generated.length > 0) {
            yield prisma_1.prisma.idRecords.createMany({
                data: generated.map((item) => {
                    return {
                        votersId: item,
                        templateIdId: templateId,
                    };
                }),
            });
        }
        doc.end();
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}));
router.post('/generate-id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id, level, barangay, selectedOnly } = req.body;
    console.log({ level, id });
    const headerLevel = (0, data_1.handleLevelLabel)(level, 0);
    console.log({ id, level, barangay, selectedOnly });
    if (!level || !barangay) {
        return res.status(400).send('Bad request');
    }
    const sizes = [
        { w: 8.5, h: 10.5, Lfont: 20, Sfont: 24, LYname: 140, GYname: 125 },
        { w: 9.4, h: 13.5, Lfont: 26, Sfont: 26, LYname: 120, GYname: 160 },
    ];
    const imageSize = headerLevel === 1 ? sizes[0] : sizes[1];
    const cmToPx = 37.7953;
    const CM_TO_PT = 28.3465;
    const scaleFactor = 4;
    const IDsPerPage = 4; // Limit per page
    try {
        let tlData = [];
        if (selectedOnly && id.length > 0) {
            tlData = yield prisma_1.prisma.teamLeader.findMany({
                where: { id: { in: id }, level: headerLevel },
                include: {
                    voter: { select: { firstname: true, lastname: true, level: true } },
                    barangay: {
                        select: {
                            number: true,
                        },
                    },
                },
            });
        }
        else {
            tlData = yield prisma_1.prisma.teamLeader.findMany({
                where: { barangaysId: barangay, level: headerLevel },
                include: {
                    voter: { select: { firstname: true, lastname: true, level: true } },
                    barangay: {
                        select: {
                            number: true,
                        },
                    },
                },
            });
        }
        if (tlData.length === 0) {
            return res.status(404).send('Voter not found');
        }
        // ✅ Ensure size exists
        const doc = new pdfkit_1.default({ size: 'A4', margin: 0 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="VotersID.pdf"`);
        doc.pipe(res);
        const chunks = Array.from({ length: Math.ceil(tlData.length / IDsPerPage) }, (_, i) => tlData.slice(i * IDsPerPage, i * IDsPerPage + IDsPerPage));
        for (let index = 0; index < chunks.length; index++) {
            if (index > 0)
                doc.addPage();
            const chunk = chunks[index];
            for (let i = 0; i < chunk.length; i++) {
                const tl = chunk[i];
                const { voter } = tl;
                // ✅ Use levelIndex instead of voter.level
                const baseWidth = imageSize.w * cmToPx;
                const baseHeight = imageSize.h * cmToPx;
                const width = baseWidth * scaleFactor;
                const height = baseHeight * scaleFactor;
                const canvas = (0, canvas_1.createCanvas)(width, height);
                const ctx = canvas.getContext('2d');
                let voterQR = '';
                if (!tl.teamlLeaderQRcodesId) {
                    voterQR = yield qrcode_1.default.toDataURL(tl.id);
                    const qrCode = yield prisma_1.prisma.teamlLeaderQRcodes.create({
                        data: { qrCode: voterQR },
                    });
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: tl.id },
                        data: { teamlLeaderQRcodesId: qrCode.id },
                    });
                }
                else {
                    const qrCodeData = yield prisma_1.prisma.teamlLeaderQRcodes.findUnique({
                        where: { id: tl.teamlLeaderQRcodesId },
                    });
                    voterQR = (qrCodeData === null || qrCodeData === void 0 ? void 0 : qrCodeData.qrCode) || '';
                }
                const bcImage = yield (0, canvas_1.loadImage)(path_1.default.join(__dirname, '../../public/images/bc.png'));
                const pcImage = yield (0, canvas_1.loadImage)(path_1.default.join(__dirname, '../../public/images/pc.png'));
                const tlImage = yield (0, canvas_1.loadImage)(path_1.default.join(__dirname, '../../public/images/tl.png'));
                const iamgeList = [tlImage, tlImage, pcImage, bcImage];
                ctx.drawImage(iamgeList[headerLevel], 0, 0, width, height);
                if (voterQR) {
                    const base64Data = voterQR.replace(/^data:image\/png;base64,/, '');
                    const qrImage = yield (0, canvas_1.loadImage)(Buffer.from(base64Data, 'base64'));
                    const qrSize = headerLevel === 1 ? 500 : 550;
                    const qrX = (width - qrSize) / 2;
                    const qrY = (height - qrSize) / 2;
                    const codeY = headerLevel !== 1 ? qrY + 20 : qrY;
                    ctx.drawImage(qrImage, qrX, codeY, qrSize, qrSize);
                }
                const bNumberX = width - width + 30;
                const bNumberY = height - 70;
                ctx.font = `bold ${14 * scaleFactor}px Arial, sans-serif`;
                ctx.fillStyle = 'black';
                ctx.textAlign = 'left'; // Align text to the right of `letterW`
                ctx.textBaseline = 'middle';
                ctx.fillText(tl.barangay.number.toString(), bNumberX, bNumberY);
                // ctx.font = `bold ${14 * scaleFactor}px Arial, sans-serif`;
                // ctx.fillStyle = "black";
                // ctx.textAlign = "right"; // Align text to the right of `letterW`
                // ctx.textBaseline = "middle";
                // ctx.fillText(`${(index * 4) + i + 1}`, width - 30, bNumberY);
                const lastnameCount = (_a = voter === null || voter === void 0 ? void 0 : voter.lastname.length) !== null && _a !== void 0 ? _a : 0;
                const firstnameCount = (_b = voter === null || voter === void 0 ? void 0 : voter.firstname.length) !== null && _b !== void 0 ? _b : 0;
                const totalNameCount = firstnameCount + lastnameCount;
                const fontSize = totalNameCount >= 16 ? imageSize.Lfont : imageSize.Sfont;
                if (totalNameCount >= 16) {
                    console.log('FontSize 1: ', fontSize);
                    ctx.font = `900 ${fontSize * scaleFactor}px Arial, sans-serif`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const yMinus = headerLevel === 1 ? 20 : 30;
                    const centerX = width / 2;
                    const nameY = height - imageSize.GYname * scaleFactor;
                    const lastName = height - (imageSize.GYname - yMinus) * scaleFactor;
                    ctx.fillText(`${voter === null || voter === void 0 ? void 0 : voter.lastname},`, centerX, nameY);
                    ctx.fillText(`${voter === null || voter === void 0 ? void 0 : voter.firstname}`, centerX, lastName);
                }
                else {
                    console.log('FontSize 2: ', fontSize);
                    ctx.font = `900 ${fontSize * scaleFactor}px Arial, sans-serif`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const centerX = width / 2;
                    const nameY = height - 125 * scaleFactor;
                    ctx.fillText(`${voter === null || voter === void 0 ? void 0 : voter.lastname}, ${voter === null || voter === void 0 ? void 0 : voter.firstname}`, centerX, nameY);
                }
                const imageBuffer = canvas.toBuffer('image/png', {
                    compressionLevel: 9,
                    resolution: 300,
                });
                const col = i % 2;
                const row = Math.floor(i / 2);
                const xOffset = 25 + col * (imageSize.w * CM_TO_PT + 15);
                const yOffset = 25 + row * (imageSize.h * CM_TO_PT + 15);
                doc.image(imageBuffer, xOffset, yOffset, {
                    width: imageSize.w * CM_TO_PT + 3,
                    height: imageSize.h * CM_TO_PT,
                });
            }
        }
        doc.end();
    }
    catch (error) {
        console.error('Error generating ID:', error);
        res.status(500).send('Error generating ID');
    }
}));
router.get('/generate-stab', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const { id } = req.query;
        const CM_TO_PT = 28.3465;
        console.log({ id });
        if (!id)
            return res.status(400).send('Bad request');
        const [stabW, stabH] = [9 * CM_TO_PT, 3.5 * CM_TO_PT];
        const MAX_VOTERS_PER_PAGE = 12;
        const COLUMN_COUNT = 2;
        const barangayData = yield prisma_1.prisma.barangays.findUnique({
            where: { id: id },
        });
        if (!barangayData)
            return res.status(404).send('Barangay not found');
        let teams = yield prisma_1.prisma.team.findMany({
            where: { barangaysId: barangayData.id, candidatesId: { not: null }, level: 1 },
            include: {
                TeamLeader: {
                    select: {
                        voter: {
                            select: { firstname: true, lastname: true, idNumber: true },
                        },
                    },
                },
                voters: {
                    select: { firstname: true, lastname: true, idNumber: true, QRcode: true, id: true },
                },
            },
            orderBy: {
                TeamLeader: {
                    voter: {
                        lastname: 'desc',
                    },
                },
            },
        });
        if (teams.length === 0)
            return res.status(404).send('No teams found');
        const doc = new pdfkit_1.default({ size: 'A4', margin: 10, compress: false });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${barangayData.name}-Teams.pdf"`);
        doc.pipe(res);
        for (const team of teams) {
            let votersChunked = [];
            for (let i = 0; i < team.voters.length; i += MAX_VOTERS_PER_PAGE) {
                votersChunked.push(team.voters.slice(i, i + MAX_VOTERS_PER_PAGE));
            }
            for (const votersSubset of votersChunked) {
                doc.addPage();
                doc
                    .fontSize(10)
                    .text(`TL: ${(_b = (_a = team === null || team === void 0 ? void 0 : team.TeamLeader) === null || _a === void 0 ? void 0 : _a.voter) === null || _b === void 0 ? void 0 : _b.lastname}, ${(_d = (_c = team === null || team === void 0 ? void 0 : team.TeamLeader) === null || _c === void 0 ? void 0 : _c.voter) === null || _d === void 0 ? void 0 : _d.firstname} (ID: ${(_f = (_e = team === null || team === void 0 ? void 0 : team.TeamLeader) === null || _e === void 0 ? void 0 : _e.voter) === null || _f === void 0 ? void 0 : _f.idNumber})`, 20, 20);
                let rowY = 30;
                let colX = 15;
                for (const [index, voter] of votersSubset.entries()) {
                    if (index % (MAX_VOTERS_PER_PAGE / COLUMN_COUNT) === 0 && index !== 0) {
                        rowY = 30;
                        colX += stabW + 1;
                    }
                    let tempOne = ((_g = voter.QRcode.find((q) => q.stamp === 1)) === null || _g === void 0 ? void 0 : _g.qrCode) || '';
                    let tempTwo = ((_h = voter.QRcode.find((q) => q.stamp === 2)) === null || _h === void 0 ? void 0 : _h.qrCode) || '';
                    if (!tempOne || !tempTwo) {
                        const [qrOne, qrTwo] = yield prisma_1.prisma.$transaction([
                            prisma_1.prisma.qRcode.create({
                                data: {
                                    qrCode: '',
                                    votersId: voter.id,
                                    stamp: 1,
                                    voterNumber: voter.idNumber,
                                },
                            }),
                            prisma_1.prisma.qRcode.create({
                                data: {
                                    qrCode: '',
                                    votersId: voter.id,
                                    stamp: 2,
                                    voterNumber: voter.idNumber,
                                },
                            }),
                        ]);
                        tempOne = yield qrcode_1.default.toDataURL(qrOne.id);
                        tempTwo = yield qrcode_1.default.toDataURL(qrTwo.id);
                        yield prisma_1.prisma.$transaction([
                            prisma_1.prisma.qRcode.update({
                                where: { id: qrOne.id },
                                data: {
                                    qrCode: tempOne,
                                },
                            }),
                            prisma_1.prisma.qRcode.update({
                                where: { id: qrTwo.id },
                                data: {
                                    qrCode: tempTwo,
                                },
                            }),
                        ]);
                    }
                    console.log({ tempOne, tempTwo });
                    const canvas = (0, canvas_1.createCanvas)(stabW * (300 / 72), stabH * (300 / 72));
                    const ctx = canvas.getContext('2d');
                    ctx.scale(300 / 72, 300 / 72);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(0, 0, stabW, stabH);
                    const qrSize = 60;
                    const qrMargin = 30;
                    const qrY = stabH / 2 - qrSize / 2;
                    for (let pos = 0; pos < 2; pos++) {
                        const qrBase64 = pos === 0 ? tempOne : tempTwo;
                        if (!qrBase64.startsWith('data:image/png;base64,')) {
                            console.error('Invalid QR Code format:', qrBase64);
                            throw new Error('Invalid QR Code format');
                        }
                        const qrImage = yield (0, canvas_1.loadImage)(qrBase64);
                        const qrX = qrMargin + pos * (stabW / 2);
                        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                        ctx.font = 'bold 10px Arial';
                        ctx.fillStyle = 'black';
                        ctx.textAlign = 'center';
                        ctx.fillText(`${barangayData.municipalId}-${barangayData.number}-${voter.idNumber}`, qrX + qrSize / 2, qrY - 5);
                        ctx.font = 'bold 10px Arial';
                        ctx.fillStyle = 'black';
                        ctx.textAlign = 'center';
                        ctx.fillText(`${pos + 1}`, qrX + qrSize / 2, qrY + qrSize + 10);
                    }
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(stabW / 2, 0);
                    ctx.lineTo(stabW / 2, stabH);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    const imageBuffer = canvas.toBuffer('image/png', {
                        resolution: 300,
                        compressionLevel: 9,
                    });
                    doc.image(imageBuffer, colX, rowY, { width: stabW, height: stabH, fit: [stabW, stabH] });
                    rowY += stabH + 1;
                }
            }
        }
        doc.end();
    }
    catch (error) {
        console.error('Error generating stab:', error);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = router;
