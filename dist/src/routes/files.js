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
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
//utils
const date_1 = require("../utils/date");
const data_1 = require("../utils/data");
//database
const prisma_1 = require("../../prisma/prisma");
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
                    console.log("ROw: ", `${row.No}`);
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
        try {
            let rejectList = [];
            let successCounter = 0;
            const votersData = Object.values(data).flat().filter(Boolean);
            const voterNames = votersData.map((row) => ({
                firstname: row.firstname,
                lastname: row.lastname,
            }));
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
            // Map to quickly lookup existing voters
            const existingVoterMap = new Map();
            existingVoters.forEach((voter) => {
                const key = `${voter.firstname}_${voter.lastname}`;
                if (!existingVoterMap.has(key)) {
                    existingVoterMap.set(key, []);
                }
                existingVoterMap.get(key).push(voter);
            });
            const purokCache = new Map();
            const newVotersToInsert = [];
            const voterRecordsToInsert = [];
            for (const row of votersData) {
                try {
                    const key = `${row.firstname}_${row.lastname}`;
                    const existingVoter = existingVoterMap.get(key);
                    // Check for existing voters
                    if ((existingVoter === null || existingVoter === void 0 ? void 0 : existingVoter.length) > 0) {
                        rejectList.push(Object.assign(Object.assign({}, row), { saveStatus: "Existed" }));
                        voterRecordsToInsert.push({
                            votersId: existingVoter[0].id,
                            desc: `Multiple entry in Barangay ${existingVoter[0].barangay.name}-${existingVoter[0].municipal.name}`,
                            questionable: true,
                        });
                    }
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
            res.status(500).send({ status: "Internal server error", message: `${error}` });
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
    return router;
};
