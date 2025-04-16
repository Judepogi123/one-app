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
const multer_1 = __importDefault(require("multer"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
const exceljs_1 = __importDefault(require("exceljs"));
//utils
const date_1 = require("../utils/date");
const data_1 = require("../utils/data");
//database
const prisma_1 = require("../../prisma/prisma");
const graphql_1 = require("graphql");
const uploadDir = path_1.default.join(__dirname, 'uploads');
const upload = (0, multer_1.default)({ dest: uploadDir });
const drawTable = (doc, startY, headers, title, data) => {
    const col1X = 60;
    const col2X = 200;
    const col3X = 350;
    const rowHeight = 20;
    let y = startY;
    // Draw Table Header
    doc.fontSize(12).text(title, 50, y);
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    // Centered Headers
    [col1X, col2X, col3X].forEach((x, index) => {
        const textWidth = doc.widthOfString(headers[index]);
        doc.text(headers[index], x + (100 - textWidth) / 2, y + 5);
    });
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    console.log(data);
    // Draw Table Rows with Centered Data
    for (let i = 0; i < 5; i++) {
        const rowData = [``];
        [col1X, col2X, col3X].forEach((x, index) => {
            const textWidth = doc.widthOfString(rowData[index]);
            doc.text(rowData[index], x + (100 - textWidth) / 2, y + 5);
        });
        y += rowHeight;
        doc.moveTo(50, y).lineTo(550, y).stroke();
    }
};
exports.default = (io) => {
    const router = express_1.default.Router();
    router.post('/file', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const filePath = path_1.default.join(uploadDir, req.file.filename);
        try {
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            const processedData = {};
            const candidates = yield prisma_1.prisma.candidates.findMany();
            if (candidates.length <= 0) {
                return res.status(400).send('Candidates not found.');
            }
            sheets.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(worksheet);
                processedData[sheetName] = data.map((row) => {
                    const newRow = {};
                    const supporting = candidates.map((candidate) => row[candidate.code] ? candidate.id : undefined);
                    const candidateId = supporting.filter(Boolean);
                    console.log(Object.assign(Object.assign({}, row), { idol: candidateId[0] }));
                    if (row["Voter's Name"]) {
                        const [lastname, firstname] = row["Voter's Name"].split(',').map((name) => name.trim());
                        newRow.lastname = (0, data_1.handleSpecialChar)(',', lastname) || 'Unknown';
                        newRow.firstname = firstname || 'Unknown';
                    }
                    else {
                        newRow.lastname = 'Unknown';
                        newRow.firstname = 'Unknown';
                    }
                    newRow.No = row.No;
                    newRow.Birthday = (0, date_1.extractYear)(row.Birthday);
                    newRow.__EMPTY = row.__EMPTY || 'O';
                    newRow.Gender = (0, data_1.handleGender)(row.Gender);
                    newRow.Address = row.Address || 'Unknown';
                    newRow.DL = row.DL ? 'YES' : 'NO';
                    newRow.IL = row.IL ? 'YES' : 'NO';
                    newRow.INC = row.INC ? 'YES' : 'NO';
                    newRow.PWD = row.PWD ? 'YES' : 'NO';
                    newRow.OR = row.OR ? 'YES' : 'NO';
                    newRow.SC = row.SC ? 'YES' : 'NO';
                    newRow['18-30'] = row['18-30'] ? 'YES' : 'NO';
                    newRow.candidateId = candidateId[0];
                    return newRow;
                });
            });
            res.status(200).json(processedData);
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }));
    router.post('/update-voter-precincts', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const filePath = path_1.default.join(uploadDir, req.file.filename);
        try {
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            const updateResults = { success: 0, failed: 0 };
            // Process each sheet sequentially (not in parallel)
            for (const sheetName of sheets) {
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(worksheet);
                console.log(`Processing ${data.length} records from sheet ${sheetName}`);
                const chunkSize = 100;
                // Process data in chunks of 100
                for (let i = 0; i < data.length; i += chunkSize) {
                    const chunk = data.slice(i, i + chunkSize);
                    console.log(`Processing chunk starting at record ${i + 1}`);
                    // Process each voter in the current chunk
                    for (const voter of chunk) {
                        try {
                            const [existingVoter, precinct] = yield prisma_1.prisma.$transaction([
                                prisma_1.prisma.voters.findFirst({
                                    where: { idNumber: voter.No },
                                }),
                                prisma_1.prisma.precents.findFirst({
                                    where: { precintNumber: voter['PREC.'] },
                                }),
                            ]);
                            if (!existingVoter || !precinct) {
                                console.log(`Skipping - Voter or precinct not found for ID: ${voter.No}`);
                                updateResults.failed++;
                                continue;
                            }
                            yield prisma_1.prisma.voters.update({
                                where: { id: existingVoter.id },
                                data: { precintsId: precinct.id },
                            });
                            updateResults.success++;
                        }
                        catch (error) {
                            console.error(`Error updating voter ${voter.No}:`, error);
                            updateResults.failed++;
                        }
                    }
                }
            }
            res.status(200).json({
                message: 'Voter precinct update completed',
                results: updateResults,
            });
        }
        catch (error) {
            console.error('Error processing file:', error);
            res.status(500).send('Internal Server Error');
        }
        finally {
            // Clean up the uploaded file
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error('Error deleting file:', err);
            });
        }
    }));
    router.post('/draft', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const data = req.body.data;
        const zipCode = req.body.zipCode;
        const barangayId = req.body.barangayId;
        const draftID = req.body.draftID;
        if (!data) {
            return res.status(400).send('Empty list!');
        }
        //console.log(JSON.stringify(data, null, 2), "Data end");
        try {
            let rejectList = [];
            let successCounter = 0;
            const votersData = Object.values(data)
                .flat()
                .filter(Boolean);
            const voterNames = votersData.map((row) => ({
                firstname: row.firstname,
                lastname: row.lastname,
            }));
            console.log('Logged 1');
            // Fetch all existing voters once
            const existingVoters = yield prisma_1.prisma.voters.findMany({
                where: {
                    OR: voterNames,
                    barangaysId: barangayId,
                    municipalsId: parseInt(zipCode, 10),
                },
                include: {
                    barangay: true,
                    municipal: true,
                },
            });
            console.log('Logged 2');
            // const existingOverAll = await prisma.voters.findMany({
            //   where: {
            //     OR: voterNames,
            //   },
            //   include: {
            //     barangay: true,
            //     municipal: true,
            //   },
            // });
            // Map to quickly lookup existing voters
            const existingVoterMap = new Map();
            existingVoters.forEach((voter) => {
                const key = `${voter.firstname}_${voter.lastname}`;
                if (!existingVoterMap.has(key)) {
                    existingVoterMap.set(key, []);
                }
                existingVoterMap.get(key).push(voter);
            });
            console.log('Logged 3');
            const purokCache = new Map();
            const newVotersToInsert = [];
            const voterRecordsToInsert = [];
            for (const row of votersData) {
                console.log('Logged 4 candidate', row.candidateId);
                try {
                    const key = `${row.firstname}_${row.lastname}`;
                    const existingVoter = existingVoterMap.get(key);
                    // Check for existing voters
                    if ((existingVoter === null || existingVoter === void 0 ? void 0 : existingVoter.length) > 1) {
                        rejectList.push(Object.assign(Object.assign({}, row), { saveStatus: `Multiple entry in Barangay ${existingVoter[0].barangay.name}-${existingVoter[0].municipal.name}` }));
                        voterRecordsToInsert.push({
                            votersId: existingVoter[0].id,
                            desc: `Multiple entry in Barangay ${existingVoter[0].barangay.name}-${existingVoter[0].municipal.name}`,
                            questionable: true,
                        });
                        continue;
                    }
                    // if (existingOverAll?.length > 1) {
                    //   rejectList.push({
                    //     ...row,
                    //     saveStatus: `Found in ${existingOverAll.map(
                    //       (item) => `${item.barangay.name}-${item.municipal.name}, `
                    //     )}`,
                    //   });
                    //   voterRecordsToInsert.push({
                    //     votersId: existingOverAll[0].id,
                    //     desc: `Found in ${existingOverAll.map(
                    //       (item) => `${item.barangay.name}-${item.municipal.name}, `
                    //     )}`,
                    //     questionable: true,
                    //   });
                    //   continue;
                    // }
                    // Handle Purok creation with caching
                    const purokKey = `${row.Address}_${barangayId}_${zipCode}_${draftID}`;
                    let purok = purokCache.get(purokKey);
                    if (!purok) {
                        purok = yield prisma_1.prisma.purok.findFirst({
                            where: {
                                purokNumber: `${row.Address}`,
                                barangaysId: barangayId,
                                municipalsId: parseInt(zipCode, 10),
                                draftID: draftID,
                            },
                        });
                        if (!purok) {
                            purok = yield prisma_1.prisma.purok.create({
                                data: {
                                    purokNumber: `${row.Address}`,
                                    municipalsId: parseInt(zipCode, 10),
                                    barangaysId: barangayId,
                                    draftID: draftID,
                                },
                            });
                        }
                        purokCache.set(purokKey, purok);
                    }
                    // Queue for batch insertion
                    newVotersToInsert.push({
                        lastname: row.lastname,
                        firstname: row.firstname,
                        gender: row.Gender,
                        birthYear: `${row.Birthday}`,
                        barangaysId: barangayId,
                        municipalsId: parseInt(zipCode, 10),
                        newBatchDraftId: draftID,
                        calcAge: row.Birthday ? (_a = (0, date_1.extractYear)(row.Birthday)) !== null && _a !== void 0 ? _a : 0 : 0,
                        purokId: purok.id,
                        pwd: row.PWD,
                        oor: row.OR,
                        inc: row.INC,
                        illi: row.IL,
                        inPurok: true,
                        hubId: null,
                        houseHoldId: undefined,
                        mobileNumber: 'Unknown',
                        senior: row.SC === 'YES' ? true : false,
                        status: row.DL === 'YES' ? 0 : 1,
                        candidatesId: row.candidateId,
                        precintsId: undefined,
                        youth: row['18-30'] === 'YES' ? true : false,
                        idNumber: `${row.No}`,
                    });
                    successCounter++;
                    io.emit('draftedCounter', successCounter);
                }
                catch (error) {
                    console.log(row["Voter's Name"], error);
                    continue;
                }
            }
            console.log('Logged 5');
            // Batch insert voters and voter records
            if (newVotersToInsert.length > 0) {
                yield prisma_1.prisma.voters.createMany({
                    data: newVotersToInsert,
                    skipDuplicates: true,
                });
            }
            if (voterRecordsToInsert.length > 0) {
                yield prisma_1.prisma.voterRecords.createMany({
                    data: voterRecordsToInsert,
                });
            }
            res.status(200).json({
                message: 'Success',
                rejectList: rejectList || [],
                successCount: successCounter,
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ status: 'Internal server error', message: `${error}` });
        }
    }));
    router.post('/update-voters', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { zipCode, barangayId } = req.body;
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const filePath = path_1.default.join(uploadDir, req.file.filename);
        const rejectList = [];
        try {
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            let updateVoterCounter = 0;
            let validdatedVoters = 0;
            io.emit('updateVoterCounter', updateVoterCounter);
            const candidates = yield prisma_1.prisma.candidates.findMany();
            if (candidates.length <= 0) {
                return res.status(400).send('Candidates not found.');
            }
            for (const sheetName of sheets) {
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(sheet);
                for (const row of data) {
                    const newRow = {
                        lastname: 'Unknown',
                        firstname: 'Unknown',
                        DL: row.DL || undefined,
                        INC: row.INC || undefined,
                        OR: row.OR || undefined,
                    };
                    const supporting = candidates.map((candidate) => row[candidate.code] ? candidate.id : undefined);
                    if (row["Voter's Name"]) {
                        const [lastname, firstname] = row["Voter's Name"].split(',').map((name) => name.trim());
                        newRow.lastname = (0, data_1.handleSpecialChar)(',', lastname) || 'Unknown';
                        newRow.firstname = firstname || 'Unknown';
                    }
                    if (!row.DL && !row.INC && !row.OR && !supporting[0]) {
                        rejectList.push({
                            firstname: newRow.firstname,
                            lastname: newRow.lastname,
                            reason: 'Updated',
                            code: 11,
                            barangay: barangayId,
                            municipal: zipCode,
                            teamId: 'Unknown',
                            id: 'Unknown',
                        });
                        validdatedVoters++;
                        continue;
                    }
                    // Fetch voter metadata
                    const voterMetaData = yield prisma_1.prisma.voters.findFirst({
                        where: {
                            firstname: newRow.firstname,
                            lastname: newRow.lastname,
                            barangaysId: barangayId,
                        },
                    });
                    if (!voterMetaData) {
                        rejectList.push({
                            firstname: newRow.firstname,
                            lastname: newRow.lastname,
                            reason: 'Voter does not exist',
                            code: 0,
                            barangay: barangayId,
                            municipal: zipCode,
                            teamId: 'Unknown',
                            id: 'Unknown',
                        });
                        validdatedVoters++;
                        continue;
                    }
                    // Update voter data
                    yield prisma_1.prisma.voters.update({
                        where: {
                            id: voterMetaData.id,
                        },
                        data: {
                            oor: newRow.OR ? 'YES' : 'NO',
                            status: newRow.DL ? 0 : 1,
                            inc: newRow.INC ? 'YES' : 'NO',
                            candidatesId: supporting[0],
                        },
                    });
                    rejectList.push({
                        lastname: voterMetaData.lastname,
                        firstname: voterMetaData.firstname,
                        reason: 'Voter updated successfully',
                        code: 0,
                        barangay: voterMetaData.barangaysId,
                        municipal: voterMetaData.municipalsId,
                        id: voterMetaData.id,
                        teamId: 'Unknown',
                    });
                    updateVoterCounter++;
                }
            }
            const totalAreaVoters = yield prisma_1.prisma.voters.count({
                where: {
                    barangaysId: barangayId,
                },
            });
            const percentage = (updateVoterCounter / totalAreaVoters) * 100;
            yield prisma_1.prisma.validation.create({
                data: {
                    municipalsId: parseInt(zipCode, 10),
                    barangaysId: barangayId,
                    percent: percentage,
                    totalVoters: updateVoterCounter,
                },
            });
            res.status(200).json({
                results: rejectList,
                percent: percentage.toFixed(2),
                totalAreaVoters,
                totalValidatedVoter: updateVoterCounter,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).send({
                status: 'Internal server error',
                message: 'Something went wrong on the server. Please try again.',
            });
        }
    }));
    router.post('/export-pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const data = req.body;
        const { surveyCode } = data;
        try {
            const doc = new pdfkit_1.default();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${surveyCode}.pdf`);
            doc.pipe(res);
            doc
                .font('fonts/PalatinoBold.ttf')
                .fontSize(25)
                .text('Some text with an embedded font!', 100, 100);
            doc.end();
        }
        catch (error) {
            res.status(500).send({
                message: 'Something went wrong on the server. Please try again',
            });
        }
    }));
    router.post('/voter-list', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const zipCode = req.body.zipCode;
        const barangay = req.body.barangay;
        try {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
            const filePath = path_1.default.join(uploadDir, req.file.filename);
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            const processedData = {};
            const candidates = yield prisma_1.prisma.candidates.findMany();
            const barangayData = yield prisma_1.prisma.barangays.findFirst({
                where: {
                    municipalId: parseInt(zipCode, 10),
                    number: parseInt(barangay, 10),
                },
            });
            if (!barangayData) {
                throw new graphql_1.GraphQLError('Could not find any barangay with the number');
            }
            let delistedCount = 0;
            let addedCount = 0;
            const votersToAdd = [];
            const destlistedVoters = [];
            const purokCache = new Map();
            for (const sheetName of sheets) {
                const worksheet = workbook.Sheets[sheetName];
                const rows = xlsx_1.default.utils.sheet_to_json(worksheet);
                if (sheetName === 'OVERALL') {
                    console.log('Skip');
                    continue;
                }
                if (sheetName === '-') {
                    processedData[sheetName] = yield Promise.all(rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                        const newRow = {};
                        if (row["Voter's Name"]) {
                            const [lastname, firstname] = row["Voter's Name"]
                                .split(',')
                                .map((name) => name.trim());
                            newRow.lastname = (0, data_1.handleSpecialChar)(',', lastname) || 'Unknown';
                            newRow.firstname = firstname || 'Unknown';
                        }
                        else {
                            newRow.lastname = 'Unknown';
                            newRow.firstname = 'Unknown';
                        }
                        const [voter, delisted] = yield prisma_1.prisma.$transaction([
                            prisma_1.prisma.voters.findFirst({
                                where: {
                                    lastname: newRow.lastname,
                                    firstname: newRow.firstname,
                                    municipalsId: parseInt(zipCode, 10),
                                    barangaysId: barangayData.id,
                                },
                            }),
                            prisma_1.prisma.delistedVoter.findFirst({
                                where: {
                                    voter: {
                                        lastname: newRow.lastname,
                                        firstname: newRow.firstname,
                                        municipalsId: parseInt(zipCode, 10),
                                        barangaysId: barangayData.id,
                                    },
                                },
                            }),
                        ]);
                        if (delisted) {
                            console.log('Already In delisted: ', newRow.firstname, newRow.lastname);
                            return Object.assign({}, row);
                        }
                        if (voter) {
                            console.log('New In delisted: ', newRow.firstname, newRow.lastname);
                            delistedCount++;
                            destlistedVoters.push({
                                votersId: voter.id,
                                municipalsId: parseInt(zipCode, 10),
                                barangaysId: barangayData.id,
                            });
                        }
                        return Object.assign({}, row);
                    })));
                }
                if (sheetName === '+') {
                    processedData[sheetName] = yield Promise.all(rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                        var _a;
                        const newRow = {};
                        const supporting = candidates.map((candidate) => row[candidate.code] ? candidate.id : null);
                        const candidateId = supporting.filter(Boolean);
                        const purokKey = `${row.Address}_${barangayData.id}_${zipCode}`;
                        let purok = purokCache.get(purokKey);
                        if (!purok) {
                            purok = yield prisma_1.prisma.purok.findFirst({
                                where: {
                                    purokNumber: `${row.Address}`,
                                    barangaysId: barangayData.id,
                                    municipalsId: parseInt(zipCode, 10),
                                },
                            });
                            if (!purok) {
                                purok = yield prisma_1.prisma.purok.create({
                                    data: {
                                        purokNumber: `${row.Address}`,
                                        municipalsId: parseInt(zipCode, 10),
                                        barangaysId: barangayData.id,
                                        draftID: '',
                                    },
                                });
                            }
                            purokCache.set(purokKey, purok);
                        }
                        if (row["Voter's Name"]) {
                            const [lastname, firstname] = row["Voter's Name"]
                                .split(',')
                                .map((name) => name.trim());
                            newRow.lastname = (0, data_1.handleSpecialChar)(',', lastname) || 'Unknown';
                            newRow.firstname = firstname || 'Unknown';
                        }
                        else {
                            newRow.lastname = 'Unknown';
                            newRow.firstname = 'Unknown';
                        }
                        const voter = yield prisma_1.prisma.voters.findFirst({
                            where: {
                                lastname: newRow.lastname,
                                firstname: newRow.firstname,
                                municipalsId: parseInt(zipCode, 10),
                                barangaysId: barangayData.id,
                            },
                        });
                        if (voter) {
                            console.log('ALready registered: ', newRow.firstname, newRow.lastname);
                        }
                        if (!voter) {
                            votersToAdd.push({
                                lastname: newRow.lastname,
                                firstname: newRow.firstname,
                                gender: (0, data_1.handleGender)(row.Gender),
                                birthYear: `${row.Birthday}`,
                                barangaysId: barangayData.id,
                                municipalsId: parseInt(zipCode, 10),
                                newBatchDraftId: null,
                                calcAge: row.Birthday ? (_a = (0, date_1.extractYear)(row.Birthday)) !== null && _a !== void 0 ? _a : 0 : 0,
                                purokId: purok.id,
                                pwd: row.PWD ? 'YES' : 'NO',
                                oor: row.OR ? 'YES' : 'NO',
                                inc: row.INC ? 'YES' : 'NO',
                                illi: row.IL ? 'YES' : 'NO',
                                inPurok: true,
                                hubId: null,
                                houseHoldId: null,
                                mobileNumber: 'Unknown',
                                senior: row.SC === 'YES' ? true : false,
                                status: row.DL === 'YES' ? 0 : 1,
                                candidatesId: candidateId[0],
                                precintsId: null,
                                youth: row['18-30'] ? true : false,
                                idNumber: `${row.No}`,
                                level: 0,
                                saveStatus: 'listed',
                            });
                        }
                        return Object.assign({}, row);
                    })));
                }
            }
            if (votersToAdd.length > 0) {
                console.log('Processed New: ONe', votersToAdd.length);
                yield prisma_1.prisma.voters.createMany({
                    data: votersToAdd,
                    skipDuplicates: true,
                });
            }
            if (destlistedVoters.length > 0) {
                console.log('Processed Delisted ONE: ', destlistedVoters.length);
                yield prisma_1.prisma.delistedVoter.createMany({
                    data: destlistedVoters,
                    skipDuplicates: true,
                });
            }
            console.log('Processed Delisted: ', destlistedVoters.length);
            console.log('Processed New: ', votersToAdd.length);
            res.status(200).json({
                message: 'File processed successfully',
                addedCount: addedCount,
                delistedCount: delistedCount,
            });
            console.log('NOt');
        }
        catch (error) {
            console.error('Error processing file:', error);
            res.status(500).send('Internal Server Error');
        }
    }));
    router.post('/supporter-report', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const zipCode = req.body.zipCode;
        const id = req.body.id;
        const candidate = req.body.candidate;
        const barangayList = req.body.barangayList;
        const parsedData = JSON.parse(barangayList);
        console.log(JSON.stringify(parsedData, null, 2));
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            // Add a worksheet with header and footer settings
            const worksheet = workbook.addWorksheet('Supporters', {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: true,
                    showGridLines: true,
                },
                headerFooter: {
                    firstHeader: `&L&B${candidate} Supporter Report`,
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${candidate} 
          Supporter Report`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            // Define worksheet columns
            worksheet.columns = [
                { header: 'Barangay', key: 'barangay', width: 15 },
                { header: 'Figure Heads', key: 'figureHead', width: 12 },
                { header: 'BC', key: 'bc', width: 10 },
                { header: 'PC', key: 'pc', width: 10 },
                { header: 'TL', key: 'tl', width: 10 },
                { header: 'Voters W/team', key: 'withTeam', width: 16 },
                // { header: "Voters W/o team", key: "withoutTeam", width: 16 },
                { header: '10+', key: 'aboveTen', width: 10 },
                { header: '10', key: 'equalTen', width: 10 },
                { header: '6-10', key: 'belowTen', width: 10 },
                { header: '5', key: 'equalFive', width: 10 },
                { header: '4', key: 'belowFive', width: 10 },
                { header: '1-3', key: 'belowEqualThree', width: 10 },
                { header: '0', key: 'noMembers', width: 10 },
                { header: 'OR', key: 'orMembers', width: 10 },
                { header: 'Dead inTeam', key: 'orMembers', width: 12 },
                { header: 'Population', key: 'population', width: 10 },
            ];
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true }; // Make text bold
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                }; // Add borders (optional)
            });
            const sheetData = parsedData.map((item) => {
                return {
                    barangay: item.name,
                    figureHead: item.supporters.figureHeads,
                    bc: item.supporters.bc,
                    pc: item.supporters.pc,
                    tl: item.supporters.tl,
                    withTeam: item.supporters.withTeams,
                    // withoutTeam: item.supporters.voterWithoutTeam,
                    aboveTen: item.teamStat.aboveMax,
                    equalTen: item.teamStat.equalToMax,
                    belowTen: item.teamStat.belowMax,
                    equalFive: item.teamStat.equalToMin,
                    belowFive: item.teamStat.belowMin,
                    belowEqualThree: item.teamStat.threeAndBelow,
                    noMembers: item.teamStat.noMembers,
                    orMembers: item.supporters.orMembers,
                    population: item.barangayVotersCount,
                };
            });
            worksheet.addRows(sheetData);
            const footerRow = worksheet.addRow({
                barangay: 'Total', // Label for the footer row
                figureHead: sheetData.reduce((sum, row) => sum + (row.figureHead || 0), 0),
                bc: sheetData.reduce((sum, row) => sum + (row.bc || 0), 0),
                pc: sheetData.reduce((sum, row) => sum + (row.pc || 0), 0),
                tl: sheetData.reduce((sum, row) => sum + (row.tl || 0), 0),
                withTeam: sheetData.reduce((sum, row) => sum + (row.withTeam || 0), 0),
                // withoutTeam: sheetData.reduce(
                //   (sum, row) => sum + (row.withoutTeam || 0),
                //   0
                // ),
                aboveTen: sheetData.reduce((sum, row) => sum + (row.aboveTen || 0), 0),
                equalTen: sheetData.reduce((sum, row) => sum + (row.equalTen || 0), 0),
                belowTen: sheetData.reduce((sum, row) => sum + (row.belowTen || 0), 0),
                equalFive: sheetData.reduce((sum, row) => sum + (row.equalFive || 0), 0),
                belowFive: sheetData.reduce((sum, row) => sum + (row.belowFive || 0), 0),
                belowEqualThree: sheetData.reduce((sum, row) => sum + (row.belowEqualThree || 0), 0),
                noMembers: sheetData.reduce((sum, row) => sum + (row.noMembers || 0), 0),
                orMembers: sheetData.reduce((sum, row) => sum + (row.orMembers || 0), 0),
                population: sheetData.reduce((sum, row) => sum + (row.population || 0), 0),
            });
            // Style the footer row
            footerRow.eachCell((cell, colNumber) => {
                cell.font = { bold: true }; // Make text bold
                cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center-align
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
            // Write the workbook directly to the response stream
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error('Error generating report:', error);
            res.status(500).send('Internal Server Error');
        }
    }));
    router.post('/supporter-report-barangay', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!req.body) {
            res.status(403).send({
                message: 'No data provided',
            });
        }
        const temp = JSON.parse(req.body.barangay);
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const worksheetNames = new Set();
            console.log('All PC: ', temp.leaders.length);
            console.log('All PC handle: ', temp.leaders.reduce((acc, num) => acc + (num.teamList.length || 0), 0));
            for (let item of temp.leaders) {
                const totalVoters = item.teamList.reduce((acc, team) => acc + (team.votersCount || 0), 0);
                console.log('Team: ', totalVoters);
                // Generate the initial worksheet name
                let worksheetName = `${(_a = item.voter) === null || _a === void 0 ? void 0 : _a.idNumber}-${(_b = item.voter) === null || _b === void 0 ? void 0 : _b.lastname}, ${(_c = item.voter) === null || _c === void 0 ? void 0 : _c.firstname}`;
                // Ensure the name is unique
                let counter = 1;
                while (worksheetNames.has(worksheetName)) {
                    worksheetName = `${(_d = item.voter) === null || _d === void 0 ? void 0 : _d.idNumber}-${(_e = item.voter) === null || _e === void 0 ? void 0 : _e.lastname}, ${(_f = item.voter) === null || _f === void 0 ? void 0 : _f.firstname} (${counter})`;
                    counter++;
                }
                // Add the unique name to the set
                worksheetNames.add(worksheetName);
                // Create the worksheet with the unique name
                const worksheet = workbook.addWorksheet(worksheetName, {
                    pageSetup: {
                        paperSize: 9,
                        orientation: 'portrait',
                        fitToPage: true,
                        showGridLines: true,
                    },
                    headerFooter: {
                        firstHeader: `&L&B${(_g = item.voter) === null || _g === void 0 ? void 0 : _g.lastname}, ${(_h = item.voter) === null || _h === void 0 ? void 0 : _h.firstname} (Purok)`,
                        firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                        oddHeader: `&L&B  ${temp.name} PC: ${(_j = item.voter) === null || _j === void 0 ? void 0 : _j.lastname}, ${(_k = item.voter) === null || _k === void 0 ? void 0 : _k.firstname} (${(_l = item.voter) === null || _l === void 0 ? void 0 : _l.idNumber})
             Handled TL list`,
                        oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    },
                });
                worksheet.columns = [
                    { header: 'ID', key: 'id', width: 6 },
                    { header: 'Fullname', key: 'fullname', width: 40 },
                    { header: 'Members', key: 'members', width: 10 },
                    { header: 'Merge 1', key: 'merge1', width: 10 },
                    { header: 'Merge 2', key: 'merge2', width: 10 },
                    { header: 'Merge 3', key: 'merge3', width: 10 },
                ];
                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
                const sheetData = item.teamList.map((team) => {
                    var _a, _b, _c, _d, _e, _f;
                    return {
                        id: (_b = (_a = team.teamLeader) === null || _a === void 0 ? void 0 : _a.voter) === null || _b === void 0 ? void 0 : _b.idNumber,
                        fullname: `${(_d = (_c = team.teamLeader) === null || _c === void 0 ? void 0 : _c.voter) === null || _d === void 0 ? void 0 : _d.lastname}, ${(_f = (_e = team.teamLeader) === null || _e === void 0 ? void 0 : _e.voter) === null || _f === void 0 ? void 0 : _f.firstname}`,
                        members: team.votersCount,
                        merge1: '',
                        merge2: '',
                        merge3: '',
                    };
                });
                const addedRows = worksheet.addRows(sheetData);
                const footers = worksheet.addRow({
                    id: 'Total',
                    fullname: item.teamList.length,
                    members: sheetData.reduce((sum, row) => sum + (row.members || 0), 0),
                    merge1: '',
                    merge2: '',
                    merge3: '',
                });
                footers.eachCell((cell, colNumber) => {
                    cell.font = { bold: true }; // Make text bold
                    cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center-align
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
                addedRows.forEach((row) => {
                    const cellValue = row.getCell('members').value;
                    if (typeof cellValue === 'number' && cellValue < 5) {
                        row.eachCell((cell) => {
                            cell.font = {
                                color: { argb: 'FFFFA500' },
                            };
                        });
                    }
                });
            }
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
            yield workbook.xlsx.write(res);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ message: 'Internal Server Error' });
        }
        // try {
        //   const area = await prisma.barangays.findMany({
        //     where: {
        //       municipalId: parseInt(zipCode, 10),
        //     },
        //     include: {
        //       TeamLeader: {
        //         select: {
        //           _count: {},
        //         },
        //       },
        //     },
        //   });
        //   const team = await prisma.team.findMany({
        //     where: {
        //       barangaysId: { in: area.map((item) => item.id) }, // Filter by barangay ID
        //     },
        //     include: {
        //       _count: {
        //         select: {
        //           voters: true,
        //         },
        //       },
        //     },
        //   });
        // } catch (error) {}
    }), router.post('/custom-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const barangayId = req.body.barangayId;
        if (!barangayId) {
            res.status(400).json({ message: 'Bad Request' });
            return;
        }
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            let skip = 0;
            let haveMore = true;
            const readyToInsert = [];
            // Fetch barangay details
            const barangay = yield prisma_1.prisma.barangays.findUnique({
                where: { id: barangayId },
            });
            if (!barangay) {
                res.status(404).json({ message: 'Barangay not found' });
                return;
            }
            const worksheet = workbook.addWorksheet(barangay.name, {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: false,
                    showGridLines: true,
                    margins: {
                        left: 0.6,
                        right: 0.6,
                        top: 0.5,
                        bottom: 0.5,
                        header: 0.3,
                        footer: 0.3,
                    },
                },
                headerFooter: {
                    firstHeader: ``,
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${barangay.name} Voter's List`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            worksheet.columns = [
                { header: 'No.', key: 'no', width: 4 },
                { header: 'ID', key: 'id', width: 6 },
                { header: 'Fullname', key: 'fullname', width: 40 },
                { header: 'Purok', key: 'purok', width: 12 },
                { header: 'OR', key: 'or' },
                { header: 'DEAD', key: 'dead' },
                { header: 'INC', key: 'inc' },
                { header: 'JML', key: 'jml' },
                { header: 'RT', key: 'rt' },
                { header: 'FH', key: 'fh' },
            ];
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            while (haveMore) {
                const voters = yield prisma_1.prisma.voters.findMany({
                    where: {
                        OR: [{ oor: 'NO' }, { inc: 'NO' }, { status: 1 }],
                        barangaysId: barangay.id,
                        candidatesId: null,
                        teamId: null,
                        DelistedVoter: {
                            none: {},
                        },
                        WhiteList: {
                            none: {},
                        },
                    },
                    include: {
                        purok: {
                            select: {
                                purokNumber: true,
                            },
                        },
                    },
                    skip,
                    take: 50,
                    orderBy: { lastname: 'asc' },
                });
                if (voters.length === 0) {
                    haveMore = false;
                    break;
                }
                voters.forEach((voter) => {
                    var _a, _b, _c;
                    const matchIndex = readyToInsert.findIndex((item) => { var _a; return item.purok === ((_a = voter.purok) === null || _a === void 0 ? void 0 : _a.purokNumber); });
                    if (matchIndex !== -1) {
                        readyToInsert[matchIndex].list.push({
                            id: voter.idNumber,
                            fullname: `${voter.lastname}, ${voter.firstname}`,
                            purok: (_a = voter.purok) === null || _a === void 0 ? void 0 : _a.purokNumber,
                        });
                    }
                    else {
                        readyToInsert.push({
                            purok: (_b = voter.purok) === null || _b === void 0 ? void 0 : _b.purokNumber,
                            list: [
                                {
                                    id: voter.idNumber,
                                    fullname: `${voter.lastname}, ${voter.firstname}`,
                                    purok: (_c = voter.purok) === null || _c === void 0 ? void 0 : _c.purokNumber,
                                },
                            ],
                        });
                    }
                });
                skip += 50;
            }
            const flattenedList = readyToInsert
                .flatMap((entry) => entry.list)
                .map((item, i) => {
                return {
                    no: i + 1,
                    id: item.id,
                    fullname: item.fullname,
                    purok: item.purok,
                    or: '',
                    dead: '',
                    inc: '',
                    jml: '',
                    rt: '',
                    fh: '',
                };
            });
            worksheet.addRows(flattenedList);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
            yield workbook.xlsx.write(res);
            res.end(); // Ensure the response is closed
        }
        catch (error) {
            console.error('Error generating Excel file:', error);
            res.status(500).send('Internal Server Error');
        }
    })), router.post('/validation-untracked', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const barangayId = req.body.barangayId;
        if (!barangayId) {
            res.status(400).json({ message: 'Bad Request' });
            return;
        }
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            let skip = 0;
            let haveMore = true;
            const readyToInsert = [];
            // Fetch barangay details
            const barangay = yield prisma_1.prisma.barangays.findUnique({
                where: { id: barangayId },
            });
            if (!barangay) {
                res.status(404).json({ message: 'Barangay not found' });
                return;
            }
            const worksheet = workbook.addWorksheet(barangay.name, {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: false,
                    showGridLines: true,
                    margins: {
                        left: 0.6,
                        right: 0.6,
                        top: 0.5, // Top margin in inches
                        bottom: 0.5, // Bottom margin in inches
                        header: 0.3, // Header margin in inches
                        footer: 0.3, // Footer margin in inches
                    },
                },
                headerFooter: {
                    firstHeader: ``,
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${barangay.name} Voter's List`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            worksheet.columns = [
                { header: 'No.', key: 'no', width: 4 },
                { header: 'ID', key: 'id', width: 6 },
                { header: 'Team Leader', key: 'tl', width: 40 },
                { header: 'Purok', key: 'purok', width: 12 },
            ];
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            while (haveMore) {
                const teams = yield prisma_1.prisma.team.findMany({
                    include: {
                        TeamLeader: {
                            include: {
                                voter: true,
                            },
                        },
                        voters: {
                            where: {
                                UntrackedVoter: {
                                    some: {},
                                },
                            },
                        },
                    },
                    take: 10,
                    skip: skip !== null && skip !== void 0 ? skip : 0,
                });
                const voters = yield prisma_1.prisma.voters.findMany({
                    where: {
                        OR: [{ oor: 'NO' }, { inc: 'NO' }, { status: 1 }],
                        barangaysId: barangay.id,
                        candidatesId: null,
                        teamId: null,
                        DelistedVoter: {
                            none: {},
                        },
                        WhiteList: {
                            none: {},
                        },
                    },
                    include: {
                        purok: {
                            select: {
                                purokNumber: true,
                            },
                        },
                    },
                    skip,
                    take: 50,
                    orderBy: { lastname: 'asc' },
                });
                if (voters.length === 0) {
                    haveMore = false;
                    break;
                }
                voters.forEach((voter) => {
                    var _a, _b, _c;
                    const matchIndex = readyToInsert.findIndex((item) => { var _a; return item.purok === ((_a = voter.purok) === null || _a === void 0 ? void 0 : _a.purokNumber); });
                    if (matchIndex !== -1) {
                        readyToInsert[matchIndex].list.push({
                            id: voter.idNumber,
                            fullname: `${voter.lastname}, ${voter.firstname}`,
                            purok: (_a = voter.purok) === null || _a === void 0 ? void 0 : _a.purokNumber,
                        });
                    }
                    else {
                        readyToInsert.push({
                            purok: (_b = voter.purok) === null || _b === void 0 ? void 0 : _b.purokNumber,
                            list: [
                                {
                                    id: voter.idNumber,
                                    fullname: `${voter.lastname}, ${voter.firstname}`,
                                    purok: (_c = voter.purok) === null || _c === void 0 ? void 0 : _c.purokNumber,
                                },
                            ],
                        });
                    }
                });
                skip += 50;
            }
            const flattenedList = readyToInsert
                .flatMap((entry) => entry.list)
                .map((item, i) => {
                return {
                    no: i + 1,
                    id: item.id,
                    fullname: item.fullname,
                    purok: item.purok,
                };
            });
            worksheet.addRows(flattenedList);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
            yield workbook.xlsx.write(res);
            res.end(); // Ensure the response is closed
        }
        catch (error) {
            console.error('Error generating Excel file:', error);
            res.status(500).send('Internal Server Error');
        }
    })), router.post('/duplicated', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const zipCode = req.body.zipCode;
        console.log({ zipCode });
        if (!zipCode) {
            res.status(400).json({ message: 'Bad Request' });
            return;
        }
        try {
            const municipal = yield prisma_1.prisma.municipals.findUnique({
                where: {
                    id: parseInt(zipCode, 10),
                },
            });
            if (!municipal) {
                res.status(404).json({ message: 'Municipal not found' });
                return;
            }
            let skip = 0;
            let hasMore = true;
            let grouped = [];
            while (hasMore) {
                const duplicated = yield prisma_1.prisma.duplicateteamMembers.findMany({
                    where: {
                        municipalsId: municipal.id,
                    },
                    skip: skip,
                    take: 50,
                    include: {
                        teamFounIn: {
                            include: {
                                TeamLeader: {
                                    include: {
                                        voter: {
                                            select: {
                                                id: true,
                                                lastname: true,
                                                firstname: true,
                                                idNumber: true,
                                            },
                                        },
                                        purokCoors: {
                                            select: {
                                                voter: {
                                                    select: {
                                                        id: true,
                                                        lastname: true,
                                                        firstname: true,
                                                        idNumber: true,
                                                    },
                                                },
                                            },
                                        },
                                        barangayCoor: {
                                            select: {
                                                voter: {
                                                    select: {
                                                        id: true,
                                                        lastname: true,
                                                        firstname: true,
                                                        idNumber: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        team: {
                            include: {
                                TeamLeader: {
                                    include: {
                                        voter: {
                                            select: {
                                                id: true,
                                                lastname: true,
                                                firstname: true,
                                                idNumber: true,
                                            },
                                        },
                                        purokCoors: {
                                            select: {
                                                voter: {
                                                    select: {
                                                        id: true,
                                                        lastname: true,
                                                        firstname: true,
                                                        idNumber: true,
                                                    },
                                                },
                                            },
                                        },
                                        barangayCoor: {
                                            select: {
                                                voter: {
                                                    select: {
                                                        id: true,
                                                        lastname: true,
                                                        firstname: true,
                                                        idNumber: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        barangay: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        voter: {
                            select: {
                                id: true,
                                idNumber: true,
                            },
                        },
                    },
                    orderBy: {
                        barangay: {
                            name: 'asc',
                        },
                    },
                });
                if (duplicated.length === 0) {
                    hasMore = false;
                    break;
                }
                else {
                    const data = duplicated.map((item) => {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
                        return ({
                            barangay: item.barangay.name,
                            '1bc': (_d = (_c = (_b = (_a = item.team) === null || _a === void 0 ? void 0 : _a.TeamLeader) === null || _b === void 0 ? void 0 : _b.barangayCoor) === null || _c === void 0 ? void 0 : _c.voter) === null || _d === void 0 ? void 0 : _d.idNumber,
                            '1pc': (_h = (_g = (_f = (_e = item.team) === null || _e === void 0 ? void 0 : _e.TeamLeader) === null || _f === void 0 ? void 0 : _f.purokCoors) === null || _g === void 0 ? void 0 : _g.voter) === null || _h === void 0 ? void 0 : _h.idNumber,
                            '1tl': (_l = (_k = (_j = item.team) === null || _j === void 0 ? void 0 : _j.TeamLeader) === null || _k === void 0 ? void 0 : _k.voter) === null || _l === void 0 ? void 0 : _l.idNumber,
                            '2bc': (_q = (_p = (_o = (_m = item.teamFounIn) === null || _m === void 0 ? void 0 : _m.TeamLeader) === null || _o === void 0 ? void 0 : _o.barangayCoor) === null || _p === void 0 ? void 0 : _p.voter) === null || _q === void 0 ? void 0 : _q.idNumber,
                            '2pc': (_u = (_t = (_s = (_r = item.teamFounIn) === null || _r === void 0 ? void 0 : _r.TeamLeader) === null || _s === void 0 ? void 0 : _s.purokCoors) === null || _t === void 0 ? void 0 : _t.voter) === null || _u === void 0 ? void 0 : _u.idNumber,
                            '2tl': (_x = (_w = (_v = item.teamFounIn) === null || _v === void 0 ? void 0 : _v.TeamLeader) === null || _w === void 0 ? void 0 : _w.voter) === null || _x === void 0 ? void 0 : _x.idNumber,
                            voter: (_y = item.voter) === null || _y === void 0 ? void 0 : _y.idNumber,
                        });
                    });
                    grouped.push(...data); // Flattening the array
                    skip += duplicated.length; // Correct pagination
                }
            }
            // Generate Excel file regardless of whether grouped.length is 0
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const worksheet = workbook.addWorksheet(municipal.name, {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: false,
                    showGridLines: true,
                    margins: {
                        left: 0.6,
                        right: 0.6,
                        top: 0.5,
                        bottom: 0.5,
                        header: 0.3,
                        footer: 0.3,
                    },
                },
                headerFooter: {
                    firstHeader: ``,
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${municipal.name} Double Entry List`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            worksheet.columns = [
                { header: 'Barangay', key: 'barangay', width: 12 },
                { header: '1st BC', key: '1bc', width: 10 },
                { header: '1st PC', key: '1pc', width: 10 },
                { header: '1st TL', key: '1tl', width: 10 },
                { header: '2nd BC', key: '2bc', width: 10 },
                { header: '2nd PC', key: '2pc', width: 10 },
                { header: '2nd TL', key: '2tl', width: 10 },
                { header: 'Voter ID', key: 'voter', width: 10 },
            ];
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            worksheet.addRows(grouped);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    })), router.post('/barangay-validation-result', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const barangayId = req.body.barangayId;
            const untracked = req.body.untracked;
            const orMembers = req.body.orMembers;
            const delisted = req.body.delisted;
            const filtered = {};
            console.log({ barangayId, untracked, orMembers, delisted });
            if (!barangayId) {
                return res.status(400).send('Bad request');
            }
            const barangay = yield prisma_1.prisma.barangays.findUnique({
                where: {
                    id: barangayId,
                },
            });
            if (!barangay) {
                return res.status(404).send('Barangay not found!');
            }
            if (delisted) {
                filtered.DelistedVoter = {
                    select: {
                        id: true,
                    },
                };
            }
            if (untracked) {
                filtered.UntrackedVoter = {
                    select: {
                        id: true,
                    },
                };
            }
            if (orMembers) {
                filtered.oor = 'YES';
            }
            const teams = yield prisma_1.prisma.team.findMany({
                where: {
                    barangaysId: barangay.id,
                    level: 1,
                },
                include: {
                    voters: {
                        where: {
                            level: 0,
                        },
                        select: {
                            firstname: true,
                            oor: true,
                            lastname: true,
                            idNumber: true,
                            level: true,
                            status: true,
                            DelistedVoter: {
                                select: {
                                    id: true,
                                },
                            },
                            UntrackedVoter: {
                                select: {
                                    id: true,
                                },
                            },
                            ValdilatedMembers: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                    TeamLeader: {
                        select: {
                            voter: {
                                select: {
                                    firstname: true,
                                    lastname: true,
                                    idNumber: true,
                                    level: true,
                                },
                            },
                            purokCoors: {
                                select: {
                                    voter: {
                                        select: {
                                            firstname: true,
                                            lastname: true,
                                            idNumber: true,
                                            level: true,
                                        },
                                    },
                                },
                            },
                            barangayCoor: {
                                select: {
                                    voter: {
                                        select: {
                                            firstname: true,
                                            lastname: true,
                                            idNumber: true,
                                            level: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    TeamLeader: {
                        voter: {
                            lastname: 'asc',
                        },
                    },
                },
            });
            if (teams.length === 0) {
                return res.status(404).send('No Teams found!');
            }
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const worksheet = workbook.addWorksheet(barangay.name, {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: false,
                    showGridLines: true,
                    margins: {
                        left: 0.6,
                        right: 0.6,
                        top: 0.5,
                        bottom: 0.5,
                        header: 0.3,
                        footer: 0.3,
                    },
                },
                headerFooter: {
                    firstHeader: ``,
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${barangay.name} Voter's List`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            worksheet.columns = [
                { header: 'Teams', key: 'tl', width: 50 },
                // { header: "Members", key: "members", width: 40 },
                { header: 'Tags', key: 'members', width: 15 },
            ];
            const dataRows = [];
            teams.forEach((team, i) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                console.log(JSON.stringify(team, null, 2));
                const bc = ((_b = (_a = team.TeamLeader) === null || _a === void 0 ? void 0 : _a.barangayCoor) === null || _b === void 0 ? void 0 : _b.voter)
                    ? `     ${(0, data_1.handleLevel)((_c = team.TeamLeader.barangayCoor) === null || _c === void 0 ? void 0 : _c.voter.level)} = ${(_d = team.TeamLeader.barangayCoor) === null || _d === void 0 ? void 0 : _d.voter.idNumber} - ${(_e = team.TeamLeader.barangayCoor) === null || _e === void 0 ? void 0 : _e.voter.lastname}, ${(_f = team.TeamLeader.barangayCoor) === null || _f === void 0 ? void 0 : _f.voter.firstname}`
                    : 'No BC';
                const pc = ((_h = (_g = team.TeamLeader) === null || _g === void 0 ? void 0 : _g.purokCoors) === null || _h === void 0 ? void 0 : _h.voter)
                    ? `     ${(0, data_1.handleLevel)((_j = team.TeamLeader.purokCoors) === null || _j === void 0 ? void 0 : _j.voter.level)} = ${(_k = team.TeamLeader.purokCoors) === null || _k === void 0 ? void 0 : _k.voter.idNumber} - ${(_l = team.TeamLeader.purokCoors) === null || _l === void 0 ? void 0 : _l.voter.lastname}, ${(_m = team.TeamLeader.purokCoors) === null || _m === void 0 ? void 0 : _m.voter.firstname}`
                    : 'No PC';
                const teamLeader = ((_o = team.TeamLeader) === null || _o === void 0 ? void 0 : _o.voter)
                    ? `${i + 1}. ${(0, data_1.handleLevel)(team.TeamLeader.voter.level)} = ${team.TeamLeader.voter.idNumber} - ${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname} (${team.voters.length})`
                    : 'No Leader';
                // Define proper type for voter
                const members = team.voters.map((voter) => `     ${voter === null || voter === void 0 ? void 0 : voter.idNumber} - ${voter === null || voter === void 0 ? void 0 : voter.lastname}, ${voter === null || voter === void 0 ? void 0 : voter.firstname}`);
                const membersTags = team.voters.map((voter) => {
                    const tags = [];
                    if ((voter === null || voter === void 0 ? void 0 : voter.status) === 0)
                        tags.push('D');
                    if ((voter === null || voter === void 0 ? void 0 : voter.oor) === 'YES')
                        tags.push('OR');
                    if ((voter === null || voter === void 0 ? void 0 : voter.DelistedVoter.length) > 0)
                        tags.push('DL');
                    if ((voter === null || voter === void 0 ? void 0 : voter.UntrackedVoter.length) > 0)
                        tags.push('UN');
                    // Add other conditions as needed
                    return `[${tags.join(',')}]`;
                });
                dataRows.push([bc]);
                dataRows.push([pc]);
                dataRows.push([teamLeader]);
                dataRows.push(['Members']);
                team.timestamp &&
                    dataRows.push([`Joined at: ${(0, data_1.formatToLocalPHTime)(team.timestamp)}`]);
                // Add members with their tags
                team.voters.forEach((voter, index) => {
                    dataRows.push([members[index], membersTags[index]]);
                });
                dataRows.push(['']); // Empty row between teams
            });
            worksheet.addRows(dataRows);
            // Set the response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${barangay.name}_validation.xlsx`);
            // Send the Excel file
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    })), router.post('/validation-result', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const zipCode = req.body.zipCode;
        console.log(zipCode);
        if (!zipCode) {
            res.status(400).json({ message: 'Bad Request' });
            return;
        }
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const municpal = yield prisma_1.prisma.municipals.findUnique({
                where: {
                    id: parseInt(zipCode, 10),
                },
            });
            if (!municpal) {
                res.status(404).json({ message: 'Municipal not found' });
                return;
            }
            const barangays = yield prisma_1.prisma.barangays.findMany({
                where: {
                    municipalId: parseInt(zipCode, 10),
                },
                include: {
                    TeamLeader: {
                        select: {
                            id: true,
                        },
                    },
                    voters: {
                        where: {
                            level: 0,
                            teamId: { not: null },
                            candidatesId: { not: null },
                        },
                        select: {
                            id: true,
                            oor: true,
                            status: true,
                            inc: true,
                            ValdilatedMembers: {
                                select: {
                                    id: true,
                                },
                            },
                            VoterRecords: {
                                select: {
                                    type: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });
            const worksheet = workbook.addWorksheet(municpal.name, {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: false,
                    showGridLines: true,
                    margins: {
                        left: 0.6,
                        right: 0.6,
                        top: 0.5,
                        bottom: 0.5,
                        header: 0.3,
                        footer: 0.3,
                    },
                },
                headerFooter: {
                    firstHeader: ``,
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${municpal.name} Validation Results`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            worksheet.columns = [
                { header: 'Barangay', key: 'barangay', width: 14 },
                { header: 'TL', key: 'tl', width: 6 },
                { header: 'Members', key: 'Members', width: 6 },
                { header: 'Validated Members', key: 'vm', width: 14 },
                { header: 'DEAD', key: 'dead', width: 8 },
                { header: 'OR', key: 'or', width: 6 },
                { header: 'UD', key: 'ud', width: 6 },
                { header: 'ND', key: 'nd', width: 6 },
                { header: 'OP', key: 'op', width: 6 },
                { header: 'INC', key: 'inc', width: 6 },
            ];
            const data = [];
            for (let item of barangays) {
                data.push({
                    barangay: item.name,
                    tl: item.TeamLeader.length,
                    Members: item.voters.length,
                    vm: item.voters.filter((voter) => voter.ValdilatedMembers.length > 0).length,
                    dead: item.voters.filter((voter) => voter.status === 0).length,
                    or: item.voters.filter((voter) => voter.oor === 'YES').length,
                    inc: item.voters.filter((voter) => voter.inc === 'YES').length,
                });
            }
            worksheet.addRows(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
            yield workbook.xlsx.write(res);
            res.end(); // Ensure the response is closed
        }
        catch (error) {
            res.status(500).send('Internal Server Error');
        }
    })), router.get('/team-breakdown', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const zipCode = req.query.zipCode;
            const barangay = req.query.barangay;
            console.log({ zipCode, barangay });
            if (!zipCode || !barangay) {
                return res.status(400).json({ message: 'Bad Request' });
            }
            // Fetch municipal and barangay info
            const [municipal, barangayData] = yield prisma_1.prisma.$transaction([
                prisma_1.prisma.municipals.findUnique({
                    where: { id: parseInt(zipCode, 10) },
                    include: {
                        barangays: { select: { id: true, name: true } },
                    },
                }),
                prisma_1.prisma.barangays.findUnique({ where: { id: barangay } }),
            ]);
            if (!municipal || !barangayData) {
                return res.status(404).json({ message: 'Area not found' });
            }
            let teamToInsert = [];
            let skip = 0;
            let haveMore = true;
            while (haveMore) {
                const teams = yield prisma_1.prisma.team.findMany({
                    where: {
                        municipalsId: municipal.id,
                        barangaysId: barangay,
                        level: 1,
                    },
                    skip,
                    take: 50,
                    orderBy: { id: 'asc' },
                    include: {
                        voters: {
                            select: { id: true, idNumber: true, firstname: true, lastname: true },
                        },
                        TeamLeader: {
                            select: {
                                voter: {
                                    select: { id: true, idNumber: true, firstname: true, lastname: true },
                                },
                            },
                        },
                        _count: {
                            select: {
                                voters: true,
                            },
                        },
                    },
                });
                if (teams.length === 0) {
                    haveMore = false;
                }
                else {
                    teamToInsert.push(...teams.filter((item) => item._count.voters < 4));
                    skip += teams.length;
                }
            }
            if (teamToInsert.length === 0) {
                return res.status(404).json({ message: 'No teams found' });
            }
            // Create Excel file
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const worksheet = workbook.addWorksheet(barangayData.name, {
                pageSetup: {
                    paperSize: 9,
                    orientation: 'portrait',
                    fitToPage: false,
                    showGridLines: true,
                    margins: {
                        left: 0.6,
                        right: 0.6,
                        top: 0.5,
                        bottom: 0.5,
                        header: 0.3,
                        footer: 0.3,
                    },
                },
                headerFooter: {
                    firstHeader: '',
                    firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    oddHeader: `&L&B${municipal.name}-${barangayData.name} Team Members`,
                    oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                },
            });
            worksheet.columns = [
                { header: 'TL', key: 'tl', width: 40 },
                { header: 'Members', key: 'members', width: 40 },
            ];
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            // Prepare data for insertion
            const dataRows = [];
            teamToInsert.forEach((team) => {
                var _a;
                const teamLeader = ((_a = team.TeamLeader) === null || _a === void 0 ? void 0 : _a.voter)
                    ? `${team.TeamLeader.voter.idNumber} - ${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname} (${team.voters.length})`
                    : 'No Leader';
                const members = team.voters.map((voter) => `${voter.idNumber} - ${voter.lastname}, ${voter.firstname}`);
                // First row with Team Leader
                dataRows.push([teamLeader, members[0] || '']);
                // Remaining members in separate rows
                for (let i = 1; i < members.length; i++) {
                    dataRows.push(['', members[i]]);
                }
                dataRows.push(['', '']);
            });
            worksheet.addRows(dataRows);
            // Send file as response
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="team_breakdown.xlsx"');
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    })), router.post('/generate-team', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { delisted, ud, nd, op, or, inc, dead, selected, min, max, barangay, zipCode, selectedId, membersCount, level, } = req.body;
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const filter = {};
            if (delisted) {
                filter.DelistedVoter = {
                    some: {},
                };
            }
            if (dead) {
                filter.status = 0;
            }
            if (ud) {
                filter.VoterRecords = {
                    some: {
                        type: 1,
                    },
                };
            }
            if (nd) {
                filter.VoterRecords = {
                    some: {
                        type: 2,
                    },
                };
            }
            if (op) {
                filter.VoterRecords = {
                    some: {
                        type: 3,
                    },
                };
            }
            if (or) {
                filter.oor = 'YES';
            }
            const [municipal, barangayData] = yield prisma_1.prisma.$transaction([
                prisma_1.prisma.municipals.findUnique({
                    where: {
                        id: parseInt(zipCode, 10),
                    },
                }),
                prisma_1.prisma.barangays.findUnique({
                    where: {
                        id: barangay,
                    },
                }),
            ]);
            if (!municipal || !barangayData) {
                return res.status(400).json({ message: 'Bad request' });
            }
            // console.log({
            //   delisted,
            //   ud,
            //   nd,
            //   op,
            //   or,
            //   inc,
            //   dead,
            //   selected,
            //   min,
            //   max,
            //   barangay,
            //   zipCode,
            //   selectedId,
            //   membersCount,
            //   level
            // });
            // console.log({filter});
            let teamToInsert = [];
            let skip = 0;
            let haveMore = true;
            const count = (0, data_1.teamMembersCount)(membersCount);
            console.log('Count: ', {
                count,
            });
            let levels = {};
            let teamData = {};
            let headerFilter = {};
            let headerLevel;
            if (level !== 'all') {
                headerLevel = (0, data_1.handleLevelLabel)(level, 0);
                levels.level = headerLevel;
            }
            // if (headerLevel - 1 !== 0) {
            //   teamData.TeamLeader = {
            //     select: {
            //       team: {
            //         select: {
            //           _count: {
            //             select: {
            //               voters: {
            //                 where: {
            //                   level: headerLevel - 1,
            //                   teamId: { not: null },
            //                 },
            //               },
            //             },
            //           },
            //         },
            //       },
            //     },
            //   };
            // }
            if (headerLevel === 1) {
                headerFilter.purokCoors = {
                    select: {
                        voter: {
                            select: {
                                idNumber: true,
                                firstname: true,
                                lastname: true,
                                id: true,
                                level: true,
                            },
                        },
                    },
                };
                headerFilter.barangayCoor = {
                    select: {
                        voter: {
                            select: {
                                idNumber: true,
                                firstname: true,
                                lastname: true,
                                id: true,
                                level: true,
                            },
                        },
                    },
                };
            }
            else if (headerLevel === 2) {
                headerFilter.barangayCoor = {
                    select: {
                        voter: {
                            select: {
                                idNumber: true,
                                firstname: true,
                                lastname: true,
                                id: true,
                                level: true,
                            },
                        },
                    },
                };
            }
            else {
                headerFilter = {};
            }
            while (haveMore) {
                const teams = yield prisma_1.prisma.team.findMany({
                    where: Object.assign({ barangaysId: barangayData.id, municipalsId: municipal.id, voters: {
                            some: filter,
                        }, teamLeaderId: { not: null }, TeamLeader: {
                            votersId: { not: null },
                        } }, levels),
                    include: {
                        _count: {
                            select: {
                                voters: true,
                            },
                        },
                        voters: {
                            select: {
                                idNumber: true,
                                firstname: true,
                                lastname: true,
                                status: true,
                                oor: true,
                                DelistedVoter: true,
                                VoterRecords: true,
                                level: true,
                                inc: true,
                            },
                            where: {
                                teamId: { not: null },
                                level: headerLevel - 1,
                            },
                        },
                        TeamLeader: {
                            select: Object.assign({ voter: {
                                    select: {
                                        idNumber: true,
                                        firstname: true,
                                        lastname: true,
                                        level: true,
                                    },
                                } }, headerFilter),
                        },
                    },
                    take: 50,
                    skip,
                    orderBy: {
                        TeamLeader: {
                            voter: {
                                lastname: 'asc',
                            },
                        },
                    },
                });
                const fitleredTeams = teams.filter((item) => {
                    if (typeof count === 'string' && count === 'all') {
                        return item;
                    }
                    if (typeof count === 'number' && count === 3) {
                        return item._count.voters <= 3 && item._count.voters >= 1;
                    }
                    if (typeof count === 'number' && count === 6) {
                        return item._count.voters >= 6 && item._count.voters <= 9;
                    }
                    if (typeof count === 'number' && count === 11) {
                        return item._count.voters >= 11;
                    }
                    return item._count.voters === count;
                });
                if (teams.length === 0) {
                    haveMore = false;
                    break;
                }
                else {
                    teamToInsert.push(...fitleredTeams);
                    skip += teams.length;
                }
            }
            if (teamToInsert.length > 0) {
                const worksheet = workbook.addWorksheet(`${barangayData.name}-(${teamToInsert.length})`, {
                    pageSetup: {
                        paperSize: undefined,
                        orientation: 'portrait',
                        fitToPage: false,
                        showGridLines: true,
                        margins: {
                            left: 0.6,
                            right: 0.6,
                            top: 0.5,
                            bottom: 0.5,
                            header: 0.3,
                            footer: 0.3,
                        },
                    },
                    headerFooter: {
                        firstHeader: '',
                        firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                        oddHeader: `&L&B${municipal.name}-${barangayData.name} ${(0, data_1.handleLevel)(headerLevel)} Team Members -(${teamToInsert.length})`,
                        oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
                    },
                });
                let headerMeteData = {};
                worksheet.columns = [
                    { header: 'Teams', key: 'tl', width: 50 },
                    // { header: "Members", key: "members", width: 40 },
                    { header: 'Tags', key: 'members', width: 15 },
                ];
                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
                const dataRows = [];
                teamToInsert.forEach((team, i) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    const bc = ((_b = (_a = team.TeamLeader) === null || _a === void 0 ? void 0 : _a.barangayCoor) === null || _b === void 0 ? void 0 : _b.voter)
                        ? `     ${(0, data_1.handleLevel)((_c = team.TeamLeader.barangayCoor) === null || _c === void 0 ? void 0 : _c.voter.level)} = ${(_d = team.TeamLeader.barangayCoor) === null || _d === void 0 ? void 0 : _d.voter.idNumber} - ${(_e = team.TeamLeader.barangayCoor) === null || _e === void 0 ? void 0 : _e.voter.lastname}, ${(_f = team.TeamLeader.barangayCoor) === null || _f === void 0 ? void 0 : _f.voter.firstname}`
                        : 'No BC';
                    const pc = ((_h = (_g = team.TeamLeader) === null || _g === void 0 ? void 0 : _g.purokCoors) === null || _h === void 0 ? void 0 : _h.voter)
                        ? `     ${(0, data_1.handleLevel)((_j = team.TeamLeader.purokCoors) === null || _j === void 0 ? void 0 : _j.voter.level)} = ${(_k = team.TeamLeader.purokCoors) === null || _k === void 0 ? void 0 : _k.voter.idNumber} - ${(_l = team.TeamLeader.purokCoors) === null || _l === void 0 ? void 0 : _l.voter.lastname}, ${(_m = team.TeamLeader.purokCoors) === null || _m === void 0 ? void 0 : _m.voter.firstname}`
                        : 'No PC';
                    const teamLeader = ((_o = team.TeamLeader) === null || _o === void 0 ? void 0 : _o.voter)
                        ? `${i + 1}. ${(0, data_1.handleLevel)(team.TeamLeader.voter.level)} = ${team.TeamLeader.voter.idNumber} - ${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname} (${team.voters.length})`
                        : 'No Leader';
                    const members = team.voters.map((voter) => `     ${voter === null || voter === void 0 ? void 0 : voter.idNumber} - ${voter === null || voter === void 0 ? void 0 : voter.lastname}, ${voter === null || voter === void 0 ? void 0 : voter.firstname}`);
                    const membersTags = team === null || team === void 0 ? void 0 : team.voters.map((voter) => `[${(voter === null || voter === void 0 ? void 0 : voter.status) === 0 ? 'D,' : ''} ${(voter === null || voter === void 0 ? void 0 : voter.oor) === 'YES' ? 'OR,' : ''} ${(voter === null || voter === void 0 ? void 0 : voter.inc) === 'YES' ? 'INC,' : ''} ${(0, data_1.memberTags)(voter === null || voter === void 0 ? void 0 : voter.VoterRecords.type)}]`);
                    // First row with Team Leader ${voter.DelistedVoter ? "DL," : ""}
                    if (headerLevel === 1) {
                        dataRows.push([bc]);
                        dataRows.push([pc]);
                    }
                    else if (headerLevel === 2) {
                        dataRows.push([bc]);
                    }
                    dataRows.push([teamLeader]);
                    dataRows.push([`Members - ${(0, data_1.handleLevel)(headerLevel - 1)}`]);
                    dataRows.push([members[0], membersTags[0]]);
                    // Remaining members in separate rows
                    for (let i = 1; i < members.length; i++) {
                        dataRows.push([members[i], membersTags[i]]);
                    }
                    dataRows.push(['']);
                });
                worksheet.addRows(dataRows);
            }
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="team_breakdown.xlsx"');
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    })), router.post('/barangay-attendance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { day, barangayId } = req.body;
        try {
            if (!day) {
                return res.status(400).send('Bad Request');
            }
            console.log({ day, barangayId });
            let barangay = null;
            if (barangay) {
                barangay = yield prisma_1.prisma.barangays.findUnique({
                    where: {
                        id: barangayId,
                    },
                });
            }
            const targetDate = new Date(day).toISOString();
            console.log({ targetDate });
            const doc = new pdfkit_1.default({ size: 'Letter', margin: 40, compress: false });
            doc.pipe(res);
            const startDate = new Date(day);
            startDate.setUTCHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setUTCDate(endDate.getUTCDate() + 1);
            let fitler = {};
            if (barangayId) {
                fitler.teamLeader = {
                    barangaysId: barangay === null || barangay === void 0 ? void 0 : barangay.id,
                };
            }
            const data = yield prisma_1.prisma.teamLeaderAttendance.findMany({
                where: Object.assign({ date: {
                        gte: startDate,
                        lt: endDate,
                    } }, fitler),
                include: {
                    teamLeader: {
                        select: {
                            voter: {
                                select: {
                                    idNumber: true,
                                    lastname: true,
                                    firstname: true,
                                    level: true,
                                },
                            },
                            level: true,
                            barangay: {
                                select: {
                                    name: true,
                                    id: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    date: 'desc',
                },
            });
            console.log({ data });
            barangayId
                ? doc.fontSize(16).text(`${barangay === null || barangay === void 0 ? void 0 : barangay.name}-(${(0, data_1.formatToLocalPHTime)(day)})`, {
                    align: 'left',
                })
                : doc.fontSize(16).text(`${(0, data_1.formatToLocalPHTime)(day)}`, {
                    align: 'left',
                });
            doc.moveDown(2);
            doc.fontSize(14).text(`Total Attendee/s: ${data.length}`, {
                align: 'left',
            });
            doc.moveDown(1);
            doc
                .fontSize(14)
                .text(`BC Attendee/s: ${data.filter((item) => item.teamLeader.level === 3).length || 0}`, {
                align: 'left',
            });
            doc.moveDown(1);
            doc
                .fontSize(14)
                .text(`PC Attendee/s: ${data.filter((item) => item.teamLeader.level === 2).length || 0}`, {
                align: 'left',
            });
            doc.moveDown(1);
            doc
                .fontSize(14)
                .text(`TL Attendee/s: ${data.filter((item) => item.teamLeader.level === 1).length || 0}`, {
                align: 'left',
            });
            doc.moveDown(2);
            if (data.length > 0) {
                data.map((item, i) => {
                    var _a, _b, _c, _d;
                    doc
                        .fontSize(12)
                        .text(`${i + 1}. ${item.teamLeader.barangay.name} ${(0, data_1.handleLevel)((_b = (_a = item.teamLeader) === null || _a === void 0 ? void 0 : _a.voter) === null || _b === void 0 ? void 0 : _b.level)} - ${(_c = item.teamLeader.voter) === null || _c === void 0 ? void 0 : _c.lastname}, ${(_d = item.teamLeader.voter) === null || _d === void 0 ? void 0 : _d.firstname}      ${(0, data_1.formatToLocalPHTime)(item.date)}`, { indent: 20, align: 'left' });
                    doc.moveDown(1);
                });
            }
            doc.end();
        }
        catch (error) {
            res.status(500).send('Internal Server Error');
        }
    })), router.post('/generate-survey-report', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const { code, zipCode, barangayId } = req.body;
        if (!code || !zipCode || !barangayId) {
            return res.status(400).send('Bad request');
        }
        const municipalId = parseInt(zipCode, 10);
        try {
            const barangayResponseResponse = (id) => __awaiter(void 0, void 0, void 0, function* () {
                return yield prisma_1.prisma.respondentResponse.count({
                    where: {
                        Response: {
                            some: {
                                queryId: id,
                            },
                        },
                    },
                });
            });
            let barangay = null;
            const filter = {};
            if (barangayId !== 'all') {
                filter.barangaysId = barangayId;
                barangay = yield prisma_1.prisma.barangays.findUnique({
                    where: {
                        id: barangayId,
                    },
                });
            }
            const [barangays, survey] = yield prisma_1.prisma.$transaction([
                prisma_1.prisma.barangays.findMany({
                    where: {
                        municipalId: municipalId,
                    },
                    include: {
                        RespondentResponse: {
                            where: {
                                surveyId: code,
                            },
                            include: {
                                gender: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                Response: {
                                    select: {
                                        queries: {
                                            select: {
                                                id: true,
                                                queries: true,
                                                access: true,
                                            },
                                        },
                                        option: {
                                            select: {
                                                id: true,
                                                title: true,
                                            },
                                        },
                                    },
                                    distinct: ['respondentResponseId', 'optionId'],
                                },
                            },
                            distinct: ['surveyId'],
                        },
                    },
                    orderBy: {
                        name: 'asc',
                    },
                }),
                prisma_1.prisma.survey.findUnique({
                    where: {
                        id: code,
                    },
                    include: {
                        queries: {
                            include: {
                                Option: {
                                    include: {
                                        Response: {
                                            where: Object.assign({ municipalsId: municipalId }, filter),
                                            include: {
                                                respondentResponse: {
                                                    select: {
                                                        gender: {
                                                            select: {
                                                                id: true,
                                                                name: true,
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                            distinct: ['respondentResponseId', 'optionId'],
                                        },
                                    },
                                },
                                Response: true,
                            },
                        },
                        _count: {
                            select: {
                                RespondentResponse: {
                                    where: Object.assign({ surveyId: code }, filter),
                                },
                            },
                        },
                    },
                }),
            ]);
            const barangayData = yield prisma_1.prisma.barangays.findMany({
                where: {
                    municipalId: municipalId,
                },
                include: {
                    RespondentResponse: {
                        where: Object.assign({ surveyId: code }, filter),
                        include: {
                            gender: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                            Response: {
                                select: {
                                    queries: {
                                        select: {
                                            id: true,
                                            queries: true,
                                            access: true,
                                            type: true,
                                        },
                                    },
                                    option: {
                                        select: {
                                            id: true,
                                            title: true,
                                            queryId: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });
            const structuredResponse = {
                barangays: barangayData.map((barangay) => {
                    const queryMap = new Map();
                    const uniqueResponses = new Set(); // Track unique respondent responses
                    barangay.RespondentResponse.forEach((respondent) => {
                        uniqueResponses.add(respondent.id); // Count each unique respondent response
                        respondent.Response.forEach((response) => {
                            var _a, _b, _c;
                            const queryId = response.queries.id;
                            const queryText = response.queries.queries;
                            const queryAccess = response.queries.access;
                            const optionId = (_a = response.option) === null || _a === void 0 ? void 0 : _a.id;
                            const optionTitle = (_b = response.option) === null || _b === void 0 ? void 0 : _b.title;
                            const gender = respondent.gender.name.toLowerCase();
                            // **Fix: Ensure option belongs to the correct query**
                            if (!optionId || ((_c = response === null || response === void 0 ? void 0 : response.option) === null || _c === void 0 ? void 0 : _c.queryId) !== queryId) {
                                return; // Skip this option if it doesn’t match the query
                            }
                            if (!queryMap.has(queryId)) {
                                queryMap.set(queryId, {
                                    query: queryText,
                                    access: queryAccess,
                                    totalQueryResponse: 0,
                                    options: new Map(),
                                });
                            }
                            const queryObj = queryMap.get(queryId);
                            queryObj.totalQueryResponse++;
                            if (!queryObj.options.has(optionId)) {
                                queryObj.options.set(optionId, {
                                    title: optionTitle,
                                    response: {
                                        respondentResponse: {
                                            gender: { male: 0, female: 0 },
                                        },
                                    },
                                });
                            }
                            // **Fix: Increment gender count only for valid options**
                            const optionObj = queryObj.options.get(optionId);
                            if (optionObj) {
                                optionObj.response.respondentResponse.gender[gender]++;
                            }
                        });
                    });
                    return {
                        name: barangay.name,
                        totalResponse: uniqueResponses.size, // Count only unique respondent responses
                        queries: Array.from(queryMap.values()).map((q) => ({
                            query: q.query,
                            access: q.access,
                            totalQueryResponse: q.totalQueryResponse,
                            options: Array.from(q.options.values()),
                        })),
                    };
                }),
            };
            if (!survey) {
                return res.status(404).json({ message: 'NOT Found' });
            }
            const { queries } = survey;
            const doc = new pdfkit_1.default({ size: 'Letter', margin: 10, compress: false });
            const area = barangayId !== 'all' ? `-${barangay === null || barangay === void 0 ? void 0 : barangay.name}` : '-All';
            doc.pipe(res);
            // Report Header
            doc.fontSize(12).text(`Survey CODE: ${survey.tagID}`, 20, 20);
            doc.fontSize(12).text(`Area: ${zipCode}${area}`, 20, 40);
            doc.moveDown(1);
            doc.fontSize(12).text('Report Summary', 20, 100);
            doc.fontSize(10).text(`Target Response: ${1500}`, 20, 120);
            doc.fontSize(10).text(`Total Response: ${survey._count.RespondentResponse}`, 20, 140);
            doc
                .fontSize(10)
                .text(`Percentage: ${(0, data_1.calculatePercentage)(survey._count.RespondentResponse, 1500)}%`, 20, 160);
            doc.moveDown(2);
            // Survey Queries
            queries
                .filter((item) => item.access !== 'admin')
                .forEach((query, i) => {
                doc.fontSize(12).text(`${i + 1}. ${query.queries}`, { indent: 20 });
                doc.moveDown(0.5);
                if (query.Option) {
                    query.Option.forEach((option, j) => {
                        doc.fontSize(10).text(`${data_1.alphabetic[j]}. ${option.title}`, { indent: 40 });
                        const male = option.Response.filter((item) => item.respondentResponse.gender.name.toLowerCase() === 'male').length;
                        const female = option.Response.filter((item) => item.respondentResponse.gender.name.toLowerCase() === 'female').length;
                        doc.moveDown(0.5);
                        doc
                            .fontSize(10)
                            .text(`Total: ${option.Response.length} (${(0, data_1.calculatePercentage)(option.Response.length, query.Response.length)}%)     Male: ${male} (${(0, data_1.calculatePercentage)(male, option.Response.length)}%) | Female: ${female} (${(0, data_1.calculatePercentage)(female, option.Response.length)}%)`, { indent: 60 });
                        doc.moveDown(0.5);
                    });
                }
                doc.moveDown(1);
            });
            if (barangayId === 'all') {
                doc.fontSize(12).text(`Barangay Breakdown`, { indent: 10 });
                doc.moveDown(0.5);
                structuredResponse.barangays.forEach((barangay, one) => {
                    doc.fontSize(12).text(`${one + 1}. ${barangay.name}`, { indent: 10 });
                    doc.moveDown(1);
                    doc.fontSize(10).text(`Total Response: ${barangay.totalResponse}`, { indent: 10 });
                    barangay.queries
                        .filter((item) => item.access !== 'admin')
                        .forEach((query, two) => {
                        doc.moveDown(2);
                        doc.fontSize(10).text(`${two + 1}. ${query.query}`, { indent: 40 });
                        doc.moveDown(1);
                        doc.fontSize(10).text(`Total: ${query.totalQueryResponse}`, { indent: 15 });
                        const optionList = query.options;
                        optionList.forEach((option, three) => {
                            doc.fontSize(10).text(`${data_1.alphabetic[three]}. ${option.title}`, { indent: 60 });
                            doc
                                .fontSize(10)
                                .text(`Total: ${option.response.respondentResponse.gender.male +
                                option.response.respondentResponse.gender.female}`, { indent: 60 });
                            doc
                                .fontSize(10)
                                .text(`Male: ${option.response.respondentResponse.gender.male} Female: ${option.response.respondentResponse.gender.female}`, { indent: 70 });
                            doc.moveDown(1);
                        });
                    });
                });
            }
            else {
                const barangayResult = structuredResponse.barangays.find((item) => item.name === (barangay === null || barangay === void 0 ? void 0 : barangay.name));
                doc.moveDown(2);
                doc.fontSize(12).text(`Barangay: ${barangayResult === null || barangayResult === void 0 ? void 0 : barangayResult.name}`, { indent: 10 });
                doc.moveDown(0.5);
                doc.fontSize(10).text(`Total Response: ${barangayResult === null || barangayResult === void 0 ? void 0 : barangayResult.totalResponse}`, { indent: 10 });
                doc.moveDown(0.5);
                barangayResult === null || barangayResult === void 0 ? void 0 : barangayResult.queries.filter((item) => item.access !== 'admin').forEach((query, two) => {
                    doc.moveDown(2);
                    doc.fontSize(10).text(`${two + 1}. ${query.query}`, { indent: 40 });
                    doc.moveDown(1);
                    doc.fontSize(10).text(`Total: ${query.totalQueryResponse}`, { indent: 15 });
                    const optionList = query.options;
                    optionList.forEach((option, three) => {
                        doc.fontSize(10).text(`${data_1.alphabetic[three]}. ${option.title}`, { indent: 60 });
                        doc
                            .fontSize(10)
                            .text(`Total: ${option.response.respondentResponse.gender.male +
                            option.response.respondentResponse.gender.female}`, { indent: 60 });
                        doc
                            .fontSize(10)
                            .text(`Male: ${option.response.respondentResponse.gender.male} Female: ${option.response.respondentResponse.gender.female}`, { indent: 70 });
                        doc.moveDown(1);
                    });
                });
            }
            if (barangayId === 'all') {
                const tableStartY = doc.y;
                const docW = doc.page.width - 60; // Reduce width slightly for padding
                const headers = ['Barangay', 'Quota', 'Male', 'Female', 'Actual'];
                const perColW = docW / headers.length;
                const finalW = Number(perColW.toFixed(2));
                const rowHeight = 20;
                const startX = 50; // Start position of the table
                let y = tableStartY;
                // Draw Table Header
                doc.fontSize(12).text('Barangay', startX, y);
                y += 20;
                doc
                    .moveTo(startX, y)
                    .lineTo(startX + docW, y)
                    .stroke();
                // Centered Headers using finalW
                headers.forEach((header, index) => {
                    const textWidth = doc.widthOfString(header);
                    let posX = startX + index * finalW + (finalW - textWidth) / 2;
                    // Ensure last column does not overflow
                    if (index === headers.length - 1) {
                        posX = startX + index * finalW + (finalW - textWidth - 10) / 2;
                    }
                    doc.text(header, posX, y + 5);
                });
                y += 20;
                doc
                    .moveTo(startX, y)
                    .lineTo(startX + docW, y)
                    .stroke();
                const totalActual = barangays.reduce((acc, base) => {
                    return acc + base.RespondentResponse.length;
                }, 0);
                const totalMale = barangays.reduce((acc, base) => {
                    if (!base.maleSize) {
                        return 0;
                    }
                    return acc + base.maleSize;
                }, 0);
                const totalFemale = barangays.reduce((acc, base) => {
                    if (!base.femaleSize) {
                        return 0;
                    }
                    return acc + base.femaleSize;
                }, 0);
                const allgender = barangays.reduce((acc, base) => {
                    if (!base.femaleSize || !base.maleSize) {
                        return 0;
                    }
                    return acc + base.femaleSize + base.maleSize;
                }, 0);
                // Draw Table Rows with Centered Data
                for (let i = 0; i < ((_a = barangays === null || barangays === void 0 ? void 0 : barangays.length) !== null && _a !== void 0 ? _a : 0); i++) {
                    const maleSize = (_b = barangays[i].maleSize) !== null && _b !== void 0 ? _b : 0;
                    const femaleSize = (_c = barangays[i].femaleSize) !== null && _c !== void 0 ? _c : 0;
                    const totalGender = maleSize + femaleSize;
                    const rowData = [
                        `${barangays[i].name}`,
                        `${barangays[i].maleSize}`,
                        `${barangays[i].femaleSize}`,
                        `${totalGender}`,
                        `${barangays[i].RespondentResponse.length}`,
                    ];
                    rowData.forEach((data, index) => {
                        const textWidth = doc.widthOfString(data);
                        let posX = startX + index * finalW + (finalW - textWidth) / 2;
                        // Ensure last column is correctly positioned
                        if (index === headers.length - 1) {
                            posX = startX + index * finalW + (finalW - textWidth - 10) / 2;
                        }
                        doc.text(data, posX, y + 5);
                    });
                    y += rowHeight;
                    doc
                        .moveTo(startX, y)
                        .lineTo(startX + docW, y)
                        .stroke();
                }
                [barangays.length, totalMale, totalFemale, allgender, totalActual].forEach((header, index) => {
                    const textWidth = doc.widthOfString(header.toString());
                    let posX = startX + index * finalW + (finalW - textWidth) / 2;
                    // Ensure last column does not overflow
                    if (index === headers.length - 1) {
                        posX = startX + index * finalW + (finalW - textWidth - 10) / 2;
                    }
                    doc.text(header.toString(), posX, y + 5);
                });
            }
            doc.end();
        }
        catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    })));
    return router;
};
