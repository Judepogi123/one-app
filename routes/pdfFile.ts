import express, { Request, Response } from "express";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { SelectedOptionProps } from "../src/interface/data";

const router = express.Router();

interface TableDataProps {
  Barangay: string;
  "Total Gender Size": string | number | null;
  Responses: number;
}

router.post("/xlsx", async (req: Request, res: Response) => {
  const { option }: { option: SelectedOptionProps } = req.body;

  try {
    if (!option) {
      return res.status(400).json({ error: "Option data is missing" });
    }
    const sanitizedTitle = option.title.replace(/[<>:"/\\|?*]+/g, "");

    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const tableData: TableDataProps[] = option.barangays.map((item) => ({
      Barangay: item.name,
      "Total Gender Size": item.femaleSize + item.maleSize,
      Responses: item.optionResponse,
    }));

    tableData.push({
      Barangay: "Total",
      "Total Gender Size": " ",
      Responses: option.overAllResponse,
    });

    const workbook = XLSX.utils.book_new();

    // Prepare the title and header rows
    const titleRow = [[option.title]];
    const headerRow = [["Barangay", "Total Gender Size", "Responses"]];

    // Create a new worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(titleRow);
    
    // Merge the title cell across all columns
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    // Add header row
    XLSX.utils.sheet_add_aoa(worksheet, headerRow, { origin: "A2" });

    // Add data to the worksheet starting from row 3
    XLSX.utils.sheet_add_json(worksheet, tableData, { skipHeader: true, origin: "A3" });

    // Apply styles including borders
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
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
        const length = row[key as keyof TableDataProps]?.toString().length || 0;
        acc[i] = Math.max(acc[i] || 0, length);
      });
      return acc;
    }, [] as number[]);

    const maxWidth = Math.max(...maxColumnWidths);
    worksheet['!cols'] = maxColumnWidths.map(() => ({ wch: maxWidth }));

    XLSX.utils.book_append_sheet(workbook, worksheet, "Barangay Data");

    const filePath = path.join(exportDir, `${sanitizedTitle}.xlsx`);
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, `${sanitizedTitle}.xlsx`, (err) => {
      if (err) {
        console.error("Error while sending the file:", err);
        res.status(500).json({ error: "Failed to download Excel file" });
      }
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).json({ error: "Failed to generate Excel file" });
  }
});

export default router;
