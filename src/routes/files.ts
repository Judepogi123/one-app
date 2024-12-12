import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import XLSX from "xlsx";

//utils
import { extractYear } from "../utils/date";
import { handleSpecialChar, handleGender } from "../utils/data";

//database
import { prisma, Candidates, Voters } from "../../prisma/prisma";
//props
import { DataProps, RejectListProps, UpdateDataProps } from "../interface/data";

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
        const candidates = await prisma.candidates.findMany();
        if (candidates.length <= 0) {
          return res.status(400).send("Candidates not found.");
        }

        sheets.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const data: DataProps[] =
            XLSX.utils.sheet_to_json<DataProps>(worksheet);

          processedData[sheetName] = data.map((row: DataProps) => {
            const newRow: Partial<DataProps> = {};
            console.log("ROw: ", `${row.No}`);
            
            const supporting = candidates.map((candidate) =>
              row[candidate.code as string] ? candidate.id : undefined
            );
            const candidateId = supporting.filter(Boolean);

            if (row["Voter's Name"]) {
              const [lastname, firstname] = row["Voter's Name"]
                .split(",")
                .map((name) => name.trim());
              newRow.lastname = handleSpecialChar(",", lastname) || "Unknown";
              newRow.firstname = firstname || "Unknown";
            } else {
              newRow.lastname = "Unknown";
              newRow.firstname = "Unknown";
            }
            newRow.No = row.No;
            newRow.Birthday = extractYear(row.Birthday as string);
            newRow.__EMPTY = row.__EMPTY || "O";
            newRow.Gender = handleGender(row.Gender);
            newRow.Address = row.Address || "Unknown";
            newRow.DL = row.DL ? "YES" : "NO";
            newRow.IL = row.IL ? "YES" : "NO";
            newRow.INC = row.INC ? "YES" : "NO";
            newRow.PWD = row.PWD ? "YES" : "NO";
            newRow.OR = row.OR ? "YES" : "NO";
            newRow.SC = row.SC ? "YES" : "NO";
            newRow["18-30"] = row["18-30"] ? "YES" : "NO";
            newRow.candidateId = candidateId[0];
            return newRow as DataProps;
          });
        });

        res.status(200).json(processedData);
      } catch (error) {
        console.log(error);

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
        if (!row) {
          continue;
        }
        successCounter++;
        io.emit("draftedCounter", successCounter);
        try {
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
              purokNumber: `${row.Address}`,
              barangaysId: barangayId,
              municipalsId: parseInt(zipCode, 10),
              draftID: draftID,
            },
          });

          if (!purok) {
            purok = await prisma.purok.create({
              data: {
                purokNumber: `${row.Address}`,
                municipalsId: parseInt(zipCode, 10),
                barangaysId: barangayId,
                draftID: draftID,
              },
            });
          }

          await prisma.voters.create({
            data: {
              lastname: row.lastname,
              firstname: row.firstname,
              gender: row.Gender,
              birthYear: `${row.Birthday}`,
              barangaysId: barangayId,
              municipalsId: parseInt(zipCode, 10),
              newBatchDraftId: draftID,
              calcAge: !row.Birthday
                ? 0
                : extractYear(row.Birthday as string) ?? 0,
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
            },
          });
        } catch (error) {
          console.log(row["Voter's Name"], error);
          continue;
        }
      }

      res.status(200).json({
        message: "Success",
        rejectList: rejectList || [],
        successCount: successCounter,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({ status: "Internal server error", message: `${error}` });
    }
  });

  router.post(
    "/update-voters",
    upload.single("file"),
    async (req: Request, res: Response) => {
      const { zipCode, barangayId } = req.body;
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const filePath = path.join(uploadDir, req.file.filename);
      const rejectList: RejectListProps[] = [];
      try {
        const workbook = XLSX.readFile(filePath);
        const sheets = workbook.SheetNames;
        let updateVoterCounter = 0;
        let validdatedVoters: number = 0;
        io.emit("updateVoterCounter", updateVoterCounter);

        const candidates = await prisma.candidates.findMany();
        if (candidates.length <= 0) {
          return res.status(400).send("Candidates not found.");
        }

        for (const sheetName of sheets) {
          const sheet = workbook.Sheets[sheetName];
          const data: UpdateDataProps[] =
            XLSX.utils.sheet_to_json<UpdateDataProps>(sheet);

          for (const row of data) {
            const newRow: UpdateDataProps = {
              lastname: "Unknown",
              firstname: "Unknown",
              DL: row.DL || undefined,
              INC: row.INC || undefined,
              OR: row.OR || undefined,
            };

            const supporting = candidates.map((candidate) =>
              row[candidate.code as string] ? candidate.id : undefined
            );

            if (row["Voter's Name"]) {
              const [lastname, firstname] = row["Voter's Name"]
                .split(",")
                .map((name) => name.trim());
              newRow.lastname = handleSpecialChar(",", lastname) || "Unknown";
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
            const voterMetaData = await prisma.voters.findFirst({
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
            await prisma.voters.update({
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

        const totalAreaVoters = await prisma.voters.count({
          where: {
            barangaysId: barangayId,
          },
        });

        const percentage = (updateVoterCounter / totalAreaVoters) * 100;
        await prisma.validation.create({
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
      } catch (error) {
        console.error(error);
        res.status(500).send({
          status: "Internal server error",
          message: "Something went wrong on the server. Please try again.",
        });
      }
    }
  );

  return router;
};
