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
//database
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
            sheets.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx_1.default.utils.sheet_to_json(worksheet);
                processedData[sheetName] = data.map((row) => {
                    const newRow = {};
                    if (row["Voter's Name"]) {
                        const [lastname, firstname] = row["Voter's Name"]
                            .split(",")
                            .map((name) => name.trim());
                        newRow.lastname = lastname || "Unknown";
                        newRow.firstname = firstname || "Unknown";
                    }
                    else {
                        newRow.lastname = "Unknown";
                        newRow.firstname = "Unknown";
                    }
                    newRow["B-day"] = row["B-day"] || "Unknown";
                    newRow.__EMPTY = row.__EMPTY || "O";
                    newRow.Address = row.Address || "Unknown";
                    newRow.DL = row.DL ? "YES" : "NO";
                    newRow.IL = row.IL ? "YES" : "NO";
                    newRow.INC = row.INC ? "YES" : "NO";
                    newRow.PWD = row.PWD ? "YES" : "NO";
                    newRow.OR = row.OR ? "YES" : "NO";
                    return newRow;
                });
            });
            res.status(200).json(processedData);
        }
        catch (error) {
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
            res.status(400).send("Empty list!");
            return;
        }
        try {
            let rejectList = [];
            let successCounter = 0;
            for (let row of Object.values(data).flat()) {
                successCounter++;
                io.emit("draftedCounter", successCounter);
                if (!row) {
                    continue;
                }
                if (row.DL === "YES") {
                    rejectList.push(Object.assign(Object.assign({}, row), { saveStatus: "Dead" }));
                    continue;
                }
                const voterExisted = yield prisma.voters.findFirst({
                    where: {
                        firstname: row.firstname,
                        lastname: row.lastname,
                        barangaysId: barangayId,
                        municipalsId: parseInt(zipCode, 10),
                    },
                });
                if (voterExisted) {
                    rejectList.push(Object.assign(Object.assign({}, row), { saveStatus: "Existed" }));
                    continue;
                }
                let purok = yield prisma.purok.findFirst({
                    where: {
                        purokNumber: row.Address,
                        barangaysId: barangayId,
                        municipalsId: parseInt(zipCode, 10),
                        draftID: draftID
                    },
                });
                if (!purok) {
                    purok = yield prisma.purok.create({
                        data: {
                            purokNumber: row.Address,
                            municipalsId: parseInt(zipCode, 10),
                            barangaysId: barangayId,
                            draftID: draftID
                        },
                    });
                }
                yield prisma.voters.create({
                    data: {
                        lastname: row.lastname,
                        firstname: row.firstname,
                        birthYear: `${row["B-day"]}`,
                        barangaysId: barangayId,
                        municipalsId: parseInt(zipCode, 10),
                        newBatchDraftId: draftID,
                        calcAge: row["B-day"] === "Unknown"
                            ? 0
                            : (_a = (0, date_1.extractYear)(row["B-day"])) !== null && _a !== void 0 ? _a : 0,
                        purokId: purok.id,
                        pwd: row.PWD,
                        oor: row.OR,
                        inc: row.INC,
                        illi: row.IL,
                        inPurok: row.__EMPTY ? true : false,
                        teamLeaderId: "Unknown",
                        hubId: "Unknown",
                        houseHoldId: "Unknown",
                        mobileNumber: "Unknown",
                    },
                });
            }
            res.status(200).json({
                message: "Success",
                rejectList: rejectList || [],
                successCount: successCounter,
            });
        }
        catch (error) {
            res.status(500).send("Internal server error");
        }
    }));
    return router;
};
