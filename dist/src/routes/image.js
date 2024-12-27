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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, "uploads");
const upload = (0, multer_1.default)({ dest: uploadDir });
router.post("/image", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    try {
        const imagePath = path_1.default.join(uploadDir, req.file.filename);
        const result = yield stoage_1.default.uploader.upload(imagePath);
        const url = yield stoage_1.default.api.resource(result.public_id);
        res.status(200).json(url);
    }
    catch (error) {
        console.log("Error uploading", error);
        res.status(500).send("Internal server error");
    }
}));
exports.default = router;
