import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import XLSX from "xlsx";
import z from "zod";

//utils
import { extractYear } from "../utils/date";

//database
import { PrismaClient } from "@prisma/client";

//props
import { RowProps, DataProps } from "../interface/data";


const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, "uploads");
const upload = multer({ dest: uploadDir });

export default (io: any) => {
  const router = express.Router();

  router.post(
    "/file",
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const filePath = path.join(uploadDir, req.file.filename);

      try {
        const workbook = XLSX.readFile(filePath);
        const sheets = workbook.SheetNames;

        const processedData: { [sheetName: string]: DataProps[] } = {};

        sheets.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const data: DataProps[] =
            XLSX.utils.sheet_to_json<DataProps>(worksheet);

          processedData[sheetName] = data.map((row: DataProps) => {
            const newRow: Partial<DataProps> = {};

            if (row["Voter's Name"]) {
              const [lastname, firstname] = row["Voter's Name"]
                .split(",")
                .map((name) => name.trim());
              newRow.lastname = lastname || "Unknown";
              newRow.firstname = firstname || "Unknown";
            } else {
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

            return newRow as DataProps;
          });
        });

        res.status(200).json(processedData);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    }
  );

  router.post("/draft", async (req: Request, res: Response) => {
    const data = req.body.data;
    const zipCode = req.body.zipCode;
    const barangayId = req.body.barangayId;
    const draftID = req.body.draftID;
    if (!data) {
      res.status(400).send("Empty list!");
      return;
    }

    try {
      let rejectList: DataProps[] = [];
      let successCounter = 0;

      for (let row of Object.values(data as DataProps[]).flat()) {
        successCounter++;
        io.emit("draftedCounter", successCounter);
        if (!row) {
          continue;
        }

        if (row.DL === "YES") {
          rejectList.push({ ...row, saveStatus: "Dead" });
          continue;
        }

        const voterExisted = await prisma.voters.findFirst({
          where: {
            firstname: row.firstname,
            lastname: row.lastname,
            barangaysId: barangayId,
            municipalsId: parseInt(zipCode, 10),
          },
        });

        if (voterExisted) {
          rejectList.push({
            ...row,
            saveStatus: "Existed",
          });
          continue;
        }

        let purok = await prisma.purok.findFirst({
          where: {
            purokNumber: row.Address,
            barangaysId: barangayId,
            municipalsId: parseInt(zipCode, 10),
            draftID: draftID
          },
        });

        if (!purok) {
          purok = await prisma.purok.create({
            data: {
              purokNumber: row.Address,
              municipalsId: parseInt(zipCode, 10),
              barangaysId: barangayId,
              draftID: draftID
            },
          });
        }

        await prisma.voters.create({
          data: {
            lastname: row.lastname,
            firstname: row.firstname,
            birthYear: `${row["B-day"]}`,
            barangaysId: barangayId,
            municipalsId: parseInt(zipCode, 10),
            newBatchDraftId: draftID,
            calcAge:
              row["B-day"] === "Unknown"
                ? 0
                : extractYear(row["B-day"] as string) ?? 0,
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
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });

  return router
};
