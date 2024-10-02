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
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.post("/pdf", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { option } = req.body;
    try {
        if (!option) {
            return res.status(400).json({ error: "Option data is missing" });
        }
        const doc = new pdfkit_1.default();
        const sanitizedTitle = option.title.replace(/[<>:"/\\|?*]+/g, "");
        const exportDir = path_1.default.join(__dirname, "../../exports");
        if (!fs_1.default.existsSync(exportDir)) {
            fs_1.default.mkdirSync(exportDir, { recursive: true });
        }
        const filePath = path_1.default.join(exportDir, `${sanitizedTitle}.pdf`);
        const writeStream = fs_1.default.createWriteStream(filePath);
        doc.pipe(writeStream);
        // Set the title for the PDF
        doc
            .fontSize(18)
            .text(`${option.title}`, { align: "center" });
        // Map the barangays data to a structured tableData array
        const tableData = option.barangays.map((item) => ({
            name: item.name,
            total: item.femaleSize + item.maleSize, // Total gender size
            responses: item.optionResponse, // Number of responses
        }));
        doc.moveDown(2); // Add some space before the table
        doc.fontSize(14).text("Barangay", { continued: true });
        doc
            .fontSize(14)
            .text("Total Gender Size", { continued: true, align: "center" });
        doc.fontSize(14).text("Responses", { align: "right" });
        doc.moveDown(1);
        tableData.forEach((row) => {
            doc.fontSize(12).text(row.name, { continued: true });
            doc
                .fontSize(12)
                .text(row.total.toString(), { continued: true, align: "center" });
            doc.fontSize(12).text(row.responses.toString(), { align: "right" });
            doc.moveDown(0.5);
        });
        doc.moveDown(1);
        doc
            .fontSize(12)
            .text(`Total: ${option.overAllResponse}`, { align: "right", }).font('Helvetica-Bold');
        doc.end();
        writeStream.on("finish", () => {
            res.download(filePath, `${option.title}.pdf`, (err) => {
                if (err) {
                    console.error("Error while sending the file:", err);
                    res.status(500).json({ error: "Failed to download PDF" });
                }
            });
        });
    }
    catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
}));
exports.default = router;
