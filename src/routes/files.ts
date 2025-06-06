import express, { Request, Response } from 'express';
import multer from 'multer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import ExcelJS from 'exceljs';

//utils
import { extractYear } from '../utils/date';
import {
  handleSpecialChar,
  handleGender,
  alphabetic,
  calculatePercentage,
  memberTags,
  teamMembersCount,
  handleLevelLabel,
  handleLevel,
  formatToLocalPHTime,
  handleCalVariance,
} from '../utils/data';

//database
import { Barangays, DuplicateteamMembers, prisma, Team, Voters } from '../../prisma/prisma';
//props
import {
  DataProps,
  RejectListProps,
  UpdateDataProps,
  BarangayProps,
  VotersProps,
  TeamProps,
} from '../interface/data';
import { GraphQLError } from 'graphql';

const uploadDir = path.join(__dirname, 'uploads');
const upload = multer({ dest: uploadDir });

const drawTable = (
  doc: PDFKit.PDFDocument,
  startY: number,
  headers: string[],
  title: string,
  data: BarangayProps[],
) => {
  const col1X = 60;
  const col2X = 200;
  const col3X = 350;
  const rowHeight = 20;
  let y = startY;

  // Draw Table Header
  doc.fontSize(12).text(title, 50, y);
  y += 20;
  doc.moveTo(50, y).lineTo(550, y).stroke();

  // Centered Headers
  [col1X, col2X, col3X].forEach((x, index) => {
    const textWidth = doc.widthOfString(headers[index]);
    doc.text(headers[index], x + (100 - textWidth) / 2, y + 5);
  });

  y += 20;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  console.log(data);

  // Draw Table Rows with Centered Data
  for (let i = 0; i < 5; i++) {
    const rowData = [``];

    [col1X, col2X, col3X].forEach((x, index) => {
      const textWidth = doc.widthOfString(rowData[index]);
      doc.text(rowData[index], x + (100 - textWidth) / 2, y + 5);
    });

    y += rowHeight;
    doc.moveTo(50, y).lineTo(550, y).stroke();
  }
};

