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
const xlsx_1 = __importDefault(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.post("/xlsx", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { option } = req.body;
    try {
        if (!option) {
            return res.status(400).json({ error: "Option data is missing" });
        }
        const sanitizedTitle = option.title.replace(/[<>:"/\\|?*]+/g, "");
        const exportDir = path_1.default.join(__dirname, "../../exports");
        if (!fs_1.default.existsSync(exportDir)) {
            fs_1.default.mkdirSync(exportDir, { recursive: true });
        }
        const tableData = option.barangays.map((item) => ({
            Barangay: item.name,
            "Total Gender Size": item.femaleSize + item.maleSize,
            Responses: item.optionResponse,
        }));
        tableData.push({
            Barangay: "Total",
            "Total Gender Size": " ",
            Responses: option.overAllResponse,
        });
        const workbook = xlsx_1.default.utils.book_new();
        // Prepare the title and header rows
        const titleRow = [[option.title]];
        const headerRow = [["Barangay", "Total Gender Size", "Responses"]];
        // Create a new worksheet
        const worksheet = xlsx_1.default.utils.aoa_to_sheet(titleRow);
        // Merge the title cell across all columns
        worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
        // Add header row
        xlsx_1.default.utils.sheet_add_aoa(worksheet, headerRow, { origin: "A2" });
        // Add data to the worksheet starting from row 3
        xlsx_1.default.utils.sheet_add_json(worksheet, tableData, { skipHeader: true, origin: "A3" });
        // Apply styles including borders
        const range = xlsx_1.default.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellAddress = xlsx_1.default.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress] || {}; // If the cell doesn't exist, create an empty object
                // Set borders
                cell.s = {
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } },
                    },
                };
                worksheet[cellAddress] = cell; // Assign the cell back to the worksheet
            }
        }
        // Calculate maximum width across all columns
        const maxColumnWidths = tableData.reduce((acc, row) => {
            Object.keys(row).forEach((key, i) => {
                var _a;
                const length = ((_a = row[key]) === null || _a === void 0 ? void 0 : _a.toString().length) || 0;
                acc[i] = Math.max(acc[i] || 0, length);
            });
            return acc;
        }, []);
        const maxWidth = Math.max(...maxColumnWidths);
        worksheet['!cols'] = maxColumnWidths.map(() => ({ wch: maxWidth }));
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, "Barangay Data");
        const filePath = path_1.default.join(exportDir, `${sanitizedTitle}.xlsx`);
        xlsx_1.default.writeFile(workbook, filePath);
        res.download(filePath, `${sanitizedTitle}.xlsx`, (err) => {
            if (err) {
                console.error("Error while sending the file:", err);
                res.status(500).json({ error: "Failed to download Excel file" });
            }
        });
    }
    catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).json({ error: "Failed to generate Excel file" });
    }
}));
exports.default = router;
