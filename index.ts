import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import multer from "multer";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import cors from "cors";

// interface
import { usersSchema, votersSchema } from "./src/interface/interface";

//routes
import municipal from "./routes/municipal";
import barangay from "./routes/barangay";
import precints from "./routes/precints";
import batchYear from "./routes/batch";

const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const uploadDir = path.join(__dirname, "uploads");
const upload = multer({ dest: uploadDir });

app.use(express.json());
app.use(express.static("public"));

interface RowData {
  [key: string]: any;
  number?: number;
  __EMPTY?: string;
  __EMPTY_1?: string;
  __EMPTY_12?: string;
  __EMPTY_15?: string;
  lastName?: string;
  firstName?: string;
}

// Endpoint to receive the Excel file
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = path.join(uploadDir, req.file.filename);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheets = workbook.SheetNames;

    // Extract data from each sheet and process __EMPTY_1 key
    const processedData: { [sheetName: string]: RowData[] } = {};
    sheets.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: RowData[] = XLSX.utils.sheet_to_json<RowData>(worksheet);

      processedData[sheetName] = data.map((row: RowData) => {
        if (!row.__EMPTY) {
          row.__EMPTY = "Unknown";
        }

        if (row.__EMPTY_1) {
          const splitValues = row.__EMPTY_1.split(",");
          row.firstName = splitValues[1];
          row.lastName = splitValues[0];
        }
        return {
          No: row.number,
          Fullname: row.__EMPTY_1,
          Lastname: row.lastName,
          Firstname: row.firstName,
          Purok: row.__EMPTY_12,
          prec: row.__EMPTY_15,
          Age_Range:
            row.__EMPTY === "*"
              ? "18-30"
              : row.__EMPTY === "C"
              ? "SC"
              : row.__EMPTY,
        };
      });
    });

    fs.unlinkSync(filePath);
    res.json(processedData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to process the file.");
  }
});

app.use("/municipal", municipal);
app.use("/barangay", barangay);
app.use("/precint", precints);
app.use("/year", batchYear)

app.post("/new", async (req: Request, res: Response) => {
  try {
    const userData = votersSchema.parse(req.body);
    const { barangaysId, municipalsId, precentsId, ...voterData } = userData;

    const existingVoter = await prisma.voters.findFirst({
      where: { precentsId },
    });

    if (existingVoter) {
      return await prisma.precents.create({
        data: { barangayId: barangaysId, municipalsId: municipalsId,id: precentsId },
      });
    }

    const newVoter = await prisma.voters.create({
      data: userData,
    });

    res.status(200).json(newVoter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/", async (req: Request, res: Response) => {
  try {
    const users = usersSchema.parse(req.body);
    await prisma.users.createMany({ data: users });
    const data = await prisma.users.findMany();
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating users" });
  } finally {
    await prisma.$disconnect();
  }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
