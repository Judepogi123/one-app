import express, { Request, Response } from "express";
import multer from "multer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

//utils
import { extractYear } from "../utils/date";
import { handleSpecialChar, handleGender } from "../utils/data";

//database
import { prisma } from "../../prisma/prisma";
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
      return res.status(400).send("Empty list!");
    }

    //console.log(JSON.stringify(data, null, 2), "Data end");
    try {
      let rejectList: DataProps[] = [];
      let successCounter = 0;

      const votersData = Object.values(data as DataProps[])
        .flat()
        .filter(Boolean);
      const voterNames = votersData.map((row) => ({
        firstname: row.firstname,
        lastname: row.lastname,
      }));
      console.log("Logged 1");

      // Fetch all existing voters once
      const existingVoters = await prisma.voters.findMany({
        where: {
          OR: voterNames,
          barangaysId: barangayId,
          municipalsId: parseInt(zipCode, 10),
        },
        include: {
          barangay: true,
          municipal: true,
        },
      });
      console.log("Logged 2");
      // const existingOverAll = await prisma.voters.findMany({
      //   where: {
      //     OR: voterNames,
      //   },
      //   include: {
      //     barangay: true,
      //     municipal: true,
      //   },
      // });

      // Map to quickly lookup existing voters
      const existingVoterMap = new Map();
      existingVoters.forEach((voter) => {
        const key = `${voter.firstname}_${voter.lastname}`;
        if (!existingVoterMap.has(key)) {
          existingVoterMap.set(key, []);
        }
        existingVoterMap.get(key).push(voter);
      });
      console.log("Logged 3");
      const purokCache = new Map<string, any>();
      const newVotersToInsert = [];
      const voterRecordsToInsert = [];

      for (const row of votersData) {
        console.log("Logged 4");
        try {
          const key = `${row.firstname}_${row.lastname}`;
          const existingVoter = existingVoterMap.get(key);

          // Check for existing voters
          if (existingVoter?.length > 1) {
            rejectList.push({
              ...row,
              saveStatus: `Multiple entry in Barangay ${existingVoter[0].barangay.name}-${existingVoter[0].municipal.name}`,
            });

            voterRecordsToInsert.push({
              votersId: existingVoter[0].id,
              desc: `Multiple entry in Barangay ${existingVoter[0].barangay.name}-${existingVoter[0].municipal.name}`,
              questionable: true,
            });
            continue;
          }

          // if (existingOverAll?.length > 1) {
          //   rejectList.push({
          //     ...row,
          //     saveStatus: `Found in ${existingOverAll.map(
          //       (item) => `${item.barangay.name}-${item.municipal.name}, `
          //     )}`,
          //   });

          //   voterRecordsToInsert.push({
          //     votersId: existingOverAll[0].id,
          //     desc: `Found in ${existingOverAll.map(
          //       (item) => `${item.barangay.name}-${item.municipal.name}, `
          //     )}`,
          //     questionable: true,
          //   });
          //   continue;
          // }

          // Handle Purok creation with caching
          const purokKey = `${row.Address}_${barangayId}_${zipCode}_${draftID}`;
          let purok = purokCache.get(purokKey);

          if (!purok) {
            purok = await prisma.purok.findFirst({
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

            purokCache.set(purokKey, purok);
          }

          // Queue for batch insertion
          newVotersToInsert.push({
            lastname: row.lastname,
            firstname: row.firstname,
            gender: row.Gender,
            birthYear: `${row.Birthday}`,
            barangaysId: barangayId,
            municipalsId: parseInt(zipCode, 10),
            newBatchDraftId: draftID,
            calcAge: row.Birthday
              ? extractYear(row.Birthday as string) ?? 0
              : 0,
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
          });

          successCounter++;
          io.emit("draftedCounter", successCounter);
        } catch (error) {
          console.log(row["Voter's Name"], error);
          continue;
        }
      }
      console.log("Logged 5");

      // Batch insert voters and voter records
      if (newVotersToInsert.length > 0) {
        await prisma.voters.createMany({
          data: newVotersToInsert,
          skipDuplicates: true,
        });
      }

      if (voterRecordsToInsert.length > 0) {
        await prisma.voterRecords.createMany({
          data: voterRecordsToInsert,
        });
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

  router.post("/export-pdf", async (req, res) => {
    const data = req.body;
    const { surveyCode } = data;
    try {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${surveyCode}.pdf`);

      doc.pipe(res);
      doc
        .font("fonts/PalatinoBold.ttf")
        .fontSize(25)
        .text("Some text with an embedded font!", 100, 100);
      doc.end();
    } catch (error) {
      res.status(500).send({
        message: "Something went wrong on the server. Please try again",
      });
    }
  });

  return router;
};
