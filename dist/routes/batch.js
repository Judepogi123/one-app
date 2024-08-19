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
const prisma_1 = require("../src/config/prisma");
const router = express_1.default.Router();
router.post("/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const batchYear = req.body;
        yield prisma_1.prisma.batchYear.create({ data: batchYear });
        res.status(200).json({ message: "OK" });
    }
    catch (error) {
        console.log(error);
    }
    finally {
        yield prisma_1.prisma.$disconnect();
    }
}));
router.get("/list", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma_1.prisma.batchYear.findMany();
        res.status(200).json(data);
    }
    catch (error) {
        console.log(error);
    }
    finally {
        yield prisma_1.prisma.$disconnect();
    }
}));
exports.default = router;