export default (io: any) => {
  const router = express.Router();

  router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(uploadDir, req.file.filename);

    try {
      const workbook = XLSX.readFile(filePath);
      const sheets = workbook.SheetNames;

      const processedData: { [sheetName: string]: DataProps[] } = {};
      const candidates = await prisma.candidates.findMany();
      if (candidates.length <= 0) {
        return res.status(400).send('Candidates not found.');
      }

      sheets.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const data: DataProps[] = XLSX.utils.sheet_to_json<DataProps>(worksheet);

        processedData[sheetName] = data.map((row: DataProps) => {
          const newRow: Partial<DataProps> = {};

          const supporting = candidates.map((candidate) =>
            row[candidate.code as string] ? candidate.id : undefined,
          );
          const candidateId = supporting.filter(Boolean);
          console.log({ ...row, idol: candidateId[0] });
          if (row["Voter's Name"]) {
            const [lastname, firstname] = row["Voter's Name"].split(',').map((name) => name.trim());
            newRow.lastname = handleSpecialChar(',', lastname) || 'Unknown';
            newRow.firstname = firstname || 'Unknown';
          } else {
            newRow.lastname = 'Unknown';
            newRow.firstname = 'Unknown';
          }
          newRow.No = row.No;
          newRow.Birthday = extractYear(row.Birthday as string);
          newRow.__EMPTY = row.__EMPTY || 'O';
          newRow.Gender = handleGender(row.Gender);
          newRow.Address = row.Address || 'Unknown';
          newRow.DL = row.DL ? 'YES' : 'NO';
          newRow.IL = row.IL ? 'YES' : 'NO';
          newRow.INC = row.INC ? 'YES' : 'NO';
          newRow.PWD = row.PWD ? 'YES' : 'NO';
          newRow.OR = row.OR ? 'YES' : 'NO';
          newRow.SC = row.SC ? 'YES' : 'NO';
          newRow['18-30'] = row['18-30'] ? 'YES' : 'NO';
          newRow.candidateId = candidateId[0];
          return newRow as DataProps;
        });
      });

      res.status(200).json(processedData);
    } catch (error) {
      console.log(error);

      res.status(500).send('Internal Server Error');
    }
  });

  router.post(
    '/update-voter-precincts',
    upload.single('file'),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
      const barangayId = req.body.barangayId;
      const filePath = path.join(uploadDir, req.file.filename);

      try {
        const workbook = XLSX.readFile(filePath);
        const sheets = workbook.SheetNames;
        const updateResults: { success: number; failed: number } = { success: 0, failed: 0 };
        const barangay = await prisma.barangays.findUnique({
          where: {
            id: barangayId,
          },
        });

        if (!barangay) {
          throw new GraphQLError('Barangay not found!');
        }
        // Process each sheet sequentially (not in parallel)
        for (const sheetName of sheets) {
          const worksheet = workbook.Sheets[sheetName];
          const data: DataProps[] = XLSX.utils.sheet_to_json<DataProps>(worksheet);
          console.log(`Processing ${data.length} records from sheet ${sheetName}`);

          const chunkSize = 100;

          // Process data in chunks of 100
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            console.log(`Processing chunk starting at record ${i + 1}`);

            // Process each voter in the current chunk
            for (const voter of chunk) {
              try {
                const [existingVoter, precinct] = await prisma.$transaction([
                  prisma.voters.findFirst({
                    where: { idNumber: voter.No, barangaysId: barangay.id },
                  }),
                  prisma.precents.findFirst({
                    where: { precintNumber: voter['PREC.'], municipalsId: barangay.municipalId },
                  }),
                ]);

                if (!existingVoter || !precinct) {
                  console.log(`Skipping - Voter or precinct not found for ID: ${voter.No}`);
                  updateResults.failed++;
                  continue;
                }

                await prisma.voters.update({
                  where: { id: existingVoter.id },
                  data: { precintsId: precinct.id },
                });

                updateResults.success++;
              } catch (error) {
                console.error(`Error updating voter ${voter.No}:`, error);
                updateResults.failed++;
              }
            }
          }
        }

        res.status(200).json({
          message: 'Voter precinct update completed',
          results: updateResults,
        });
      } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Internal Server Error');
      } finally {
        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    },
  );

  router.post('/draft', async (req: Request, res: Response) => {
    const data = req.body.data;
    const zipCode = req.body.zipCode;
    const barangayId = req.body.barangayId;
    const draftID = req.body.draftID;

    if (!data) {
      return res.status(400).send('Empty list!');
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
      console.log('Logged 1');

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
      console.log('Logged 2');
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
      console.log('Logged 3');
      const purokCache = new Map<string, any>();
      const newVotersToInsert = [];
      const voterRecordsToInsert = [];

      for (const row of votersData) {
        console.log('Logged 4 candidate', row.candidateId);
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
            calcAge: row.Birthday ? extractYear(row.Birthday as string) ?? 0 : 0,
            purokId: purok.id,
            pwd: row.PWD,
            oor: row.OR,
            inc: row.INC,
            illi: row.IL,
            inPurok: true,
            hubId: null,
            houseHoldId: undefined,
            mobileNumber: 'Unknown',
            senior: row.SC === 'YES' ? true : false,
            status: row.DL === 'YES' ? 0 : 1,
            candidatesId: row.candidateId,
            precintsId: undefined,
            youth: row['18-30'] === 'YES' ? true : false,
            idNumber: `${row.No}`,
          });

          successCounter++;
          io.emit('draftedCounter', successCounter);
        } catch (error) {
          console.log(row["Voter's Name"], error);
          continue;
        }
      }
      console.log('Logged 5');

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
        message: 'Success',
        rejectList: rejectList || [],
        successCount: successCounter,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ status: 'Internal server error', message: `${error}` });
    }
  });

  router.post('/update-voters', upload.single('file'), async (req: Request, res: Response) => {
    const { zipCode, barangayId } = req.body;
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const rejectList: RejectListProps[] = [];
    try {
      const workbook = XLSX.readFile(filePath);
      const sheets = workbook.SheetNames;
      let updateVoterCounter = 0;
      let validdatedVoters: number = 0;
      io.emit('updateVoterCounter', updateVoterCounter);

      const candidates = await prisma.candidates.findMany();
      if (candidates.length <= 0) {
        return res.status(400).send('Candidates not found.');
      }

      for (const sheetName of sheets) {
        const sheet = workbook.Sheets[sheetName];
        const data: UpdateDataProps[] = XLSX.utils.sheet_to_json<UpdateDataProps>(sheet);

        for (const row of data) {
          const newRow: UpdateDataProps = {
            lastname: 'Unknown',
            firstname: 'Unknown',
            DL: row.DL || undefined,
            INC: row.INC || undefined,
            OR: row.OR || undefined,
          };

          const supporting = candidates.map((candidate) =>
            row[candidate.code as string] ? candidate.id : undefined,
          );

          if (row["Voter's Name"]) {
            const [lastname, firstname] = row["Voter's Name"].split(',').map((name) => name.trim());
            newRow.lastname = handleSpecialChar(',', lastname) || 'Unknown';
            newRow.firstname = firstname || 'Unknown';
          }

          if (!row.DL && !row.INC && !row.OR && !supporting[0]) {
            rejectList.push({
              firstname: newRow.firstname,
              lastname: newRow.lastname,
              reason: 'Updated',
              code: 11,
              barangay: barangayId,
              municipal: zipCode,
              teamId: 'Unknown',
              id: 'Unknown',
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
              reason: 'Voter does not exist',
              code: 0,
              barangay: barangayId,
              municipal: zipCode,
              teamId: 'Unknown',
              id: 'Unknown',
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
              oor: newRow.OR ? 'YES' : 'NO',
              status: newRow.DL ? 0 : 1,
              inc: newRow.INC ? 'YES' : 'NO',
              candidatesId: supporting[0],
            },
          });

          rejectList.push({
            lastname: voterMetaData.lastname,
            firstname: voterMetaData.firstname,
            reason: 'Voter updated successfully',
            code: 0,
            barangay: voterMetaData.barangaysId,
            municipal: voterMetaData.municipalsId,
            id: voterMetaData.id,
            teamId: 'Unknown',
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
        status: 'Internal server error',
        message: 'Something went wrong on the server. Please try again.',
      });
    }
  });

  router.post('/export-pdf', async (req, res) => {
    const data = req.body;
    const { surveyCode } = data;
    try {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${surveyCode}.pdf`);

      doc.pipe(res);
      doc
        .font('fonts/PalatinoBold.ttf')
        .fontSize(25)
        .text('Some text with an embedded font!', 100, 100);
      doc.end();
    } catch (error) {
      res.status(500).send({
        message: 'Something went wrong on the server. Please try again',
      });
    }
  });

  router.post('/voter-list', upload.single('file'), async (req: Request, res: Response) => {
    const zipCode = req.body.zipCode;
    const barangay = req.body.barangay;

    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }

      const filePath = path.join(uploadDir, req.file.filename);
      const workbook = XLSX.readFile(filePath);
      const sheets = workbook.SheetNames;

      const processedData: { [sheetName: string]: DataProps[] } = {};
      const candidates = await prisma.candidates.findMany();
      const barangayData = await prisma.barangays.findFirst({
        where: {
          municipalId: parseInt(zipCode, 10),
          number: parseInt(barangay, 10),
        },
      });
      if (!barangayData) {
        throw new GraphQLError('Could not find any barangay with the number');
      }
      let delistedCount = 0;
      let addedCount = 0;
      const votersToAdd: {
        lastname: string;
        firstname: string;
        gender: string;
        birthYear: string;
        barangaysId: string;
        municipalsId: number;
        newBatchDraftId: null;
        calcAge: number;
        purokId: any;
        pwd: string;
        oor: string;
        inc: string;
        illi: string;
        inPurok: boolean;
        hubId: null;
        houseHoldId: null;
        mobileNumber: string;
        senior: boolean;
        status: number;
        candidatesId: string | null;
        precintsId: null;
        youth: boolean;
        idNumber: string;
        level: number;
        saveStatus: string | undefined;
      }[] = [];
      const destlistedVoters: {
        votersId: string;
        municipalsId: number;
        barangaysId: string;
      }[] = [];
      const purokCache = new Map<string, any>();
      for (const sheetName of sheets) {
        const worksheet = workbook.Sheets[sheetName];
        const rows: Partial<DataProps>[] = XLSX.utils.sheet_to_json<Partial<DataProps>>(worksheet);

        if (sheetName === 'OVERALL') {
          console.log('Skip');
          continue;
        }
        if (sheetName === '-') {
          processedData[sheetName] = await Promise.all(
            rows.map(async (row: Partial<DataProps>) => {
              const newRow: Partial<DataProps> = {};

              if (row["Voter's Name"]) {
                const [lastname, firstname] = row["Voter's Name"]
                  .split(',')
                  .map((name) => name.trim());
                newRow.lastname = handleSpecialChar(',', lastname) || 'Unknown';
                newRow.firstname = firstname || 'Unknown';
              } else {
                newRow.lastname = 'Unknown';
                newRow.firstname = 'Unknown';
              }

              const [voter, delisted] = await prisma.$transaction([
                prisma.voters.findFirst({
                  where: {
                    lastname: newRow.lastname,
                    firstname: newRow.firstname,
                    municipalsId: parseInt(zipCode, 10),
                    barangaysId: barangayData.id,
                  },
                }),
                prisma.delistedVoter.findFirst({
                  where: {
                    voter: {
                      lastname: newRow.lastname,
                      firstname: newRow.firstname,
                      municipalsId: parseInt(zipCode, 10),
                      barangaysId: barangayData.id,
                    },
                  },
                }),
              ]);
              if (delisted) {
                console.log('Already In delisted: ', newRow.firstname, newRow.lastname);
                return {
                  ...row,
                } as DataProps;
              }
              if (voter) {
                console.log('New In delisted: ', newRow.firstname, newRow.lastname);

                delistedCount++;
                destlistedVoters.push({
                  votersId: voter.id,
                  municipalsId: parseInt(zipCode, 10),
                  barangaysId: barangayData.id,
                });
              }

              return {
                ...row,
              } as DataProps;
            }),
          );
        }
        if (sheetName === '+') {
          processedData[sheetName] = await Promise.all(
            rows.map(async (row: Partial<DataProps>) => {
              const newRow: Partial<DataProps> = {};
              const supporting = candidates.map((candidate) =>
                row[candidate.code as string] ? candidate.id : null,
              );
              const candidateId = supporting.filter(Boolean);

              const purokKey = `${row.Address}_${barangayData.id}_${zipCode}`;
              let purok = purokCache.get(purokKey);

              if (!purok) {
                purok = await prisma.purok.findFirst({
                  where: {
                    purokNumber: `${row.Address}`,
                    barangaysId: barangayData.id,
                    municipalsId: parseInt(zipCode, 10),
                  },
                });

                if (!purok) {
                  purok = await prisma.purok.create({
                    data: {
                      purokNumber: `${row.Address}`,
                      municipalsId: parseInt(zipCode, 10),
                      barangaysId: barangayData.id,
                      draftID: '',
                    },
                  });
                }

                purokCache.set(purokKey, purok);
              }

              if (row["Voter's Name"]) {
                const [lastname, firstname] = row["Voter's Name"]
                  .split(',')
                  .map((name) => name.trim());
                newRow.lastname = handleSpecialChar(',', lastname) || 'Unknown';
                newRow.firstname = firstname || 'Unknown';
              } else {
                newRow.lastname = 'Unknown';
                newRow.firstname = 'Unknown';
              }

              const voter = await prisma.voters.findFirst({
                where: {
                  lastname: newRow.lastname,
                  firstname: newRow.firstname,
                  municipalsId: parseInt(zipCode, 10),
                  barangaysId: barangayData.id,
                },
              });
              if (voter) {
                console.log('ALready registered: ', newRow.firstname, newRow.lastname);
              }
              if (!voter) {
                votersToAdd.push({
                  lastname: newRow.lastname,
                  firstname: newRow.firstname,
                  gender: handleGender(row.Gender),
                  birthYear: `${row.Birthday}`,
                  barangaysId: barangayData.id,
                  municipalsId: parseInt(zipCode, 10),
                  newBatchDraftId: null,
                  calcAge: row.Birthday ? extractYear(row.Birthday as string) ?? 0 : 0,
                  purokId: purok.id,
                  pwd: row.PWD ? 'YES' : 'NO',
                  oor: row.OR ? 'YES' : 'NO',
                  inc: row.INC ? 'YES' : 'NO',
                  illi: row.IL ? 'YES' : 'NO',
                  inPurok: true,
                  hubId: null,
                  houseHoldId: null,
                  mobileNumber: 'Unknown',
                  senior: row.SC === 'YES' ? true : false,
                  status: row.DL === 'YES' ? 0 : 1,
                  candidatesId: candidateId[0],
                  precintsId: null,
                  youth: row['18-30'] ? true : false,
                  idNumber: `${row.No}`,
                  level: 0,
                  saveStatus: 'listed',
                });
              }

              return {
                ...row,
              } as DataProps;
            }),
          );
        }
      }
      if (votersToAdd.length > 0) {
        console.log('Processed New: ONe', votersToAdd.length);

        await prisma.voters.createMany({
          data: votersToAdd,
          skipDuplicates: true,
        });
      }

      if (destlistedVoters.length > 0) {
        console.log('Processed Delisted ONE: ', destlistedVoters.length);
        await prisma.delistedVoter.createMany({
          data: destlistedVoters,
          skipDuplicates: true,
        });
      }
      console.log('Processed Delisted: ', destlistedVoters.length);
      console.log('Processed New: ', votersToAdd.length);

      res.status(200).json({
        message: 'File processed successfully',
        addedCount: addedCount,
        delistedCount: delistedCount,
      });
      console.log('NOt');
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.post('/supporter-report', async (req: Request, res: Response) => {
    const zipCode = req.body.zipCode;
    const id = req.body.id;
    const candidate = req.body.candidate;
    const barangayList = req.body.barangayList;
    const parsedData: BarangayProps[] = JSON.parse(barangayList);
    console.log(JSON.stringify(parsedData, null, 2));

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.created = new Date();

      // Add a worksheet with header and footer settings
      const worksheet = workbook.addWorksheet('Supporters', {
        pageSetup: {
          paperSize: 9,
          orientation: 'landscape',
          fitToPage: true,
          showGridLines: true,
        },
        headerFooter: {
          firstHeader: `&L&B${candidate} Supporter Report`,
          firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          oddHeader: `&L&B${candidate} 
          Supporter Report`,
          oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
        },
      });

      // Define worksheet columns
      worksheet.columns = [
        { header: 'Barangay', key: 'barangay', width: 15 },
        { header: 'Figure Heads', key: 'figureHead', width: 12 },
        { header: 'BC', key: 'bc', width: 10 },
        { header: 'PC', key: 'pc', width: 10 },
        { header: 'TL', key: 'tl', width: 10 },
        { header: 'Voters W/team', key: 'withTeam', width: 16 },
        // { header: "Voters W/o team", key: "withoutTeam", width: 16 },
        { header: '10+', key: 'aboveTen', width: 10 },
        { header: '10', key: 'equalTen', width: 10 },
        { header: '6-10', key: 'belowTen', width: 10 },
        { header: '5', key: 'equalFive', width: 10 },
        { header: '4', key: 'belowFive', width: 10 },
        { header: '1-3', key: 'belowEqualThree', width: 10 },
        { header: '0', key: 'noMembers', width: 10 },
        { header: 'OR', key: 'orMembers', width: 10 },
        { header: 'Dead inTeam', key: 'orMembers', width: 12 },
        { header: 'Population', key: 'population', width: 10 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true }; // Make text bold
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }; // Add borders (optional)
      });

      const sheetData = parsedData.map((item) => {
        return {
          barangay: item.name,
          figureHead: item.supporters.figureHeads,
          bc: item.supporters.bc,
          pc: item.supporters.pc,
          tl: item.supporters.tl,
          withTeam: item.supporters.withTeams,
          // withoutTeam: item.supporters.voterWithoutTeam,
          aboveTen: item.teamStat.aboveMax,
          equalTen: item.teamStat.equalToMax,
          belowTen: item.teamStat.belowMax,
          equalFive: item.teamStat.equalToMin,
          belowFive: item.teamStat.belowMin,
          belowEqualThree: item.teamStat.threeAndBelow,
          noMembers: item.teamStat.noMembers,
          orMembers: item.supporters.orMembers,
          population: item.barangayVotersCount,
        };
      });

      worksheet.addRows(sheetData);

      const footerRow = worksheet.addRow({
        barangay: 'Total', // Label for the footer row
        figureHead: sheetData.reduce((sum, row) => sum + (row.figureHead || 0), 0),
        bc: sheetData.reduce((sum, row) => sum + (row.bc || 0), 0),
        pc: sheetData.reduce((sum, row) => sum + (row.pc || 0), 0),
        tl: sheetData.reduce((sum, row) => sum + (row.tl || 0), 0),
        withTeam: sheetData.reduce((sum, row) => sum + (row.withTeam || 0), 0),
        // withoutTeam: sheetData.reduce(
        //   (sum, row) => sum + (row.withoutTeam || 0),
        //   0
        // ),
        aboveTen: sheetData.reduce((sum, row) => sum + (row.aboveTen || 0), 0),
        equalTen: sheetData.reduce((sum, row) => sum + (row.equalTen || 0), 0),
        belowTen: sheetData.reduce((sum, row) => sum + (row.belowTen || 0), 0),
        equalFive: sheetData.reduce((sum, row) => sum + (row.equalFive || 0), 0),
        belowFive: sheetData.reduce((sum, row) => sum + (row.belowFive || 0), 0),
        belowEqualThree: sheetData.reduce((sum, row) => sum + (row.belowEqualThree || 0), 0),
        noMembers: sheetData.reduce((sum, row) => sum + (row.noMembers || 0), 0),
        orMembers: sheetData.reduce((sum, row) => sum + (row.orMembers || 0), 0),
        population: sheetData.reduce((sum, row) => sum + (row.population || 0), 0),
      });

      // Style the footer row
      footerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true }; // Make text bold
        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center-align
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');

      // Write the workbook directly to the response stream
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.post(
    '/supporter-report-barangay',
    async (req: Request, res: Response) => {
      if (!req.body) {
        res.status(403).send({
          message: 'No data provided',
        });
      }
      const temp: BarangayProps = JSON.parse(req.body.barangay);

      try {
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const worksheetNames = new Set<string>();
        console.log('All PC: ', temp.leaders.length);
        console.log(
          'All PC handle: ',
          temp.leaders.reduce((acc, num) => acc + (num.teamList.length || 0), 0),
        );

        for (let item of temp.leaders) {
          const totalVoters = item.teamList.reduce((acc, team) => acc + (team.votersCount || 0), 0);
          console.log('Team: ', totalVoters);

          // Generate the initial worksheet name
          let worksheetName = `${item.voter?.idNumber}-${item.voter?.lastname}, ${item.voter?.firstname}`;

          // Ensure the name is unique
          let counter = 1;
          while (worksheetNames.has(worksheetName)) {
            worksheetName = `${item.voter?.idNumber}-${item.voter?.lastname}, ${item.voter?.firstname} (${counter})`;
            counter++;
          }

          // Add the unique name to the set
          worksheetNames.add(worksheetName);

          // Create the worksheet with the unique name
          const worksheet = workbook.addWorksheet(worksheetName, {
            pageSetup: {
              paperSize: 9,
              orientation: 'portrait',
              fitToPage: true,
              showGridLines: true,
            },
            headerFooter: {
              firstHeader: `&L&B${item.voter?.lastname}, ${item.voter?.firstname} (Purok)`,
              firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
              oddHeader: `&L&B  ${temp.name} PC: ${item.voter?.lastname}, ${item.voter?.firstname} (${item.voter?.idNumber})
             Handled TL list`,
              oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            },
          });

          worksheet.columns = [
            { header: 'ID', key: 'id', width: 6 },
            { header: 'Fullname', key: 'fullname', width: 40 },
            { header: 'Members', key: 'members', width: 10 },
            { header: 'Merge 1', key: 'merge1', width: 10 },
            { header: 'Merge 2', key: 'merge2', width: 10 },
            { header: 'Merge 3', key: 'merge3', width: 10 },
          ];

          worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });

          const sheetData = item.teamList.map((team) => {
            return {
              id: team.teamLeader?.voter?.idNumber,
              fullname: `${team.teamLeader?.voter?.lastname}, ${team.teamLeader?.voter?.firstname}`,
              members: team.votersCount,
              merge1: '',
              merge2: '',
              merge3: '',
            };
          });

          const addedRows = worksheet.addRows(sheetData);

          const footers = worksheet.addRow({
            id: 'Total',
            fullname: item.teamList.length,
            members: sheetData.reduce((sum, row) => sum + (row.members || 0), 0),
            merge1: '',
            merge2: '',
            merge3: '',
          });

          footers.eachCell((cell, colNumber) => {
            cell.font = { bold: true }; // Make text bold
            cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center-align
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });

          addedRows.forEach((row) => {
            const cellValue = row.getCell('members').value;

            if (typeof cellValue === 'number' && cellValue < 5) {
              row.eachCell((cell) => {
                cell.font = {
                  color: { argb: 'FFFFA500' },
                };
              });
            }
          });
        }

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
        await workbook.xlsx.write(res);
      } catch (error) {
        console.log(error);

        res.status(500).send({ message: 'Internal Server Error' });
      }

      // try {
      //   const area = await prisma.barangays.findMany({
      //     where: {
      //       municipalId: parseInt(zipCode, 10),
      //     },
      //     include: {
      //       TeamLeader: {
      //         select: {
      //           _count: {},
      //         },
      //       },
      //     },
      //   });
      //   const team = await prisma.team.findMany({
      //     where: {
      //       barangaysId: { in: area.map((item) => item.id) }, // Filter by barangay ID
      //     },
      //     include: {
      //       _count: {
      //         select: {
      //           voters: true,
      //         },
      //       },
      //     },
      //   });
      // } catch (error) {}
    },
    router.post('/custom-list', async (req: Request, res: Response) => {
      const barangayId = req.body.barangayId;

      if (!barangayId) {
        res.status(400).json({ message: 'Bad Request' });
        return;
      }

      try {
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        let skip = 0;
        let haveMore = true;
        const readyToInsert: { purok: string; list: any[] }[] = [];

        // Fetch barangay details
        const barangay = await prisma.barangays.findUnique({
          where: { id: barangayId },
        });

        if (!barangay) {
          res.status(404).json({ message: 'Barangay not found' });
          return;
        }

        const worksheet = workbook.addWorksheet(barangay.name, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${barangay.name} Voter's List`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'No.', key: 'no', width: 4 },
          { header: 'ID', key: 'id', width: 6 },
          { header: 'Fullname', key: 'fullname', width: 40 },
          { header: 'Purok', key: 'purok', width: 12 },
          { header: 'OR', key: 'or' },
          { header: 'DEAD', key: 'dead' },
          { header: 'INC', key: 'inc' },
          { header: 'JML', key: 'jml' },
          { header: 'RT', key: 'rt' },
          { header: 'FH', key: 'fh' },
        ];

        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        while (haveMore) {
          const voters = await prisma.voters.findMany({
            where: {
              OR: [{ oor: 'NO' }, { inc: 'NO' }, { status: 1 }],
              barangaysId: barangay.id,
              candidatesId: null,
              teamId: null,
              DelistedVoter: {
                none: {},
              },
              WhiteList: {
                none: {},
              },
            },
            include: {
              purok: {
                select: {
                  purokNumber: true,
                },
              },
            },
            skip,
            take: 50,
            orderBy: { lastname: 'asc' },
          });

          if (voters.length === 0) {
            haveMore = false;
            break;
          }

          voters.forEach((voter) => {
            const matchIndex = readyToInsert.findIndex(
              (item) => item.purok === voter.purok?.purokNumber,
            );
            if (matchIndex !== -1) {
              readyToInsert[matchIndex].list.push({
                id: voter.idNumber as string,
                fullname: `${voter.lastname}, ${voter.firstname}`,
                purok: voter.purok?.purokNumber,
              });
            } else {
              readyToInsert.push({
                purok: voter.purok?.purokNumber as string,
                list: [
                  {
                    id: voter.idNumber as string,
                    fullname: `${voter.lastname}, ${voter.firstname}`,
                    purok: voter.purok?.purokNumber,
                  },
                ],
              });
            }
          });

          skip += 50;
        }
        const flattenedList = readyToInsert
          .flatMap((entry) => entry.list)
          .map((item, i) => {
            return {
              no: i + 1,
              id: item.id,
              fullname: item.fullname,
              purok: item.purok,
              or: '',
              dead: '',
              inc: '',
              jml: '',
              rt: '',
              fh: '',
            };
          });
        worksheet.addRows(flattenedList);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');

        await workbook.xlsx.write(res);
        res.end(); // Ensure the response is closed
      } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/validation-untracked', async (req: Request, res: Response) => {
      const barangayId = req.body.barangayId;

      if (!barangayId) {
        res.status(400).json({ message: 'Bad Request' });
        return;
      }

      try {
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        let skip = 0;
        let haveMore = true;
        const readyToInsert: { purok: string; list: any[] }[] = [];

        // Fetch barangay details
        const barangay = await prisma.barangays.findUnique({
          where: { id: barangayId },
        });

        if (!barangay) {
          res.status(404).json({ message: 'Barangay not found' });
          return;
        }

        const worksheet = workbook.addWorksheet(barangay.name, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5, // Top margin in inches
              bottom: 0.5, // Bottom margin in inches
              header: 0.3, // Header margin in inches
              footer: 0.3, // Footer margin in inches
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${barangay.name} Voter's List`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'No.', key: 'no', width: 4 },
          { header: 'ID', key: 'id', width: 6 },
          { header: 'Team Leader', key: 'tl', width: 40 },
          { header: 'Purok', key: 'purok', width: 12 },
        ];

        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        while (haveMore) {
          const teams = await prisma.team.findMany({
            include: {
              TeamLeader: {
                include: {
                  voter: true,
                },
              },
              voters: {
                where: {
                  UntrackedVoter: {
                    some: {},
                  },
                },
              },
            },
            take: 10,
            skip: skip ?? 0,
          });
          const voters = await prisma.voters.findMany({
            where: {
              OR: [{ oor: 'NO' }, { inc: 'NO' }, { status: 1 }],
              barangaysId: barangay.id,
              candidatesId: null,
              teamId: null,
              DelistedVoter: {
                none: {},
              },
              WhiteList: {
                none: {},
              },
            },
            include: {
              purok: {
                select: {
                  purokNumber: true,
                },
              },
            },
            skip,
            take: 50,
            orderBy: { lastname: 'asc' },
          });

          if (voters.length === 0) {
            haveMore = false;
            break;
          }

          voters.forEach((voter) => {
            const matchIndex = readyToInsert.findIndex(
              (item) => item.purok === voter.purok?.purokNumber,
            );
            if (matchIndex !== -1) {
              readyToInsert[matchIndex].list.push({
                id: voter.idNumber as string,
                fullname: `${voter.lastname}, ${voter.firstname}`,
                purok: voter.purok?.purokNumber,
              });
            } else {
              readyToInsert.push({
                purok: voter.purok?.purokNumber as string,
                list: [
                  {
                    id: voter.idNumber as string,
                    fullname: `${voter.lastname}, ${voter.firstname}`,
                    purok: voter.purok?.purokNumber,
                  },
                ],
              });
            }
          });

          skip += 50;
        }
        const flattenedList = readyToInsert
          .flatMap((entry) => entry.list)
          .map((item, i) => {
            return {
              no: i + 1,
              id: item.id,
              fullname: item.fullname,
              purok: item.purok,
            };
          });
        worksheet.addRows(flattenedList);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');

        await workbook.xlsx.write(res);
        res.end(); // Ensure the response is closed
      } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Internal Server Error');
      }
    }),

    router.post('/duplicated', async (req: Request, res: Response) => {
      const zipCode = req.body.zipCode;
      console.log({ zipCode });

      if (!zipCode) {
        res.status(400).json({ message: 'Bad Request' });
        return;
      }

      try {
        const municipal = await prisma.municipals.findUnique({
          where: {
            id: parseInt(zipCode, 10),
          },
        });

        if (!municipal) {
          res.status(404).json({ message: 'Municipal not found' });
          return;
        }

        let skip = 0;
        let hasMore = true;
        let grouped: any[] = [];

        while (hasMore) {
          const duplicated = await prisma.duplicateteamMembers.findMany({
            where: {
              municipalsId: municipal.id,
            },
            skip: skip,
            take: 50,
            include: {
              teamFounIn: {
                include: {
                  TeamLeader: {
                    include: {
                      voter: {
                        select: {
                          id: true,
                          lastname: true,
                          firstname: true,
                          idNumber: true,
                        },
                      },
                      purokCoors: {
                        select: {
                          voter: {
                            select: {
                              id: true,
                              lastname: true,
                              firstname: true,
                              idNumber: true,
                            },
                          },
                        },
                      },
                      barangayCoor: {
                        select: {
                          voter: {
                            select: {
                              id: true,
                              lastname: true,
                              firstname: true,
                              idNumber: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              team: {
                include: {
                  TeamLeader: {
                    include: {
                      voter: {
                        select: {
                          id: true,
                          lastname: true,
                          firstname: true,
                          idNumber: true,
                        },
                      },
                      purokCoors: {
                        select: {
                          voter: {
                            select: {
                              id: true,
                              lastname: true,
                              firstname: true,
                              idNumber: true,
                            },
                          },
                        },
                      },
                      barangayCoor: {
                        select: {
                          voter: {
                            select: {
                              id: true,
                              lastname: true,
                              firstname: true,
                              idNumber: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              barangay: {
                select: {
                  id: true,
                  name: true,
                },
              },
              voter: {
                select: {
                  id: true,
                  idNumber: true,
                },
              },
            },
            orderBy: {
              barangay: {
                name: 'asc',
              },
            },
          });

          if (duplicated.length === 0) {
            hasMore = false;
            break;
          } else {
            const data = duplicated.map((item) => ({
              barangay: item.barangay.name,
              '1bc': item.team?.TeamLeader?.barangayCoor?.voter?.idNumber,
              '1pc': item.team?.TeamLeader?.purokCoors?.voter?.idNumber,
              '1tl': item.team?.TeamLeader?.voter?.idNumber,
              '2bc': item.teamFounIn?.TeamLeader?.barangayCoor?.voter?.idNumber,
              '2pc': item.teamFounIn?.TeamLeader?.purokCoors?.voter?.idNumber,
              '2tl': item.teamFounIn?.TeamLeader?.voter?.idNumber,
              voter: item.voter?.idNumber,
            }));

            grouped.push(...data); // Flattening the array
            skip += duplicated.length; // Correct pagination
          }
        }

        // Generate Excel file regardless of whether grouped.length is 0
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(municipal.name, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${municipal.name} Double Entry List`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Barangay', key: 'barangay', width: 12 },
          { header: '1st BC', key: '1bc', width: 10 },
          { header: '1st PC', key: '1pc', width: 10 },
          { header: '1st TL', key: '1tl', width: 10 },
          { header: '2nd BC', key: '2bc', width: 10 },
          { header: '2nd PC', key: '2pc', width: 10 },
          { header: '2nd TL', key: '2tl', width: 10 },
          { header: 'Voter ID', key: 'voter', width: 10 },
        ];

        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        worksheet.addRows(grouped);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/print-members-status', async (req: Request, res: Response) => {
      try {
        const { zipCode } = req.body;
        if (!zipCode) {
          return res.status(400).send('Bad request!');
        }

        const barangays = await prisma.barangays.findMany({
          where: {
            municipalId: parseInt(zipCode, 10),
          },
          include: {
            TeamLeaderBridge: {
              where: {
                level: 1,
              },
              include: {
                _count: {
                  select: {
                    voters: true,
                  },
                },
                voters: {
                  select: {
                    id: true,
                    QRcode: true,
                  },
                },
                membersAttendance: {
                  select: {
                    actual: true,
                  },
                },
              },
            },
            Machine: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
        if (barangays.length === 0) {
          return res.status(400).send('Bad request, no Barangay found!');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(zipCode, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${zipCode} Election Day Report`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Barangay', key: 'barangay', width: 20 },
          { header: 'Machine/s', key: 'machine', width: 10 },
          { header: 'Team (TL only)', key: 'tl', width: 14 },
          { header: 'Members', key: 'members', width: 10 },
          { header: 'Total', key: 'total', width: 10 },
          { header: 'Stab 1', key: 'stabOne', width: 12 },
          { header: 'Stab 2', key: 'stabTwo', width: 12 },
          { header: "Member's Attendance", key: 'attendance', width: 18 },
          { header: 'Total ER', key: 'totalSov', width: 16 },
          { header: 'Variance', key: 'variance', width: 14 },
        ];
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Initialize totals
        let totalMachines = 0;
        let totalTLs = 0;
        let totalMembers = 0;
        let totalTeamAttendance = 0;
        let totalTeamAndMembers = 0;
        let totalStabOne = 0;
        let totalStabTwo = 0;
        let totalSovs = 0;

        const data = barangays.map((item) => {
          // Calculate per barangay
          const barangayMembers = item.TeamLeaderBridge.reduce((acc, base) => {
            return acc + (base._count?.voters || 0);
          }, 0);
          const barangaySovs =
            item.Machine.reduce((acc, base) => {
              return acc + (base.result || 0);
            }, 0) || 0;

          // Calculate Stab 1 and Stab 2 counts
          let barangayStabOne = 0;
          let barangayStabTwo = 0;
          let barangayTeamAttendance = item.TeamLeaderBridge.reduce((acc, base) => {
            return acc + (base.membersAttendance?.actual || 0);
          }, 0);

          item.TeamLeaderBridge.forEach((tl) => {
            tl.voters.forEach((voter) => {
              if (voter.QRcode) {
                barangayStabOne += voter.QRcode.filter(
                  (stab) => stab.stamp === 1 && stab.scannedDateTime !== 'N/A',
                ).length;
                barangayStabTwo += voter.QRcode.filter(
                  (stab) => stab.stamp === 2 && stab.scannedDateTime !== 'N/A',
                ).length;
              }
            });
          });

          const barangayTeamAndMembers = (item.TeamLeaderBridge.length || 0) + barangayMembers;

          // Update totals
          totalMachines += item.Machine.length ?? 0;
          totalTLs += item.TeamLeaderBridge.length ?? 0;
          totalMembers += barangayMembers;
          totalTeamAndMembers += barangayTeamAndMembers;
          totalStabOne += barangayStabOne;
          totalStabTwo += barangayStabTwo;
          totalTeamAttendance += barangayTeamAttendance;
          totalSovs += barangaySovs;

          const result = barangaySovs - barangayTeamAndMembers;
          return {
            barangay: item.name,
            machine: item.Machine.length ?? 0,
            tl: item.TeamLeaderBridge.length ?? 0,
            members: barangayMembers,
            total: barangayTeamAndMembers,
            stabOne: barangayStabOne,
            stabTwo: barangayStabTwo,
            attendance: barangayTeamAttendance,
            totalSov: barangaySovs,
            variance: `${handleCalVariance(
              barangayTeamAndMembers,
              barangaySovs,
            )} ${calculatePercentage(result, barangaySovs)}%`,
          };
        });

        // Add data rows
        data.forEach((row) => worksheet.addRow(row));

        // Add totals row
        const overallTotal = totalSovs - totalTeamAndMembers;
        const totalsRow = worksheet.addRow({
          barangay: 'TOTAL',
          machine: totalMachines,
          tl: totalTLs,
          members: totalMembers,
          total: totalTeamAndMembers,
          stabOne: totalStabOne,
          stabTwo: totalStabTwo,
          totalSov: totalSovs,
          attendance: totalTeamAttendance,
          variance: calculatePercentage(overallTotal, totalSovs),
        });

        // Style the totals row
        totalsRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Update footer to include totals
        worksheet.headerFooter.oddFooter =
          `&LTotal Machines: ${totalMachines} | Teams: ${totalTLs} | Members: ${totalMembers} | Total: ${totalTeamAndMembers}` +
          `&C${zipCode} Election Day Report` +
          `&RGenerated on: ${new Date().toLocaleDateString()}`;

        // Set response headers and send the workbook
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename=${zipCode}_report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
      }
    }),
    router.post('/print-barangay-members-status', async (req: Request, res: Response) => {
      try {
        const { zipCode } = req.body;
        if (!zipCode) {
          return res.status(400).send('Bad request!');
        }

        const barangays = await prisma.barangays.findMany({
          where: {
            municipalId: parseInt(zipCode, 10),
          },
          include: {
            TeamLeaderBridge: {
              where: {
                level: 1,
              },
              include: {
                _count: {
                  select: {
                    voters: true,
                  },
                },
                voters: {
                  select: {
                    id: true,
                    QRcode: true,
                  },
                },
                membersAttendance: {
                  select: {
                    actual: true,
                  },
                },
              },
            },
            Machine: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
        if (barangays.length === 0) {
          return res.status(400).send('Bad request, no Barangay found!');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(zipCode, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${zipCode} Election Day Report`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Barangay', key: 'barangay', width: 20 },
          { header: 'Machine/s', key: 'machine', width: 10 },
          { header: 'Team (TL only)', key: 'tl', width: 14 },
          { header: 'Members', key: 'members', width: 10 },
          { header: 'Total', key: 'total', width: 10 },
          { header: 'Stab 1', key: 'stabOne', width: 12 },
          { header: 'Stab 2', key: 'stabTwo', width: 12 },
          { header: "Member's Attendance", key: 'attendance', width: 18 },
          { header: 'Total ER', key: 'totalSov', width: 16 },
          { header: 'Variance', key: 'variance', width: 14 },
        ];
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Initialize totals
        let totalMachines = 0;
        let totalTLs = 0;
        let totalMembers = 0;
        let totalTeamAttendance = 0;
        let totalTeamAndMembers = 0;
        let totalStabOne = 0;
        let totalStabTwo = 0;
        let totalSovs = 0;

        const data = barangays.map((item) => {
          // Calculate per barangay
          const barangayMembers = item.TeamLeaderBridge.reduce((acc, base) => {
            return acc + (base._count?.voters || 0);
          }, 0);
          const barangaySovs =
            item.Machine.reduce((acc, base) => {
              return acc + (base.result || 0);
            }, 0) || 0;

          // Calculate Stab 1 and Stab 2 counts
          let barangayStabOne = 0;
          let barangayStabTwo = 0;
          let barangayTeamAttendance = item.TeamLeaderBridge.reduce((acc, base) => {
            return acc + (base.membersAttendance?.actual || 0);
          }, 0);

          item.TeamLeaderBridge.forEach((tl) => {
            tl.voters.forEach((voter) => {
              if (voter.QRcode) {
                barangayStabOne += voter.QRcode.filter(
                  (stab) => stab.stamp === 1 && stab.scannedDateTime !== 'N/A',
                ).length;
                barangayStabTwo += voter.QRcode.filter(
                  (stab) => stab.stamp === 2 && stab.scannedDateTime !== 'N/A',
                ).length;
              }
            });
          });

          const barangayTeamAndMembers = (item.TeamLeaderBridge.length || 0) + barangayMembers;

          // Update totals
          totalMachines += item.Machine.length ?? 0;
          totalTLs += item.TeamLeaderBridge.length ?? 0;
          totalMembers += barangayMembers;
          totalTeamAndMembers += barangayTeamAndMembers;
          totalStabOne += barangayStabOne;
          totalStabTwo += barangayStabTwo;
          totalTeamAttendance += barangayTeamAttendance;
          totalSovs += barangaySovs;

          const result = barangaySovs - barangayTeamAndMembers;
          return {
            barangay: item.name,
            machine: item.Machine.length ?? 0,
            tl: item.TeamLeaderBridge.length ?? 0,
            members: barangayMembers,
            total: barangayTeamAndMembers,
            stabOne: barangayStabOne,
            stabTwo: barangayStabTwo,
            attendance: barangayTeamAttendance,
            totalSov: barangaySovs,
            variance: `${handleCalVariance(
              barangayTeamAndMembers,
              barangaySovs,
            )} ${calculatePercentage(result, barangaySovs)}%`,
          };
        });

        // Add data rows
        data.forEach((row) => worksheet.addRow(row));

        // Add totals row
        const overallTotal = totalSovs - totalTeamAndMembers;
        const totalsRow = worksheet.addRow({
          barangay: 'TOTAL',
          machine: totalMachines,
          tl: totalTLs,
          members: totalMembers,
          total: totalTeamAndMembers,
          stabOne: totalStabOne,
          stabTwo: totalStabTwo,
          totalSov: totalSovs,
          attendance: totalTeamAttendance,
          variance: calculatePercentage(overallTotal, totalSovs),
        });

        // Style the totals row
        totalsRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Update footer to include totals
        worksheet.headerFooter.oddFooter =
          `&LTotal Machines: ${totalMachines} | Teams: ${totalTLs} | Members: ${totalMembers} | Total: ${totalTeamAndMembers}` +
          `&C${zipCode} Election Day Report` +
          `&RGenerated on: ${new Date().toLocaleDateString()}`;

        // Set response headers and send the workbook
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename=${zipCode}_report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error');
      }
    }),
    router.post('/barangay-validation-result', async (req: Request, res: Response) => {
      try {
        const barangayId = req.body.barangayId;
        const untracked = req.body.untracked;
        const orMembers = req.body.orMembers;
        const delisted = req.body.delisted;
        const filtered: any = {};
        console.log({ barangayId, untracked, orMembers, delisted });

        if (!barangayId) {
          return res.status(400).send('Bad request');
        }

        const barangay = await prisma.barangays.findUnique({
          where: {
            id: barangayId,
          },
        });

        if (!barangay) {
          return res.status(404).send('Barangay not found!');
        }

        if (delisted) {
          filtered.DelistedVoter = {
            select: {
              id: true,
            },
          };
        }
        if (untracked) {
          filtered.UntrackedVoter = {
            select: {
              id: true,
            },
          };
        }
        if (orMembers) {
          filtered.oor = 'YES';
        }

        const teams = await prisma.team.findMany({
          where: {
            barangaysId: barangay.id,
            level: 1,
          },
          include: {
            voters: {
              where: {
                level: 0,
              },
              select: {
                firstname: true,
                oor: true,
                lastname: true,
                idNumber: true,
                level: true,
                status: true,
                DelistedVoter: {
                  select: {
                    id: true,
                  },
                },
                UntrackedVoter: {
                  select: {
                    id: true,
                  },
                },
                ValdilatedMembers: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            TeamLeader: {
              select: {
                voter: {
                  select: {
                    firstname: true,
                    lastname: true,
                    idNumber: true,
                    level: true,
                  },
                },
                purokCoors: {
                  select: {
                    voter: {
                      select: {
                        firstname: true,
                        lastname: true,
                        idNumber: true,
                        level: true,
                      },
                    },
                  },
                },
                barangayCoor: {
                  select: {
                    voter: {
                      select: {
                        firstname: true,
                        lastname: true,
                        idNumber: true,
                        level: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            TeamLeader: {
              voter: {
                lastname: 'asc',
              },
            },
          },
        });

        if (teams.length === 0) {
          return res.status(404).send('No Teams found!');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(barangay.name, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${barangay.name} Voter's List`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Teams', key: 'tl', width: 50 },
          // { header: "Members", key: "members", width: 40 },
          { header: 'Tags', key: 'members', width: 15 },
        ];

        const dataRows: any[] = [];

        teams.forEach((team, i) => {
          console.log(JSON.stringify(team, null, 2));

          const bc = team.TeamLeader?.barangayCoor?.voter
            ? `     ${handleLevel(team.TeamLeader.barangayCoor?.voter.level)} = ${
                team.TeamLeader.barangayCoor?.voter.idNumber
              } - ${team.TeamLeader.barangayCoor?.voter.lastname}, ${
                team.TeamLeader.barangayCoor?.voter.firstname
              }`
            : 'No BC';

          const pc = team.TeamLeader?.purokCoors?.voter
            ? `     ${handleLevel(team.TeamLeader.purokCoors?.voter.level)} = ${
                team.TeamLeader.purokCoors?.voter.idNumber
              } - ${team.TeamLeader.purokCoors?.voter.lastname}, ${
                team.TeamLeader.purokCoors?.voter.firstname
              }`
            : 'No PC';

          const teamLeader = team.TeamLeader?.voter
            ? `${i + 1}. ${handleLevel(team.TeamLeader.voter.level)} = ${
                team.TeamLeader.voter.idNumber
              } - ${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname} (${
                team.voters.length
              })`
            : 'No Leader';

          // Define proper type for voter
          const members = team.voters.map(
            (voter: {
              lastname: string;
              firstname: string;
              idNumber: string | null;
              status: number;
              oor: string | null;
              DelistedVoter: any;
              UntrackedVoter: any;
              level: number;
            }) => `     ${voter?.idNumber} - ${voter?.lastname}, ${voter?.firstname}`,
          );

          const membersTags = team.voters.map(
            (voter: {
              status: number;
              oor: string | null;
              DelistedVoter: any;
              UntrackedVoter: any;
            }) => {
              const tags = [];
              if (voter?.status === 0) tags.push('D');
              if (voter?.oor === 'YES') tags.push('OR');
              if (voter?.DelistedVoter.length > 0) tags.push('DL');
              if (voter?.UntrackedVoter.length > 0) tags.push('UN');
              // Add other conditions as needed
              return `[${tags.join(',')}]`;
            },
          );

          dataRows.push([bc]);
          dataRows.push([pc]);
          dataRows.push([teamLeader]);
          dataRows.push(['Members']);
          team.timestamp &&
            dataRows.push([`Joined at: ${formatToLocalPHTime(team.timestamp as Date)}`]);
          // Add members with their tags
          team.voters.forEach((voter, index) => {
            dataRows.push([members[index], membersTags[index]]);
          });

          dataRows.push(['']); // Empty row between teams
        });

        worksheet.addRows(dataRows);

        // Set the response headers
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${barangay.name}_validation.xlsx`,
        );

        // Send the Excel file
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/validation-result', async (req: Request, res: Response) => {
      const zipCode = req.body.zipCode;
      console.log(zipCode);

      if (!zipCode) {
        res.status(400).json({ message: 'Bad Request' });
        return;
      }
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        const municpal = await prisma.municipals.findUnique({
          where: {
            id: parseInt(zipCode, 10),
          },
        });
        if (!municpal) {
          res.status(404).json({ message: 'Municipal not found' });
          return;
        }
        const barangays = await prisma.barangays.findMany({
          where: {
            municipalId: parseInt(zipCode, 10),
          },
          include: {
            TeamLeader: {
              select: {
                id: true,
              },
            },
            voters: {
              where: {
                level: 0,
                teamId: { not: null },
                candidatesId: { not: null },
              },
              select: {
                id: true,
                oor: true,
                status: true,
                inc: true,
                ValdilatedMembers: {
                  select: {
                    id: true,
                  },
                },
                VoterRecords: {
                  select: {
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        const worksheet = workbook.addWorksheet(municpal.name, {
          pageSetup: {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: ``,
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${municpal.name} Validation Results`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Barangay', key: 'barangay', width: 14 },
          { header: 'TL', key: 'tl', width: 6 },
          { header: 'Members', key: 'Members', width: 6 },
          { header: 'Validated Members', key: 'vm', width: 14 },
          { header: 'DEAD', key: 'dead', width: 8 },
          { header: 'OR', key: 'or', width: 6 },
          { header: 'UD', key: 'ud', width: 6 },
          { header: 'ND', key: 'nd', width: 6 },
          { header: 'OP', key: 'op', width: 6 },
          { header: 'INC', key: 'inc', width: 6 },
        ];
        const data: any[] = [];
        for (let item of barangays) {
          data.push({
            barangay: item.name,
            tl: item.TeamLeader.length,
            Members: item.voters.length,
            vm: item.voters.filter((voter) => voter.ValdilatedMembers.length > 0).length,
            dead: item.voters.filter((voter) => voter.status === 0).length,
            or: item.voters.filter((voter) => voter.oor === 'YES').length,
            inc: item.voters.filter((voter) => voter.inc === 'YES').length,
          });
        }

        worksheet.addRows(data);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename=SupporterReport.xlsx');

        await workbook.xlsx.write(res);
        res.end(); // Ensure the response is closed
      } catch (error) {
        res.status(500).send('Internal Server Error');
      }
    }),
    router.get('/team-breakdown', async (req: Request, res: Response) => {
      try {
        const zipCode = req.query.zipCode as string;
        const barangay = req.query.barangay as string;

        console.log({ zipCode, barangay });

        if (!zipCode || !barangay) {
          return res.status(400).json({ message: 'Bad Request' });
        }

        // Fetch municipal and barangay info
        const [municipal, barangayData] = await prisma.$transaction([
          prisma.municipals.findUnique({
            where: { id: parseInt(zipCode, 10) },
            include: {
              barangays: { select: { id: true, name: true } },
            },
          }),
          prisma.barangays.findUnique({ where: { id: barangay } }),
        ]);

        if (!municipal || !barangayData) {
          return res.status(404).json({ message: 'Area not found' });
        }

        let teamToInsert: any[] = [];
        let skip = 0;
        let haveMore = true;

        while (haveMore) {
          const teams = await prisma.team.findMany({
            where: {
              municipalsId: municipal.id,
              barangaysId: barangay,
              level: 1,
            },
            skip,
            take: 50,
            orderBy: { id: 'asc' },
            include: {
              voters: {
                select: { id: true, idNumber: true, firstname: true, lastname: true },
              },
              TeamLeader: {
                select: {
                  voter: {
                    select: { id: true, idNumber: true, firstname: true, lastname: true },
                  },
                },
              },
              _count: {
                select: {
                  voters: true,
                },
              },
            },
          });

          if (teams.length === 0) {
            haveMore = false;
          } else {
            teamToInsert.push(...teams.filter((item) => item._count.voters < 4));
            skip += teams.length;
          }
        }

        if (teamToInsert.length === 0) {
          return res.status(404).json({ message: 'No teams found' });
        }

        // Create Excel file
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(barangayData.name, {
          pageSetup: {
            paperSize: 9,
            orientation: 'portrait',
            fitToPage: false,
            showGridLines: true,
            margins: {
              left: 0.6,
              right: 0.6,
              top: 0.5,
              bottom: 0.5,
              header: 0.3,
              footer: 0.3,
            },
          },
          headerFooter: {
            firstHeader: '',
            firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            oddHeader: `&L&B${municipal.name}-${barangayData.name} Team Members`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'TL', key: 'tl', width: 40 },
          { header: 'Members', key: 'members', width: 40 },
        ];
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Prepare data for insertion
        const dataRows: any[] = [];

        teamToInsert.forEach((team) => {
          const teamLeader = team.TeamLeader?.voter
            ? `${team.TeamLeader.voter.idNumber} - ${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname} (${team.voters.length})`
            : 'No Leader';

          const members = team.voters.map(
            (voter: { lastname: any; firstname: any; idNumber: any }) =>
              `${voter.idNumber} - ${voter.lastname}, ${voter.firstname}`,
          );

          // First row with Team Leader
          dataRows.push([teamLeader, members[0] || '']);

          // Remaining members in separate rows
          for (let i = 1; i < members.length; i++) {
            dataRows.push(['', members[i]]);
          }
          dataRows.push(['', '']);
        });

        worksheet.addRows(dataRows);

        // Send file as response
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename="team_breakdown.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }),
    router.post('/generate-team', async (req: Request, res: Response) => {
      try {
        const {
          delisted,
          ud,
          nd,
          op,
          or,
          inc,
          dead,
          selected,
          min,
          max,
          barangay,
          zipCode,
          selectedId,
          membersCount,
          level,
          membersCountOnly,
        } = req.body;
        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const filter: any = {};

        if (delisted) {
          filter.DelistedVoter = {
            some: {},
          };
        }
        if (dead) {
          filter.status = 0;
        }

        if (ud) {
          filter.VoterRecords = {
            some: {
              type: 1,
            },
          };
        }

        if (nd) {
          filter.VoterRecords = {
            some: {
              type: 2,
            },
          };
        }

        if (op) {
          filter.VoterRecords = {
            some: {
              type: 3,
            },
          };
        }

        if (or) {
          filter.oor = 'YES';
        }
        const [municipal, barangayData] = await prisma.$transaction([
          prisma.municipals.findUnique({
            where: {
              id: parseInt(zipCode, 10),
            },
          }),
          prisma.barangays.findUnique({
            where: {
              id: barangay,
            },
          }),
        ]);

        if (!municipal || !barangayData) {
          return res.status(400).json({ message: 'Bad request' });
        }

        console.log({
          delisted,
          ud,
          nd,
          op,
          or,
          inc,
          dead,
          selected,
          min,
          max,
          barangay,
          zipCode,
          selectedId,
          membersCount,
          level,
          membersCountOnly,
        });
        console.log({ filter });

        let teamToInsert: any[] = [];
        let skip = 0;
        let haveMore = true;
        const count = teamMembersCount(membersCount);
        console.log('Count: ', {
          count,
        });
        let levels: any = {};
        let teamData: any = {};
        let headerFilter: any = {};
        let headerLevel: any;
        if (level !== 'all') {
          headerLevel = handleLevelLabel(level, 0);
          levels.level = headerLevel;
        }
        // if (headerLevel - 1 !== 0) {
        //   teamData.TeamLeader = {
        //     select: {
        //       team: {
        //         select: {
        //           _count: {
        //             select: {
        //               voters: {
        //                 where: {
        //                   level: headerLevel - 1,
        //                   teamId: { not: null },
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       },
        //     },
        //   };
        // }
        if (headerLevel === 1) {
          headerFilter.purokCoors = {
            select: {
              voter: {
                select: {
                  idNumber: true,
                  firstname: true,
                  lastname: true,
                  id: true,
                  level: true,
                },
              },
            },
          };
          headerFilter.barangayCoor = {
            select: {
              voter: {
                select: {
                  idNumber: true,
                  firstname: true,
                  lastname: true,
                  id: true,
                  level: true,
                },
              },
            },
          };
        } else if (headerLevel === 2) {
          headerFilter.barangayCoor = {
            select: {
              voter: {
                select: {
                  idNumber: true,
                  firstname: true,
                  lastname: true,
                  id: true,
                  level: true,
                },
              },
            },
          };
        } else {
          headerFilter = {};
        }

        while (haveMore) {
          const teams = await prisma.team.findMany({
            where: {
              barangaysId: barangayData.id,
              municipalsId: municipal.id,
              voters: {
                some: filter,
              },
              teamLeaderId: { not: null },
              TeamLeader: {
                votersId: { not: null },
              },
              ...levels,
            },
            include: {
              _count: {
                select: {
                  voters: true,
                },
              },
              voters: {
                select: {
                  idNumber: true,
                  firstname: true,
                  lastname: true,
                  status: true,
                  oor: true,
                  DelistedVoter: true,
                  VoterRecords: true,
                  level: true,
                  inc: true,
                },
                where: {
                  teamId: { not: null },
                  level: headerLevel - 1,
                },
              },
              TeamLeader: {
                select: {
                  voter: {
                    select: {
                      idNumber: true,
                      firstname: true,
                      lastname: true,
                      level: true,
                    },
                  },
                  ...headerFilter,
                },
              },
            },
            take: 50,
            skip,
            orderBy: {
              TeamLeader: {
                voter: {
                  lastname: 'asc',
                },
              },
            },
          });
          const fitleredTeams = teams.filter((item) => {
            if (typeof count === 'string' && count === 'all') {
              return item;
            }
            if (typeof count === 'number' && count === 3) {
              return item._count.voters <= 3 && item._count.voters >= 1;
            }
            if (typeof count === 'number' && count === 6) {
              return item._count.voters >= 6 && item._count.voters <= 9;
            }
            if (typeof count === 'number' && count === 11) {
              return item._count.voters >= 11;
            }
            return item._count.voters === (count as number);
          });
          if (teams.length === 0) {
            haveMore = false;
            break;
          } else {
            teamToInsert.push(...fitleredTeams);
            skip += teams.length;
          }
        }

        if (teamToInsert.length > 0) {
          const worksheet = workbook.addWorksheet(`${barangayData.name}-(${teamToInsert.length})`, {
            pageSetup: {
              paperSize: undefined,
              orientation: 'portrait',
              fitToPage: false,
              showGridLines: true,
              margins: {
                left: 0.6,
                right: 0.6,
                top: 0.5,
                bottom: 0.5,
                header: 0.3,
                footer: 0.3,
              },
            },
            headerFooter: {
              firstHeader: '',
              firstFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
              oddHeader: `&L&B${municipal.name}-${barangayData.name} ${handleLevel(
                headerLevel,
              )} Team Members -(${teamToInsert.length})`,
              oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            },
          });

          let headerMeteData: any = {};

          worksheet.columns = [
            { header: 'Teams', key: 'tl', width: 50 },
            // { header: "Members", key: "members", width: 40 },
            { header: 'Tags', key: 'members', width: 15 },
          ];
          worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });

          const dataRows: any[] = [];

          teamToInsert.forEach((team, i) => {
            const bc = team.TeamLeader?.barangayCoor?.voter
              ? `     ${handleLevel(team.TeamLeader.barangayCoor?.voter.level)} = ${
                  team.TeamLeader.barangayCoor?.voter.idNumber
                } - ${team.TeamLeader.barangayCoor?.voter.lastname}, ${
                  team.TeamLeader.barangayCoor?.voter.firstname
                }`
              : 'No BC';
            const pc = team.TeamLeader?.purokCoors?.voter
              ? `     ${handleLevel(team.TeamLeader.purokCoors?.voter.level)} = ${
                  team.TeamLeader.purokCoors?.voter.idNumber
                } - ${team.TeamLeader.purokCoors?.voter.lastname}, ${
                  team.TeamLeader.purokCoors?.voter.firstname
                }`
              : 'No PC';
            const teamLeader = team.TeamLeader?.voter
              ? `${i + 1}. ${handleLevel(team.TeamLeader.voter.level)} = ${
                  team.TeamLeader.voter.idNumber
                } - ${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname} (${
                  team.voters.length
                })`
              : 'No Leader';

            const members = team.voters.map(
              (voter: {
                lastname: any;
                firstname: any;
                idNumber: any;
                status: number;
                oor: any;
                DelistedVoter: any;
                level: number;
                TeamLeader: {
                  team: {
                    _count: {
                      voters: number;
                    };
                  };
                };
                VoterRecords: {
                  type: any;
                };
              }) => `     ${voter?.idNumber} - ${voter?.lastname}, ${voter?.firstname}`,
            );
            const membersTags = team?.voters.map(
              (voter: {
                lastname: any;
                firstname: any;
                idNumber: any;
                status: number;
                oor: any;
                inc: string;
                DelistedVoter: any;
                VoterRecords: {
                  type: any;
                };
              }) =>
                `[${voter?.status === 0 ? 'D,' : ''} ${voter?.oor === 'YES' ? 'OR,' : ''} ${
                  voter?.inc === 'YES' ? 'INC,' : ''
                } ${memberTags(voter?.VoterRecords.type)}]`,
            );

            // First row with Team Leader ${voter.DelistedVoter ? "DL," : ""}
            if (headerLevel === 1) {
              dataRows.push([bc]);
              dataRows.push([pc]);
            } else if (headerLevel === 2) {
              dataRows.push([bc]);
            }
            dataRows.push([teamLeader]);
            dataRows.push([`Members - ${handleLevel(headerLevel - 1)}`]);
            dataRows.push([members[0], membersTags[0]]);
            // Remaining members in separate rows
            for (let i = 1; i < members.length; i++) {
              dataRows.push([members[i], membersTags[i]]);
            }
            dataRows.push(['']);
          });

          worksheet.addRows(dataRows);
        }

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename="team_breakdown.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.log(error);

        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/barangay-machine-report', async (req: Request, res: Response) => {
      try {
        const { barangayId } = req.body;
        console.log({ barangayId });

        if (!barangayId) {
          return res.status(400).send('Barangay ID is required');
        }

        const [machines, barangay] = await prisma.$transaction([
          prisma.machine.findMany({
            where: { barangaysId: barangayId },
            include: {
              prints: {
                include: {
                  Voters: {
                    select: {
                      QRcode: {
                        where: {
                          scannedDateTime: { not: 'N/A' },
                        },
                      },
                      id: true,
                      teamId: true,
                      candidatesId: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              number: 'asc',
            },
          }),
          prisma.barangays.findUnique({
            where: {
              id: barangayId,
            },
          }),
        ]);

        if (!machines.length || !barangay) {
          return res.status(404).send('No data found for the specified barangay');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(`${barangay.name}`, {
          pageSetup: {
            orientation: 'portrait',
          },
          headerFooter: {
            oddHeader: `&L&B${barangay.name} Machine Report`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Machine No', key: 'no', width: 12 },
          { header: 'Precinct', key: 'precinct', width: 20 },
          { header: 'Reg. Voters', key: 'reg', width: 14 },
          { header: 'In Team', key: 'inTeam', width: 12 },
          { header: 'Stab One', key: 'stabOne', width: 14 },
          { header: 'Stab Two', key: 'stabTwo', width: 14 },
        ];

        // Style header row
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        let grandTotalStabOne = 0;
        let grandTotalStabTwo = 0;
        let grandTotalRegVoters = 0;
        let grandTotalInTeam = 0;
        let grandTotalPrecinct = 0;

        machines.forEach((machine, i) => {
          let machineStabOne = 0;
          let machineStabTwo = 0;
          let machineRegVoters = 0;
          let machineInTeam = 0;
          let machinePrecinctCount = machine.prints.length;

          machine.prints.forEach((print) => {
            const precinctStabOne = print.Voters.reduce((acc, voter) => {
              return acc + voter.QRcode.filter((qr) => qr.stamp === 1).length;
            }, 0);

            const precinctStabTwo = print.Voters.reduce((acc, voter) => {
              return acc + voter.QRcode.filter((qr) => qr.stamp === 2).length;
            }, 0);

            const precinctVoters = print.Voters.length;
            const precinctInTeam = print.Voters.filter(
              (voter) => voter.teamId && voter.candidatesId,
            ).length;

            machineStabOne += precinctStabOne;
            machineStabTwo += precinctStabTwo;
            machineRegVoters += precinctVoters;
            machineInTeam += precinctInTeam;

            worksheet.addRow({
              no: machine.number,
              precinct: print.precintNumber,
              reg: precinctVoters,
              inTeam: precinctInTeam,
              stabOne: precinctStabOne,
              stabTwo: precinctStabTwo,
            });
          });

          // Add machine totals
          worksheet.addRow({ no: `ER: ${machine.result}` });
          worksheet.addRow({
            no: 'Total',
            precinct: machinePrecinctCount,
            reg: machineRegVoters,
            inTeam: machineInTeam,
            stabOne: machineStabOne,
            stabTwo: machineStabTwo,
          });

          // Add empty row for separation
          worksheet.addRow([]);
          worksheet.addRow([]);
          // Accumulate grand totals
          grandTotalStabOne += machineStabOne;
          grandTotalStabTwo += machineStabTwo;
          grandTotalRegVoters += machineRegVoters;
          grandTotalInTeam += machineInTeam;
          grandTotalPrecinct += machinePrecinctCount;
        });
        worksheet.addRow([]);
        // Add grand totals
        worksheet.addRow({
          no: 'Overall Total',
          precinct: grandTotalPrecinct,
          reg: grandTotalRegVoters,
          inTeam: grandTotalInTeam,
          stabOne: grandTotalStabOne,
          stabTwo: grandTotalStabTwo,
        });

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${barangay.name.replace(/\s+/g, '_')}-Machine_report.xlsx`,
        );

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error('Error generating barangay machine report:', error);
        res.status(500).send('Internal server error');
      }
    }),
    router.post('/print-bararangay-stab-collection', async (req: Request, res: Response) => {
      try {
        const { id } = req.body; // Destructure the ID from body for clarity
        if (!id) {
          return res.status(400).send('Barangay ID is required');
        }

        const [teams, barangay] = await prisma.$transaction([
          prisma.team.findMany({
            where: {
              barangaysId: id,
              level: 1,
            },
            include: {
              membersAttendance: {
                select: {
                  id: true,
                  actual: true,
                },
              },
              barangay: {
                select: {
                  id: true,
                },
              },
              TeamLeader: {
                include: {
                  voter: {
                    select: {
                      idNumber: true,
                      firstname: true,
                      lastname: true,
                      level: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  voters: {
                    where: {
                      QRcode: {
                        some: {
                          scannedDateTime: 'N/A',
                        },
                      },
                    },
                  },
                },
              },
              voters: {
                include: {
                  QRcode: {
                    select: {
                      scannedDateTime: true,
                      stamp: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              TeamLeader: {
                voter: {
                  lastname: 'asc',
                },
              },
            },
          }),
          prisma.barangays.findUnique({
            where: {
              id,
            },
          }),
        ]);

        if (!teams.length || !barangay) {
          return res.status(404).send('No data found for the specified barangay');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(`${barangay.name}`, {
          pageSetup: {
            orientation: 'portrait',
          },
          headerFooter: {
            oddHeader: `&L&B${barangay.name} Stab Collection Report`,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });

        worksheet.columns = [
          { header: 'Team Leader', key: 'tl', width: 30 },
          { header: 'Members', key: 'members', width: 30 },
          { header: 'Stab 1', key: 'one', width: 10 },
          { header: 'Stab 2', key: 'two', width: 10 },
          { header: 'Actual Present', key: 'present', width: 10 },
        ];

        // Style header row
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        const reportData = teams.map((team) => {
          const totalStabOne = team.voters.reduce((acc, voter) => {
            const stabOne = voter.QRcode.filter(
              (qr) => qr.stamp === 1 && qr.scannedDateTime !== 'N/A',
            ).length;
            return acc + stabOne;
          }, 0);

          const totalStabTwo = team.voters.reduce((acc, voter) => {
            const stabTwo = voter.QRcode.filter(
              (qr) => qr.stamp === 2 && qr.scannedDateTime !== 'N/A',
            ).length;
            return acc + stabTwo;
          }, 0);

          return {
            tl: team.TeamLeader?.voter
              ? `${team.TeamLeader.voter.lastname}, ${team.TeamLeader.voter.firstname}`
              : 'No Team Leader',
            members: team._count.voters,
            one: totalStabOne,
            two: totalStabTwo,
            present: team.membersAttendance?.actual ?? 0,
          };
        });

        worksheet.addRows(reportData);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${barangay.name}-collection-report.xlsx"`,
        );

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('prin-team-stat', async (req: Request, res: Response) => {
      try {
        const { barangayId } = req.body;
        if (!barangayId) {
          return res.status(400).send('Bad request');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(``, {
          pageSetup: {
            orientation: 'portrait',
          },
          headerFooter: {
            oddHeader: `&L&B$ - Option: `,
            oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
          },
        });
        worksheet.columns = [
          { header: 'Team', key: 'team', width: 40 },
          { header: 'Tags', key: 'tags', width: 20 },
        ];

        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
        const [teams, barangay] = await prisma.$transaction([
          prisma.team.findMany({
            where: {
              barangaysId: barangayId,
            },
            include: {
              voters: {
                select: {
                  id: true,
                  oor: true,
                  firstname: true,
                  lastname: true,
                  idNumber: true,
                  status: true,
                },
              },
              TeamLeader: {
                select: {
                  voter: {
                    select: {
                      id: true,
                      firstname: true,
                      lastname: true,
                      idNumber: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.barangays.findUnique({
            where: {
              id: barangayId,
            },
          }),
        ]);
        if (!barangay) {
          return res.status(400).send('Bad Request');
        }
        const dataToInsert: any[] = [];
        teams.map((item) => {
          const actualCount = `Actual: ${
            item.voters.length - item.voters.filter((voter) => voter.oor === 'YES').length || 0
          }`;
          const tl = `TL: ${
            item.TeamLeader
              ? `${item.TeamLeader.voter?.idNumber} - ${item.TeamLeader.voter?.lastname}, ${item.TeamLeader.voter?.firstname}`
              : 'Unknown'
          }`;
          const or = `OR: ${item.voters.filter((voter) => voter.oor === 'YES').length}`;
          const membersCount = `Handle: ${item.voters.length ?? 0}`;
          dataToInsert.push([tl]);
          dataToInsert.push([or]);
          dataToInsert.push([membersCount]);
          dataToInsert.push([actualCount]);
          dataToInsert.push([`Members`]);

          const members = item.voters.map(
            (voter) => `${voter.idNumber} -${voter.lastname}, ${voter.firstname}`,
          );
          const membersTags = item.voters.map(
            (voter) => `[${voter?.status === 0 ? 'D,' : ''} ${voter?.oor === 'YES' ? 'OR,' : ''}]`,
          );
          for (let i = 0; i < members.length; i++) {
            dataToInsert.push([members[i], membersTags[i]]);
          }
        });
        worksheet.addRows(dataToInsert);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${barangay.name}-Team.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/print-survey-options', async (req: Request, res: Response) => {
      try {
        const { zipCode, multiple, surveyId, queryId } = req.body;

        if (!zipCode || !surveyId || !queryId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const [barangays, options, survey, query, allResponses] = await prisma.$transaction([
          prisma.barangays.findMany({
            where: { municipalId: parseInt(zipCode, 10) },
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  RespondentResponse: {
                    where: {
                      surveyId: surveyId,
                    },
                  },
                },
              },
            },
          }),
          prisma.option.findMany({
            where: { queryId },
          }),
          prisma.survey.findUnique({ where: { id: surveyId } }),
          prisma.queries.findUnique({ where: { id: queryId } }),
          prisma.response.findMany({ where: { queryId } }),
        ]);

        if (!barangays.length || !options.length || !survey || !query) {
          return res.status(404).json({ error: 'No data found' });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();

        for (const option of options) {
          const worksheet = workbook.addWorksheet(`${option.title}`, {
            pageSetup: {
              orientation: 'portrait',
            },
            headerFooter: {
              oddHeader: `&L&B${survey.tagID} - Option: ${option.title}`,
              oddFooter: `&RGenerated on: ${new Date().toLocaleDateString()}`,
            },
          });
          if (multiple) {
            worksheet.columns = [
              { header: 'Barangay', key: 'barangay', width: 30 },
              { header: 'Respondents', key: 'respondents', width: 30 },
              { header: 'Votes', key: 'votes', width: 10 },
              { header: 'Rank', key: 'rank', width: 10 },
            ];

            worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true };
              cell.alignment = { horizontal: 'center' };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
            });
          } else {
            worksheet.columns = [
              { header: 'Barangay', key: 'barangay', width: 20 },
              { header: 'Respondents', key: 'respondents', width: 10 },
              { header: 'Votes', key: 'votes', width: 10 },
              { header: 'Result', key: 'rank', width: 10 },
            ];

            worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true };
              cell.alignment = { horizontal: 'center' };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
            });
          }

          const data = barangays.map((barangay) => {
            // Count votes for this option in this barangay
            const voteCount = allResponses.filter(
              (resp) => resp.optionId === option.id && resp.barangaysId === barangay.id,
            ).length;

            // Count votes for all options in this barangay
            const optionVotesInBarangay = options.map((opt) => {
              const count = allResponses.filter(
                (resp) => resp.optionId === opt.id && resp.barangaysId === barangay.id,
              ).length;

              return {
                optionId: opt.id,
                count,
              };
            });

            // Sort descending to compute ranks
            const ranked = optionVotesInBarangay
              .sort((a, b) => b.count - a.count)
              .map((item, index) => ({
                ...item,
                rank: item.count > 0 ? index + 1 : 0,
              }));

            const thisOptionRank = ranked.find((r) => r.optionId === option.id)?.rank || 0;
            if (!multiple) {
              return {
                barangay: barangay.name,
                respondents: barangay._count.RespondentResponse ?? 0,
                votes: voteCount,
                rank: thisOptionRank,
              };
            }
            return {
              barangay: barangay.name,
              respondents: barangay._count.RespondentResponse ?? 0,
              votes: voteCount,
              rank: thisOptionRank,
            };
          });

          worksheet.addRows(data);
        }

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${survey.tagID}-${zipCode}-by-option.xlsx"`,
        );

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).json({ error: 'Failed to generate Excel' });
      }
    }),
    router.post('/print-team-members', async (req: Request, res: Response) => {
      try {
        const { id } = req.body;
        if (!id) {
          return res.status(400).send('Bad request');
        }
        console.log({ id });

        const [teams, barangay] = await prisma.$transaction([
          prisma.team.findMany({
            where: {
              barangaysId: id,
              level: 1,
            },
            include: {
              _count: {
                select: {
                  voters: true,
                },
              },
              TeamLeader: {
                select: {
                  voter: {
                    select: {
                      firstname: true,
                      lastname: true,
                      idNumber: true,
                      id: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              TeamLeader: {
                voter: {
                  lastname: 'asc',
                },
              },
            },
          }),
          prisma.barangays.findUnique({
            where: {
              id,
            },
          }),
        ]);

        if (teams.length === 0 || !barangay) {
          return res.status(404).send('Invalid data');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(`${barangay.name}`, {
          pageSetup: {
            orientation: 'portrait',
          },
          headerFooter: {
            oddHeader: `&C&BABC PARTY VOLUNTEER ATTENDANCE`,
            oddFooter: `&RBarangay: ${barangay.name}`,
          },
        });
        worksheet.columns = [
          { header: 'No.', key: 'no', width: 5 },
          { header: 'Fullname', key: 'fullname', width: 40 },
          { header: '', key: 'handle', width: 10 },
          { header: 'Actual', key: 'actual', width: 10 },
        ];

        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
        console.log({ teams, barangay });

        const data = teams.map((item, i) => {
          return {
            no: `${1 + i}.`,
            fullname: `${item.TeamLeader?.voter?.lastname}, ${item.TeamLeader?.voter?.firstname}`,
            handle: item._count.voters ?? 0,
            actual: '',
          };
        });

        worksheet.addRows(data);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${barangay.name}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/barangay-attendance', async (req: Request, res: Response) => {
      const { day, barangayId } = req.body;

      try {
        if (!day) {
          return res.status(400).send('Bad Request');
        }
        console.log({ day, barangayId });
        let barangay: Barangays | null = null;
        if (barangay) {
          barangay = await prisma.barangays.findUnique({
            where: {
              id: barangayId,
            },
          });
        }
        const targetDate = new Date(day as string).toISOString();
        console.log({ targetDate });

        const doc = new PDFDocument({ size: 'Letter', margin: 40, compress: false });
        doc.pipe(res);
        const startDate = new Date(day as string);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        let fitler: any = {};
        if (barangayId) {
          fitler.teamLeader = {
            barangaysId: barangay?.id,
          };
        }
        const data = await prisma.teamLeaderAttendance.findMany({
          where: {
            date: {
              gte: startDate,
              lt: endDate,
            },
            ...fitler,
          },
          include: {
            teamLeader: {
              select: {
                voter: {
                  select: {
                    idNumber: true,
                    lastname: true,
                    firstname: true,
                    level: true,
                  },
                },
                level: true,
                barangay: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        });
        console.log({ data });

        doc.moveDown(2);
        doc.fontSize(14).text(`Total Attendee/s: ${data.length}`, {
          align: 'left',
        });
        doc.moveDown(1);
        doc
          .fontSize(14)
          .text(
            `BC Attendee/s: ${data.filter((item) => item.teamLeader.level === 3).length || 0}`,
            {
              align: 'left',
            },
          );
        doc.moveDown(1);
        doc
          .fontSize(14)
          .text(
            `PC Attendee/s: ${data.filter((item) => item.teamLeader.level === 2).length || 0}`,
            {
              align: 'left',
            },
          );
        doc.moveDown(1);
        doc
          .fontSize(14)
          .text(
            `TL Attendee/s: ${data.filter((item) => item.teamLeader.level === 1).length || 0}`,
            {
              align: 'left',
            },
          );
        doc.moveDown(2);
        if (data.length > 0) {
          data.map((item, i) => {
            doc
              .fontSize(12)
              .text(
                `${i + 1}. ${item.teamLeader.barangay.name} ${handleLevel(
                  item.teamLeader?.voter?.level as number,
                )} - ${item.teamLeader.voter?.lastname}, ${item.teamLeader.voter?.firstname} (${
                  item.teamLeader.voter?.idNumber
                })      ${formatToLocalPHTime(item.date)}`,
                { indent: 20, align: 'left' },
              );
            doc.moveDown(1);
          });
        }

        doc.end();
      } catch (error) {
        res.status(500).send('Internal Server Error');
      }
    }),
    router.post('/generate-survey-report', async (req: Request, res: Response) => {
      const { code, zipCode, barangayId } = req.body;
      console.log({ code, zipCode, barangayId });

      if (!code || !zipCode || !barangayId) {
        return res.status(400).send('Bad request');
      }

      const municipalId = parseInt(zipCode as string, 10);

      try {
        const barangayResponseResponse = async (id: string) => {
          return await prisma.respondentResponse.count({
            where: {
              Response: {
                some: {
                  queryId: id,
                },
              },
            },
          });
        };
        let barangay: Barangays | null = null;
        const filter: any = {};
        if (barangayId !== 'all') {
          filter.barangaysId = barangayId;
          barangay = await prisma.barangays.findUnique({
            where: {
              id: barangayId as string,
            },
          });
        }
        const [barangays, survey] = await prisma.$transaction([
          prisma.barangays.findMany({
            where: {
              municipalId: municipalId,
            },
            include: {
              RespondentResponse: {
                where: {
                  surveyId: code as string,
                },
                include: {
                  gender: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  Response: {
                    select: {
                      queries: {
                        select: {
                          id: true,
                          queries: true,
                          access: true,
                        },
                      },
                      option: {
                        select: {
                          id: true,
                          title: true,
                        },
                      },
                    },
                    distinct: ['respondentResponseId', 'optionId'],
                  },
                },
                distinct: ['surveyId'],
              },
            },
            orderBy: {
              name: 'asc',
            },
          }),
          prisma.survey.findUnique({
            where: {
              id: code as string,
            },
            include: {
              queries: {
                include: {
                  Option: {
                    include: {
                      Response: {
                        where: {
                          municipalsId: municipalId,
                          ...filter,
                        },
                        include: {
                          respondentResponse: {
                            select: {
                              gender: {
                                select: {
                                  id: true,
                                  name: true,
                                },
                              },
                            },
                          },
                        },
                        distinct: ['respondentResponseId', 'optionId'],
                      },
                    },
                  },
                  Response: true,
                },
              },
              _count: {
                select: {
                  RespondentResponse: {
                    where: {
                      surveyId: code as string,
                      ...filter,
                    },
                  },
                },
              },
            },
          }),
        ]);
        const barangayData = await prisma.barangays.findMany({
          where: {
            municipalId: municipalId,
          },
          include: {
            RespondentResponse: {
              where: {
                surveyId: code as string,
                ...filter,
              },
              include: {
                gender: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                Response: {
                  select: {
                    queries: {
                      select: {
                        id: true,
                        queries: true,
                        access: true,
                        type: true,
                      },
                    },
                    option: {
                      select: {
                        id: true,
                        title: true,
                        queryId: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        const structuredResponse = {
          barangays: barangayData.map((barangay) => {
            const queryMap = new Map();
            const uniqueResponses = new Set(); // Track unique respondent responses

            barangay.RespondentResponse.forEach((respondent) => {
              uniqueResponses.add(respondent.id); // Count each unique respondent response

              respondent.Response.forEach((response) => {
                const queryId = response.queries.id;
                const queryText = response.queries.queries;
                const queryAccess = response.queries.access;
                const optionId = response.option?.id;
                const optionTitle = response.option?.title;
                const gender = respondent?.gender?.name.toLowerCase();

                // **Fix: Ensure option belongs to the correct query**
                if (!optionId || response?.option?.queryId !== queryId) {
                  return; // Skip this option if it doesn’t match the query
                }

                if (!queryMap.has(queryId)) {
                  queryMap.set(queryId, {
                    query: queryText,
                    access: queryAccess,
                    totalQueryResponse: 0,
                    options: new Map(),
                  });
                }

                const queryObj = queryMap.get(queryId);
                queryObj.totalQueryResponse++;

                if (!queryObj.options.has(optionId)) {
                  queryObj.options.set(optionId, {
                    title: optionTitle,
                    response: {
                      respondentResponse: {
                        gender: { male: 0, female: 0 },
                      },
                    },
                  });
                }

                // **Fix: Increment gender count only for valid options**
                const optionObj = queryObj.options.get(optionId);
                if (optionObj) {
                  optionObj.response.respondentResponse.gender[gender as string]++;
                }
              });
            });

            return {
              name: barangay.name,
              totalResponse: uniqueResponses.size, // Count only unique respondent responses
              queries: Array.from(queryMap.values()).map((q) => ({
                query: q.query,
                access: q.access,
                totalQueryResponse: q.totalQueryResponse,
                options: Array.from(q.options.values()),
              })),
            };
          }),
        };

        if (!survey) {
          return res.status(404).json({ message: 'NOT Found' });
        }

        const { queries } = survey;
        const doc = new PDFDocument({ size: 'Letter', margin: 10, compress: false });

        const area = barangayId !== 'all' ? `-${barangay?.name}` : '-All';

        doc.pipe(res);

        // Report Header
        doc.fontSize(12).text(`Survey CODE: ${survey.tagID}`, 20, 20);
        doc.fontSize(12).text(`Area: ${zipCode}${area}`, 20, 40);
        doc.moveDown(1);
        doc.fontSize(12).text('Report Summary', 20, 100);
        doc.fontSize(10).text(`Target Response: ${1500}`, 20, 120);
        doc.fontSize(10).text(`Total Response: ${survey._count.RespondentResponse}`, 20, 140);
        doc
          .fontSize(10)
          .text(
            `Percentage: ${calculatePercentage(survey._count.RespondentResponse, 1500)}%`,
            20,
            160,
          );
        doc.moveDown(2);

        // Survey Queries
        queries
          .filter((item) => item.access !== 'admin')
          .forEach((query, i) => {
            doc.fontSize(12).text(`${i + 1}. ${query.queries}`, { indent: 20 });
            doc.moveDown(0.5);

            if (query.Option) {
              query.Option.forEach((option, j) => {
                doc.fontSize(10).text(`${alphabetic[j]}. ${option.title}`, { indent: 40 });
                const male = option.Response.filter(
                  (item) => item?.respondentResponse?.gender?.name?.toLowerCase() === 'male',
                ).length;
                const female = option.Response.filter(
                  (item) => item?.respondentResponse?.gender?.name?.toLowerCase() === 'female',
                ).length;

                doc.moveDown(0.5);
                doc
                  .fontSize(10)
                  .text(
                    `Total: ${option.Response.length} (${calculatePercentage(
                      option.Response.length,
                      query.Response.length,
                    )}%)     Male: ${male} (${calculatePercentage(
                      male,
                      option.Response.length,
                    )}%) | Female: ${female} (${calculatePercentage(
                      female,
                      option.Response.length,
                    )}%)`,
                    { indent: 60 },
                  );
                doc.moveDown(0.5);
              });
            }
            doc.moveDown(1);
          });
        if (barangayId === 'all') {
          doc.fontSize(12).text(`Barangay Breakdown`, { indent: 10 });
          doc.moveDown(0.5);
          structuredResponse.barangays.forEach((barangay, one) => {
            doc.fontSize(12).text(`${one + 1}. ${barangay.name}`, { indent: 10 });
            doc.moveDown(1);
            doc.fontSize(10).text(`Total Response: ${barangay.totalResponse}`, { indent: 10 });
            barangay.queries
              .filter((item) => item.access !== 'admin')
              .forEach((query, two) => {
                doc.moveDown(2);
                doc.fontSize(10).text(`${two + 1}. ${query.query}`, { indent: 40 });
                doc.moveDown(1);
                doc.fontSize(10).text(`Total: ${query.totalQueryResponse}`, { indent: 15 });
                const optionList = query.options as {
                  title: string;
                  response: {
                    respondentResponse: {
                      gender: { male: number; female: number };
                    };
                  };
                }[];
                optionList.forEach((option, three) => {
                  doc.fontSize(10).text(`${alphabetic[three]}. ${option.title}`, { indent: 60 });
                  doc
                    .fontSize(10)
                    .text(
                      `Total: ${
                        option.response.respondentResponse.gender.male +
                        option.response.respondentResponse.gender.female
                      }`,
                      { indent: 60 },
                    );
                  doc
                    .fontSize(10)
                    .text(
                      `Male: ${option.response.respondentResponse.gender.male} Female: ${option.response.respondentResponse.gender.female}`,
                      { indent: 70 },
                    );
                  doc.moveDown(1);
                });
              });
          });
        } else {
          const barangayResult = structuredResponse.barangays.find(
            (item) => item.name === barangay?.name,
          );
          doc.moveDown(2);
          doc.fontSize(12).text(`Barangay: ${barangayResult?.name}`, { indent: 10 });
          doc.moveDown(0.5);
          doc.fontSize(10).text(`Total Response: ${barangayResult?.totalResponse}`, { indent: 10 });
          doc.moveDown(0.5);
          barangayResult?.queries
            .filter((item) => item.access !== 'admin')
            .forEach((query, two) => {
              doc.moveDown(2);
              doc.fontSize(10).text(`${two + 1}. ${query.query}`, { indent: 40 });
              doc.moveDown(1);
              doc.fontSize(10).text(`Total: ${query.totalQueryResponse}`, { indent: 15 });
              const optionList = query.options as {
                title: string;
                response: {
                  respondentResponse: {
                    gender: { male: number; female: number };
                  };
                };
              }[];
              optionList.forEach((option, three) => {
                doc.fontSize(10).text(`${alphabetic[three]}. ${option.title}`, { indent: 60 });
                doc
                  .fontSize(10)
                  .text(
                    `Total: ${
                      option.response.respondentResponse.gender.male +
                      option.response.respondentResponse.gender.female
                    }`,
                    { indent: 60 },
                  );
                doc
                  .fontSize(10)
                  .text(
                    `Male: ${option.response.respondentResponse.gender.male} Female: ${option.response.respondentResponse.gender.female}`,
                    { indent: 70 },
                  );
                doc.moveDown(1);
              });
            });
        }

        if (barangayId === 'all') {
          const tableStartY = doc.y;
          const docW = doc.page.width - 60; // Reduce width slightly for padding
          const headers = ['Barangay', 'Quota', 'Male', 'Female', 'Actual'];
          const perColW = docW / headers.length;
          const finalW = Number(perColW.toFixed(2));

          const rowHeight = 20;
          const startX = 50; // Start position of the table
          let y = tableStartY;

          // Draw Table Header
          doc.fontSize(12).text('Barangay', startX, y);
          y += 20;
          doc
            .moveTo(startX, y)
            .lineTo(startX + docW, y)
            .stroke();

          // Centered Headers using finalW
          headers.forEach((header, index) => {
            const textWidth = doc.widthOfString(header);
            let posX = startX + index * finalW + (finalW - textWidth) / 2;

            // Ensure last column does not overflow
            if (index === headers.length - 1) {
              posX = startX + index * finalW + (finalW - textWidth - 10) / 2;
            }

            doc.text(header, posX, y + 5);
          });

          y += 20;
          doc
            .moveTo(startX, y)
            .lineTo(startX + docW, y)
            .stroke();

          const totalActual = barangays.reduce((acc, base) => {
            return acc + base.RespondentResponse.length;
          }, 0);

          const totalMale = barangays.reduce((acc, base) => {
            if (!base.maleSize) {
              return 0;
            }
            return acc + base.maleSize;
          }, 0);

          const totalFemale = barangays.reduce((acc, base) => {
            if (!base.femaleSize) {
              return 0;
            }
            return acc + base.femaleSize;
          }, 0);

          const allgender = barangays.reduce((acc, base) => {
            if (!base.femaleSize || !base.maleSize) {
              return 0;
            }
            return acc + base.femaleSize + base.maleSize;
          }, 0);

          // Draw Table Rows with Centered Data
          for (let i = 0; i < (barangays?.length ?? 0); i++) {
            const maleSize = barangays[i].maleSize ?? 0;
            const femaleSize = barangays[i].femaleSize ?? 0;
            const totalGender = maleSize + femaleSize;
            const rowData = [
              `${barangays[i].name}`,
              `${barangays[i].maleSize}`,
              `${barangays[i].femaleSize}`,
              `${totalGender}`,
              `${barangays[i].RespondentResponse.length}`,
            ];

            rowData.forEach((data, index) => {
              const textWidth = doc.widthOfString(data);
              let posX = startX + index * finalW + (finalW - textWidth) / 2;

              // Ensure last column is correctly positioned
              if (index === headers.length - 1) {
                posX = startX + index * finalW + (finalW - textWidth - 10) / 2;
              }

              doc.text(data, posX, y + 5);
            });

            y += rowHeight;
            doc
              .moveTo(startX, y)
              .lineTo(startX + docW, y)
              .stroke();
          }
          [barangays.length, totalMale, totalFemale, allgender, totalActual].forEach(
            (header, index) => {
              const textWidth = doc.widthOfString(header.toString());
              let posX = startX + index * finalW + (finalW - textWidth) / 2;

              // Ensure last column does not overflow
              if (index === headers.length - 1) {
                posX = startX + index * finalW + (finalW - textWidth - 10) / 2;
              }

              doc.text(header.toString(), posX, y + 5);
            },
          );
        }

        doc.end();
      } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
      }
    }),
  );

  return router;
};
