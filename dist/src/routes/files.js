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
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
const exceljs_1 = __importDefault(require("exceljs"));
//utils
const date_1 = require("../utils/date");
const data_1 = require("../utils/data");
//database
const prisma_1 = require("../../prisma/prisma");
const graphql_1 = require("graphql");
const uploadDir = path_1.default.join(__dirname, "uploads");
const upload = (0, multer_1.default)({ dest: uploadDir });
exports.default = (io) => {
    const router = express_1.default.Router();
    router.post("/file", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        const filePath = path_1.default.join(uploadDir, req.file.filename);
        try {
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            const processedData = {};
            const candidates = yield prisma_1.prisma.candidates.findMany();
            if (candidates.length <= 0) {
                return res.status(400).send("Candidates not found.");
            }
            sheets.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(worksheet);
                processedData[sheetName] = data.map((row) => {
                    const newRow = {};
                    const supporting = candidates.map((candidate) => row[candidate.code] ? candidate.id : undefined);
                    const candidateId = supporting.filter(Boolean);
                    if (row["Voter's Name"]) {
                        const [lastname, firstname] = row["Voter's Name"]
                            .split(",")
                            .map((name) => name.trim());
                        newRow.lastname = (0, data_1.handleSpecialChar)(",", lastname) || "Unknown";
                        newRow.firstname = firstname || "Unknown";
                    }
                    else {
                        newRow.lastname = "Unknown";
                        newRow.firstname = "Unknown";
                    }
                    newRow.No = row.No;
                    newRow.Birthday = (0, date_1.extractYear)(row.Birthday);
                    newRow.__EMPTY = row.__EMPTY || "O";
                    newRow.Gender = (0, data_1.handleGender)(row.Gender);
                    newRow.Address = row.Address || "Unknown";
                    newRow.DL = row.DL ? "YES" : "NO";
                    newRow.IL = row.IL ? "YES" : "NO";
                    newRow.INC = row.INC ? "YES" : "NO";
                    newRow.PWD = row.PWD ? "YES" : "NO";
                    newRow.OR = row.OR ? "YES" : "NO";
                    newRow.SC = row.SC ? "YES" : "NO";
                    newRow["18-30"] = row["18-30"] ? "YES" : "NO";
                    newRow.candidateId = candidateId[0];
                    return newRow;
                });
            });
            res.status(200).json(processedData);
        }
        catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }));
    router.post("/draft", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const data = req.body.data;
        const zipCode = req.body.zipCode;
        const barangayId = req.body.barangayId;
        const draftID = req.body.draftID;
        if (!data) {
            return res.status(400).send("Empty list!");
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
            console.log("Logged 1");
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
            console.log("Logged 2");
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
            console.log("Logged 3");
            const purokCache = new Map();
            const newVotersToInsert = [];
            const voterRecordsToInsert = [];
            for (const row of votersData) {
                console.log("Logged 4");
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
                        calcAge: row.Birthday
                            ? (_a = (0, date_1.extractYear)(row.Birthday)) !== null && _a !== void 0 ? _a : 0
                            : 0,
                        purokId: purok.id,
                        pwd: row.PWD,
                        oor: row.OR,
                        inc: row.INC,
                        illi: row.IL,
                        inPurok: true,
                        hubId: null,
                        houseHoldId: undefined,
                        mobileNumber: "Unknown",
                        senior: row.SC === "YES" ? true : false,
                        status: row.DL === "YES" ? 0 : 1,
                        candidatesId: row.candidateId,
                        precintsId: undefined,
                        youth: row["18-30"] === "YES" ? true : false,
                        idNumber: `${row.No}`,
                    });
                    successCounter++;
                    io.emit("draftedCounter", successCounter);
                }
                catch (error) {
                    console.log(row["Voter's Name"], error);
                    continue;
                }
            }
            console.log("Logged 5");
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
                message: "Success",
                rejectList: rejectList || [],
                successCount: successCounter,
            });
        }
        catch (error) {
            console.log(error);
            res
                .status(500)
                .send({ status: "Internal server error", message: `${error}` });
        }
    }));
    router.post("/update-voters", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { zipCode, barangayId } = req.body;
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        const filePath = path_1.default.join(uploadDir, req.file.filename);
        const rejectList = [];
        try {
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            let updateVoterCounter = 0;
            let validdatedVoters = 0;
            io.emit("updateVoterCounter", updateVoterCounter);
            const candidates = yield prisma_1.prisma.candidates.findMany();
            if (candidates.length <= 0) {
                return res.status(400).send("Candidates not found.");
            }
            for (const sheetName of sheets) {
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(sheet);
                for (const row of data) {
                    const newRow = {
                        lastname: "Unknown",
                        firstname: "Unknown",
                        DL: row.DL || undefined,
                        INC: row.INC || undefined,
                        OR: row.OR || undefined,
                    };
                    const supporting = candidates.map((candidate) => row[candidate.code] ? candidate.id : undefined);
                    if (row["Voter's Name"]) {
                        const [lastname, firstname] = row["Voter's Name"]
                            .split(",")
                            .map((name) => name.trim());
                        newRow.lastname = (0, data_1.handleSpecialChar)(",", lastname) || "Unknown";
                        newRow.firstname = firstname || "Unknown";
                    }
                    if (!row.DL && !row.INC && !row.OR && !supporting[0]) {
                        rejectList.push({
                            firstname: newRow.firstname,
                            lastname: newRow.lastname,
                            reason: "Updated",
                            code: 11,
                            barangay: barangayId,
                            municipal: zipCode,
                            teamId: "Unknown",
                            id: "Unknown",
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
                            reason: "Voter does not exist",
                            code: 0,
                            barangay: barangayId,
                            municipal: zipCode,
                            teamId: "Unknown",
                            id: "Unknown",
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
                            oor: newRow.OR ? "YES" : "NO",
                            status: newRow.DL ? 0 : 1,
                            inc: newRow.INC ? "YES" : "NO",
                            candidatesId: supporting[0],
                        },
                    });
                    rejectList.push({
                        lastname: voterMetaData.lastname,
                        firstname: voterMetaData.firstname,
                        reason: "Voter updated successfully",
                        code: 0,
                        barangay: voterMetaData.barangaysId,
                        municipal: voterMetaData.municipalsId,
                        id: voterMetaData.id,
                        teamId: "Unknown",
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
                status: "Internal server error",
                message: "Something went wrong on the server. Please try again.",
            });
        }
    }));
    router.post("/export-pdf", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const data = req.body;
        const { surveyCode } = data;
        try {
            const doc = new pdfkit_1.default();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=${surveyCode}.pdf`);
            doc.pipe(res);
            doc
                .font("fonts/PalatinoBold.ttf")
                .fontSize(25)
                .text("Some text with an embedded font!", 100, 100);
            doc.end();
        }
        catch (error) {
            res.status(500).send({
                message: "Something went wrong on the server. Please try again",
            });
        }
    }));
    router.post("/voter-list", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const zipCode = req.body.zipCode;
        const barangay = req.body.barangay;
        console.log({ data: req.body });
        try {
            if (!req.file) {
                return res.status(400).send("No file uploaded.");
            }
            const filePath = path_1.default.join(uploadDir, req.file.filename);
            const workbook = xlsx_1.default.readFile(filePath);
            const sheets = workbook.SheetNames;
            const processedData = {};
            const candidates = yield prisma_1.prisma.candidates.findMany();
            const barangayData = yield prisma_1.prisma.barangays.findFirst({
                where: {
                    number: parseInt(barangay, 10),
                },
            });
            if (!barangayData) {
                throw new graphql_1.GraphQLError("Could not find any barangay with the number");
            }
            let delistedCount = 0;
            let addedCount = 0;
            const votersToAdd = [];
            const destlistedVoters = [];
            const purokCache = new Map();
            for (const sheetName of sheets) {
                const worksheet = workbook.Sheets[sheetName];
                const rows = xlsx_1.default.utils.sheet_to_json(worksheet);
                if (sheetName === "OVERALL") {
                    console.log("Skip");
                    continue;
                }
                if (sheetName === "-") {
                    processedData[sheetName] = yield Promise.all(rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                        const newRow = {};
                        if (row["Voter's Name"]) {
                            const [lastname, firstname] = row["Voter's Name"]
                                .split(",")
                                .map((name) => name.trim());
                            newRow.lastname =
                                (0, data_1.handleSpecialChar)(",", lastname) || "Unknown";
                            newRow.firstname = firstname || "Unknown";
                        }
                        else {
                            newRow.lastname = "Unknown";
                            newRow.firstname = "Unknown";
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
                            return Object.assign({}, row);
                        }
                        if (voter) {
                            delistedCount++;
                            console.log("Delisted: ", delistedCount);
                            destlistedVoters.push({
                                votersId: voter.id,
                                municipalsId: parseInt(zipCode, 10),
                                barangaysId: barangayData.id,
                            });
                        }
                        return Object.assign({}, row);
                    })));
                }
                if (sheetName === "+") {
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
                                        draftID: "",
                                    },
                                });
                            }
                            purokCache.set(purokKey, purok);
                        }
                        if (row["Voter's Name"]) {
                            const [lastname, firstname] = row["Voter's Name"]
                                .split(",")
                                .map((name) => name.trim());
                            newRow.lastname =
                                (0, data_1.handleSpecialChar)(",", lastname) || "Unknown";
                            newRow.firstname = firstname || "Unknown";
                        }
                        else {
                            newRow.lastname = "Unknown";
                            newRow.firstname = "Unknown";
                        }
                        const voter = yield prisma_1.prisma.voters.findFirst({
                            where: {
                                lastname: newRow.lastname,
                                firstname: newRow.firstname,
                                municipalsId: parseInt(zipCode, 10),
                                barangaysId: barangayData.id,
                            },
                        });
                        if (!voter) {
                            votersToAdd.push({
                                lastname: newRow.lastname,
                                firstname: newRow.firstname,
                                gender: (0, data_1.handleGender)(row.Gender),
                                birthYear: `${row.Birthday}`,
                                barangaysId: barangayData.id,
                                municipalsId: parseInt(zipCode, 10),
                                newBatchDraftId: null,
                                calcAge: row.Birthday
                                    ? (_a = (0, date_1.extractYear)(row.Birthday)) !== null && _a !== void 0 ? _a : 0
                                    : 0,
                                purokId: purok.id,
                                pwd: row.PWD ? "YES" : "NO",
                                oor: row.OR ? "YES" : "NO",
                                inc: row.INC ? "YES" : "NO",
                                illi: row.IL ? "YES" : "NO",
                                inPurok: true,
                                hubId: null,
                                houseHoldId: null,
                                mobileNumber: "Unknown",
                                senior: row.SC === "YES" ? true : false,
                                status: row.DL === "YES" ? 0 : 1,
                                candidatesId: candidateId[0],
                                precintsId: null,
                                youth: row["18-30"] ? true : false,
                                idNumber: `${row.No}`,
                                level: 0,
                                saveStatus: "listed",
                            });
                        }
                        return Object.assign({}, row);
                    })));
                }
            }
            if (votersToAdd.length) {
                console.log({ votersToAdd });
                yield prisma_1.prisma.voters.createMany({
                    data: votersToAdd,
                    skipDuplicates: true
                });
            }
            if (destlistedVoters.length) {
                console.log({ destlistedVoters });
                yield prisma_1.prisma.delistedVoter.createMany({
                    data: destlistedVoters,
                    skipDuplicates: true
                });
            }
            res.status(200).json({
                message: "File processed successfully",
                addedCount: addedCount,
                delistedCount: delistedCount,
            });
        }
        catch (error) {
            console.error("Error processing file:", error);
            res.status(500).send("Internal Server Error");
        }
    }));
    router.post("/supporter-report", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const zipCode = req.body.zipCode;
        const id = req.body.id;
        const candidate = req.body.candidate;
        const barangayList = req.body.barangayList;
        const parsedData = JSON.parse(barangayList);
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            // Add a worksheet with header and footer settings
            const worksheet = workbook.addWorksheet("Supporters", {
                pageSetup: {
                    paperSize: 9,
                    orientation: "landscape",
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
                { header: "Barangay", key: "barangay", width: 15 },
                { header: "Figure Heads", key: "figureHead", width: 12 },
                { header: "BC", key: "bc", width: 10 },
                { header: "PC", key: "pc", width: 10 },
                { header: "TL", key: "tl", width: 10 },
                { header: "Voters W/team", key: "withTeam", width: 16 },
                { header: "Voters W/o team", key: "withoutTeam", width: 16 },
                { header: "10+", key: "aboveTen", width: 10 },
                { header: "10", key: "equalTen", width: 10 },
                { header: "6-10", key: "belowTen", width: 10 },
                { header: "5", key: "aboveFive", width: 10 },
                { header: "5", key: "equalFive", width: 10 },
                { header: "4", key: "belowFive", width: 10 },
                { header: "1-3", key: "belowEqualThree", width: 10 },
                { header: "Population", key: "population", width: 8 },
            ];
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true }; // Make text bold
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
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
                    withoutTeam: item.supporters.voterWithoutTeam,
                    aboveTen: item.teamStat.aboveMax,
                    equalTen: item.teamStat.equalToMax,
                    belowTen: item.teamStat.belowMax,
                    aboveFive: item.teamStat.aboveMin,
                    equalFive: item.teamStat.equalToMin,
                    belowFive: item.teamStat.belowMin,
                    belowEqualThree: item.teamStat.threeAndBelow,
                    population: item.barangayVotersCount,
                };
            });
            worksheet.addRows(sheetData);
            const footerRow = worksheet.addRow({
                barangay: "Total", // Label for the footer row
                figureHead: sheetData.reduce((sum, row) => sum + (row.figureHead || 0), 0),
                bc: sheetData.reduce((sum, row) => sum + (row.bc || 0), 0),
                pc: sheetData.reduce((sum, row) => sum + (row.pc || 0), 0),
                tl: sheetData.reduce((sum, row) => sum + (row.tl || 0), 0),
                withTeam: sheetData.reduce((sum, row) => sum + (row.withTeam || 0), 0),
                withoutTeam: sheetData.reduce((sum, row) => sum + (row.withoutTeam || 0), 0),
                aboveTen: sheetData.reduce((sum, row) => sum + (row.aboveTen || 0), 0),
                equalTen: sheetData.reduce((sum, row) => sum + (row.equalTen || 0), 0),
                belowTen: sheetData.reduce((sum, row) => sum + (row.belowTen || 0), 0),
                aboveFive: sheetData.reduce((sum, row) => sum + (row.aboveFive || 0), 0),
                equalFive: sheetData.reduce((sum, row) => sum + (row.equalFive || 0), 0),
                belowFive: sheetData.reduce((sum, row) => sum + (row.belowFive || 0), 0),
                belowEqualThree: sheetData.reduce((sum, row) => sum + (row.belowEqualThree || 0), 0),
                population: sheetData.reduce((sum, row) => sum + (row.population || 0), 0),
            });
            // Style the footer row
            footerRow.eachCell((cell, colNumber) => {
                cell.font = { bold: true }; // Make text bold
                cell.alignment = { horizontal: "center", vertical: "middle" }; // Center-align
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=SupporterReport.xlsx");
            // Write the workbook directly to the response stream
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error("Error generating report:", error);
            res.status(500).send("Internal Server Error");
        }
    }));
    router.post("/supporter-report-barangay", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!req.body) {
            res.status(403).send({
                message: "No data provided",
            });
        }
        const temp = JSON.parse(req.body.barangay);
        try {
            const workbook = new exceljs_1.default.Workbook();
            workbook.created = new Date();
            const worksheetNames = new Set(); // To track existing worksheet names
            console.log("All PC: ", temp.leaders.length);
            console.log("All PC handle: ", temp.leaders.reduce((acc, num) => acc + (num.teamList.length || 0), 0));
            for (let item of temp.leaders) {
                const totalVoters = item.teamList.reduce((acc, team) => acc + (team.votersCount || 0), 0);
                console.log("Team: ", totalVoters);
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
                        orientation: "portrait",
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
                    { header: "ID", key: "id", width: 6 },
                    { header: "Fullname", key: "fullname", width: 40 },
                    { header: "Members", key: "members", width: 10 },
                    { header: "Merge 1", key: "merge1", width: 10 },
                    { header: "Merge 2", key: "merge2", width: 10 },
                    { header: "Merge 3", key: "merge3", width: 10 },
                ];
                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: "center", vertical: "middle" };
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
                const sheetData = item.teamList.map((team) => {
                    var _a, _b, _c, _d, _e, _f;
                    return {
                        id: (_b = (_a = team.teamLeader) === null || _a === void 0 ? void 0 : _a.voter) === null || _b === void 0 ? void 0 : _b.idNumber,
                        fullname: `${(_d = (_c = team.teamLeader) === null || _c === void 0 ? void 0 : _c.voter) === null || _d === void 0 ? void 0 : _d.lastname}, ${(_f = (_e = team.teamLeader) === null || _e === void 0 ? void 0 : _e.voter) === null || _f === void 0 ? void 0 : _f.firstname}`,
                        members: team.votersCount,
                        merge1: "",
                        merge2: "",
                        merge3: "",
                    };
                });
                const addedRows = worksheet.addRows(sheetData);
                const footers = worksheet.addRow({
                    id: "Total",
                    fullname: item.teamList.length,
                    members: sheetData.reduce((sum, row) => sum + (row.members || 0), 0),
                    merge1: "",
                    merge2: "",
                    merge3: "",
                });
                footers.eachCell((cell, colNumber) => {
                    cell.font = { bold: true }; // Make text bold
                    cell.alignment = { horizontal: "center", vertical: "middle" }; // Center-align
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
                addedRows.forEach((row) => {
                    const cellValue = row.getCell("members").value;
                    if (typeof cellValue === "number" && cellValue < 5) {
                        row.eachCell((cell) => {
                            cell.font = {
                                color: { argb: "FFFFA500" },
                            };
                        });
                    }
                });
            }
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=SupporterReport.xlsx");
            yield workbook.xlsx.write(res);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ message: "Internal Server Error" });
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
    }));
    return router;
};
