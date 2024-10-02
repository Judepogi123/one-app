import express, { Request, Response } from "express";
import PDFKit from "pdfkit";
import fs from "fs";
import path from "path";

//props
import { SelectedOptionProps } from "../src/interface/data";

const router = express.Router();

router.post("/pdf", async (req: Request, res: Response) => {
  const { option }: { option: SelectedOptionProps } = req.body;

  try {
    if (!option) {
      return res.status(400).json({ error: "Option data is missing" });
    }

    const doc = new PDFKit();

    const sanitizedTitle = option.title.replace(/[<>:"/\\|?*]+/g, "");

    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, `${sanitizedTitle}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
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
    doc.moveDown(1)
    doc
      .fontSize(12)
      .text(`Total: ${option.overAllResponse}`, { align: "right", }).font('Helvetica-Bold')

    doc.end();

    writeStream.on("finish", () => {
      res.download(filePath, `${option.title}.pdf`, (err) => {
        if (err) {
          console.error("Error while sending the file:", err);
          res.status(500).json({ error: "Failed to download PDF" });
        }
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
