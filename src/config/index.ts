import { ApolloServer } from "@apollo/server";

import { expressMiddleware } from "@apollo/server/express4";
import express, { Request, Response } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";

import { prisma, Candidates, Position, Prisma } from "../../prisma/prisma";
import { typeDefs } from "../schema/schema";
import { Resolvers } from "../interface/types";
import bodyParser from "body-parser";

//routes
import files from "../routes/files";
import precint from "../routes/precint";
import voters from "../routes/voter";
import purok from "../routes/purok";
import pdfFile from "../../routes/pdfFile";
//utils
import { handleGenTagID, handleLevel } from "../utils/data";
import { GraphQLError } from "graphql";
import {
  BarangayOptionResponse,
  RejectListProps,
  RespondentResponseProps,
  RejectListedProps,
  ValidatedTeamMembers,
  VoterRecordsProps,
} from "../interface/data";

const app = express();
const ioserver = createServer(app);
const io = new Server(ioserver, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://jml-client-test.netlify.app",
      "https://jml-portal.netlify.app",
    ],
    methods: ["GET", "POST"],
  },
});

//routes
const fileRoutes = files(io);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({ origin: ["http://localhost:5173", "https://jml-portal.netlify.app"] })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const resolvers: Resolvers = {
  Query: {
    users: async () => {
      return await prisma.users.findMany();
    },
    voters: async () =>
      await prisma.voters.findMany({
        where: {
          saveStatus: "listed",
        },
      }),
    voter: async (_, { id }) => {
      return await prisma.voters.findUnique({ where: { id } });
    },
    votersCount: async () => {
      return await prisma.voters.count({
        where: {
          saveStatus: "listed",
        },
      });
    },
    searchDraftVoter: async (_, { query }) => {
      return await prisma.voters.findMany({
        where: {
          OR: [
            {
              lastname: {
                contains: query.params,
                mode: "insensitive",
              },
            },
            {
              firstname: {
                contains: query.params,
                mode: "insensitive",
              },
            },
          ],
          saveStatus: query.saveStatus,
          municipalsId: query.municipalsId,
          barangaysId: query.barangaysId,
          newBatchDraftId: query.draftID,
        },
      });
    },
    barangay: async (_, { id }) => {
      return await prisma.barangays.findUnique({ where: { id } });
    },
    barangays: async () => {
      return await prisma.barangays.findMany();
    },
    barangayList: async (_, { zipCode }) => {
      console.log(zipCode);

      return await prisma.barangays.findMany({
        where: { municipalId: zipCode },
        orderBy: { name: "asc" },
      });
    },
    municipals: async () => await prisma.municipals.findMany(),
    municipal: async (_, { zipCode }) => {
      return await prisma.municipals.findUnique({ where: { id: zipCode } });
    },
    municipalVoterList: async (_, { id }) => {
      const data = await prisma.voters.findMany({
        where: { municipalsId: id },
        include: { barangay: true },
      });
      return data;
    },
    barangaysCount: async () => {
      return await prisma.barangays.count();
    },
    barangayVotersList: async (_, { municipalId, barangayId }) => {
      return await prisma.voters.findMany({
        where: { municipalsId: municipalId, barangaysId: barangayId },
      });
    },
    barangayNewVotersDraft: async (_, { municipalId, barangayId }) => {
      return await prisma.newBatchDraft.findMany({
        where: { municipalId, barangayId },
      });
    },
    puroks: async (_, { municipalId, barangayId }) => {
      return await prisma.purok.findMany({
        where: { municipalsId: municipalId, barangaysId: barangayId },
      });
    },
    purok: async (_, { id }) => {
      return await prisma.purok.findFirst({
        where: {
          id,
        },
      });
    },
    draftedVoters: async (_, { voter }) => {
      return await prisma.voters.findMany({
        where: {
          municipalsId: voter.municipalId,
          barangaysId: voter.barangayId,
          newBatchDraftId: voter.draftID,
          saveStatus: "drafted",
        },
      });
    },
    drafts: async () => {
      return await prisma.newBatchDraft.findMany();
    },
    draft: async (_, { id }) => {
      return await prisma.newBatchDraft.findUnique({ where: { id } });
    },
    survey: async (_, { id }) => {
      return await prisma.survey.findUnique({ where: { id } });
    },
    getSurvey: async (_, { tagID }) => {
      const target = await prisma.survey.findFirst({
        where: { tagID: tagID, status: "Ongoing" },
      });

      if (!target) {
        throw new GraphQLError("No active survey found with tag ID", {
          extensions: { code: "SURVEY_NOT_FOUND" },
        });
      }
      return target;
    },
    surveyList: async () => {
      return await prisma.survey.findMany({
        orderBy: { timestamp: "asc" },
      });
    },

    queries: async (_, { id }) => {
      return await prisma.queries.findUnique({ where: { id } });
    },
    ageList: async () => {
      return await prisma.ageBracket.findMany({ orderBy: { order: "asc" } });
    },
    genderList: async () => {
      return await prisma.gender.findMany();
    },
    option: async (_, { id }) => {
      return await prisma.option.findUnique({ where: { id } });
    },
    getRespondentResponse: async () => {
      return await prisma.respondentResponse.findMany();
    },
    surveyResponseList: async () => {
      return await prisma.surveyResponse.findMany();
    },
    allSurveyResponse: async (_, { survey }) => {
      return await prisma.surveyResponse.findMany({
        where: { municipalsId: survey.municipalsId, surveyId: survey.surveyId },
        orderBy: { timestamp: "asc" },
      });
    },
    surveyResponseInfo: async (_, { id }) => {
      return await prisma.surveyResponse.findUnique({ where: { id } });
    },
    respondentResponse: async (_, { id }) => {
      return await prisma.respondentResponse.findMany();
    },
    quotas: async () => {
      return await prisma.quota.findMany();
    },
    barangayQuota: async (_, { id }) => {
      return await prisma.quota.findMany({ where: { barangaysId: id } });
    },
    gendersSize: async () => {
      return await prisma.genderSize.findMany();
    },
    responseRespondent: async (_, { id }) => {
      // Fetch responses including their related queries
      const responses = await prisma.response.findMany({
        where: { respondentResponseId: id },
        include: {
          queries: true, // Assuming `queries` is a relation in your Prisma model
          option: true, // Assuming `option` is the related options for each response
        },
      });

      // Group the responses by `queryId`
      const groupedByQueries: { [key: string]: RespondentResponseProps } =
        responses.reduce((grouped, response) => {
          const queryId = response.queries.id;

          if (!grouped[queryId]) {
            grouped[queryId] = {
              id: response.id,
              ageBracketId: response.ageBracketId,
              genderId: response.genderId,
              order: response.queries.order as number,
              queries: response.queries.queries as string,
              surveyId: response.surveyId,
              queryId: queryId,
              respondentResponseId: response.respondentResponseId,
              option: [],
            };
          }

          // Assuming each response has an `option` relation, push options into the corresponding group
          grouped[queryId].option.push({
            id: response.option.id,
            queryId: queryId,
            title: response.option.title as string,
            desc: response.option.desc as string,
          });

          return grouped;
        }, {} as { [key: string]: RespondentResponseProps });

      // Convert the grouped object into an array
      const flattenedResponses = Object.values(groupedByQueries);

      // Return the result as an array of RespondentResponseProps
      return flattenedResponses;
    },
    getRespondentResponseById: async (_, { id }) => {
      return await prisma.respondentResponse.findUnique({
        where: { id },
      });
    },
    surveyQueriesList: async (_, { id }) => {
      return await prisma.queries.findMany({ where: { surveyId: id } });
    },
    optionCountAge: async (_, { optionId, ageBracketId }) => {
      if (optionId === "all") {
        return 0;
      }
      return await prisma.response.count({ where: { optionId, ageBracketId } });
    },
    optionRank: async (
      _,
      {
        surveyId,
        ageBracketId,
        zipCode,
        barangayId,
        genderId,
        optionId,
        queryId,
      }
    ) => {
      let filters: any = {
        surveyId: surveyId,
        ageBracketId: ageBracketId,
        optionId: optionId,
        queryId: queryId,
        municipalsId: zipCode,
      };

      if (barangayId !== "all") {
        filters.barangaysId = barangayId;
      }
      if (genderId !== "all") {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
    optionGenderRank: async (
      _,
      {
        surveyId,
        ageBracketId,
        zipCode,
        barangayId,
        genderId,
        optionId,
        queryId,
      }
    ) => {
      let filters: any = {
        surveyId: surveyId,
        ageBracketId: ageBracketId,
        optionId: optionId,
        queryId: queryId,
        municipalsId: zipCode,
      };

      if (barangayId !== "all") {
        filters.barangaysId = barangayId;
      }
      if (genderId !== "all") {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
    barangayOptionResponse: async (_: any, { zipCode, queryId, surveyId }) => {
      const barangayList = await prisma.barangays.findMany({
        where: {
          municipalId: zipCode,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      // Step 2: Fetch all options for the given queryId
      const optionsList = await prisma.option.findMany({
        where: {
          queryId,
        },
        select: {
          id: true,
          title: true,
          desc: true,
        },
      });

      // Step 3: Fetch response counts in bulk for all barangays and options
      const responseCounts = await prisma.response.groupBy({
        by: ["barangaysId", "optionId"],
        where: {
          surveyId: surveyId,
          queryId: queryId,
        },
        _count: {
          _all: true,
        },
      });

      // Step 4: Process and format the data
      const results: BarangayOptionResponse[] = barangayList.map((barangay) => {
        // Find response counts for this barangay
        const optionsWithCounts = optionsList.map((option) => {
          const countData = responseCounts.find(
            (rc) => rc.barangaysId === barangay.id && rc.optionId === option.id
          );

          return {
            id: option.id,
            queryId: queryId,
            title: option.title,
            desc: option.desc,
            overAllCount: countData?._count._all || 0,
          };
        });

        return {
          id: barangay.id,
          name: barangay.name,
          options: optionsWithCounts,
        };
      });

      return results;
    },
    getAllVoters: async (_, { offset, limit, barangayId, zipCode }) => {
      let filter: Prisma.VotersWhereInput = { saveStatus: "listed" }; // use Prisma's typing if possible

      if (zipCode !== "all") {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId !== "all") {
        filter.barangaysId = barangayId;
      }
      return await prisma.voters.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          lastname: "asc",
        },
        where: filter,
      });
    },
    searchVoter: async (_, { query, skip, take }) => {
      return await prisma.voters.findMany({
        skip,
        take,
        where: {
          OR: [
            {
              lastname: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              firstname: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              idNumber: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
      });
    },
    getSelectedVoters: async (_, { list }) => {
      const data = await prisma.voters.findMany({
        where: {
          id: { in: list },
        },
      });

      return data;
    },
    getRankOption: async (_, { optionId }) => {
      // Step 1: Group the responses by `barangaysId`
      const topBarangays = await prisma.response.groupBy({
        by: ["barangaysId"],
        where: {
          optionId,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 15,
      });

      // Step 2: Fetch the barangay details in a separate query
      const barangayIds = topBarangays.map((barangay) => barangay.barangaysId);

      const barangayDetails = await prisma.barangays.findMany({
        where: {
          id: { in: barangayIds },
        },
      });

      const result = topBarangays.map((barangay) => ({
        ...barangay,
        barangay:
          barangayDetails.find(
            (detail) => detail.id === barangay.barangaysId
          ) || null,
      }));
      return JSON.stringify(result);
    },
    getAllPurokCoor: async () => {
      return await prisma.purokCoor.findMany();
    },
    getAllTeamLeader: async () => {
      return await prisma.teamLeader.findMany();
    },
    getVotersList: async (
      _,
      {
        level,
        take,
        skip,
        query,
        zipCode,
        barangayId,
        purokId,
        pwd,
        illi,
        inc,
        oor,
        dead,
        youth,
        senior,
        gender,
      }
    ) => {
      const filter: any = { saveStatus: "listed" };

      if (level !== "all") {
        filter.level = parseInt(level, 10);
      }

      if (zipCode !== "all") {
        filter.municipalsId = parseInt(zipCode, 10);
      }

      if (barangayId !== "all") {
        filter.barangaysId = barangayId;
      }

      if (purokId !== "all") {
        filter.purokId = purokId;
      }
      if (pwd === "YES") {
        filter.pwd = "YES";
      }
      if (oor === "YES") {
        filter.oor = "YES";
      }
      if (inc === "YES") {
        filter.inc = "YES";
      }
      if (illi === "YES") {
        filter.illi = "YES";
      }
      if (dead === "YES") {
        filter.status = 0;
      }
      if (senior === "YES") {
        filter.senior = true;
      }
      if (youth === "YES") {
        filter.youth = true;
      }
      if (gender !== "all") {
        filter.gender = gender;
      }
      if (query) {
        filter.OR = [
          { lastname: { contains: query, mode: "insensitive" } },
          { firstname: { contains: query, mode: "insensitive" } },
        ];
      }

      const result = await prisma.voters.findMany({
        where: filter,
        skip: skip,
        take: take,
      });

      const count = await prisma.voters.count({
        where: filter,
      });
      console.log("Filter: ", filter);

      return { voters: result, results: count };
    },
    getPurokList: async (_, { id }) => {
      return await prisma.purok.findMany({
        where: {
          barangaysId: id,
        },
      });
    },
    teamList: async (
      _,
      {
        zipCode,
        barangayId,
        purokId,
        level,
        query,
        skip,
        candidate,
        withIssues,
      }
    ) => {
      const filter: any = {};
      let select: any = {
        id: true,
        purokId: true,
        barangaysId: true,
        municipalsId: true,
        hubId: true,
        level: true,
        teamLeaderId: true,
        candidatesId: true,
        _count: {
          select: {
            voters: {
              where: {
                VoterRecords: {
                  some: {},
                },
              },
            },
          },
        },
      };
      console.log("level: ", level, skip, query);

      const levelList: any = [
        { name: "TL", value: 1 },
        { name: "PC", value: 2 },
        { name: "BC", value: 3 },
      ];
      if (query) {
        filter.TeamLeader = {
          voter: {
            OR: [
              { lastname: { contains: query, mode: "insensitive" } },
              { firstname: { contains: query, mode: "insensitive" } },
              { idNumber: { contains: query, mode: "insensitive" } },
            ],
          },
        };
      }
      const teamLevel = levelList.find(
        (x: { name: string }) => x.name === level
      );

      if (zipCode !== "all") {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId !== "all") {
        filter.barangaysId = barangayId;
      }
      if (purokId !== "all") {
        filter.purokId = purokId;
      }
      if (level !== "all") {
        filter.level = teamLevel.value;
      }
      if (!withIssues) {
        select = {};
      }

      const teams = await prisma.team.findMany({
        where: filter,
        skip: skip ?? 0,
        take: 50,
        select: {
          id: true,
          purokId: true,
          barangaysId: true,
          municipalsId: true,
          hubId: true,
          level: true,
          teamLeaderId: true,
          candidatesId: true,
          _count: {
            select: {
              voters: {
                where: {
                  VoterRecords: {
                    some: {},
                  },
                },
              },
            },
          },
        },
      });

      return teams;
    },
    candidates: async () => {
      return await prisma.candidates.findMany();
    },
    team: async (_, { id }) => {
      return await prisma.team.findUnique({
        where: {
          id,
        },
      });
    },
    getAllTL: async () => {
      return await prisma.teamLeader.findMany();
    },
    validationList: async (_, { id }) => {
      return await prisma.validation.findMany({
        where: {
          barangaysId: id,
        },
      });
    },
    teams: async () => {
      return await prisma.team.findMany();
    },
    teamRecord: async (_, { query, skip, municipal, barangay }) => {
      let filter: any = {};
      if (municipal !== "all") {
        filter.municipalsId = parseInt(municipal, 10);
      }
      if (barangay !== "all") {
        filter.barangaysId = barangay;
      }
      if (query) {
        filter.teamLeader = {
          voter: {
            OR: [
              { lastname: { contains: query, mode: "insensitive" } },
              { firstname: { contains: query, mode: "insensitive" } },
            ],
          },
        };
      }

      return await prisma.validatedTeams.findMany({
        where: filter,
        skip: skip ?? 0,
        orderBy: {
          timestamp: "desc",
        },
      });
    },
    getTeamRecord: async (_, { id }) => {
      return await prisma.validatedTeams.findUnique({
        where: { id },
      });
    },
    userList: async () => {
      return await prisma.users.findMany();
    },
    userQRCodeList: async () => {
      return await prisma.userQRCode.findMany();
    },
  },
  Mutation: {
    signUp: async (_, { user }) => {
      const hash = await argon2.hash(user.password);
      const check = await prisma.adminUser.findFirst({
        where: { phoneNumber: user.phoneNumber },
      });
      if (check) {
        throw new Error("Phone number already exit.");
      }
      return await prisma.adminUser.create({
        data: {
          phoneNumber: user.phoneNumber,
          password: hash,
          lastname: user.lastname,
          firstname: user.firstname,
          address: user.address,
        },
      });
    },
    createVoter: async (_, voter) => {
      return await prisma.voters.create({ data: voter });
    },
    newUser: async (_, { user }) => {
      const { username, password, privilege, purpose, role } = user;

      const checked = await prisma.users.findFirst({ where: { username } });
      if (checked) {
        throw new GraphQLError("Username already exists");
      }

      await prisma.$transaction(async (prisma) => {
        // Create user
        const createdUser = await prisma.users.create({
          data: {
            username,
            password,
            status: 1,
            privilege,
            purpose,
            role,
          },
        });

        // Generate QR code
        const generatedCode = await qrcode.toDataURL(createdUser.uid);

        // Create QR code and update user
        const qrCode = await prisma.userQRCode.create({
          data: { qrCode: generatedCode },
        });

        // Update the user with the QR code ID
        await prisma.users.update({
          where: { uid: createdUser.uid },
          data: { userQRCodeId: qrCode.id },
        });

        console.log({ createdUser });
      });

      return "OK";
    },

    createMunicipal: async (_, { municipal }) => {
      return await prisma.municipals.create({
        data: {
          id: municipal.id,
          name: municipal.name,
        },
      });
    },
    createBarangay: async (_, { barangay }) => {
      const existed = await prisma.barangays.findFirst({
        where: {
          name: {
            equals: barangay.name,
            mode: "insensitive",
          },
          municipalId: barangay.municipalId,
        },
      });
      if (existed) {
        throw new Error("Barangay name already exists");
      }
      return await prisma.barangays.create({
        data: {
          municipalId: barangay.municipalId,
          name: barangay.name,
        },
      });
    },
    createNewBatchDraft: async (_, { barangay }) => {
      return await prisma.newBatchDraft.create({
        data: {
          municipalId: barangay.municipalId,
          barangayId: barangay.barangayId,
        },
      });
    },
    removeDraft: async (_, { id }) => {
      await prisma.voters.deleteMany({
        where: { newBatchDraftId: id, saveStatus: "drafted" },
      });
      return await prisma.newBatchDraft.delete({ where: { id } });
    },
    createPrecent: async (_, { precint }) => {
      return await prisma.precents.create({
        data: {
          precintNumber: precint.precintNumber,
          id: precint.id,
          municipalsId: precint.municipalsId,
          barangayId: precint.barangaysId,
        },
      });
    },
    changePurokName: async (_, { purok }) => {
      return await prisma.purok.update({
        where: { id: purok.id },
        data: { purokNumber: purok.value },
      });
    },
    mergePurok: async (_, { purok }) => {
      const newID = purok.id[0];
      const data = await prisma.purok.update({
        where: { id: newID },
        data: { purokNumber: purok.newName },
      });
      await prisma.voters.updateMany({
        where: { purokId: newID },
        data: { purokId: newID },
      });
      for (let item of purok.id.slice(1)) {
        await prisma.voters.updateMany({
          where: { purokId: item },
          data: { purokId: newID },
        });
        await prisma.purok.delete({ where: { id: item } });
      }
      return data;
    },
    goLiveSurvey: async (_, { id }) => {
      return await prisma.survey.update({
        where: { id },
        data: { drafted: false },
      });
    },
    getSurvey: async (_, { tagID }) => {
      return prisma.survey.findFirst({ where: { tagID, drafted: false } });
    },
    createSurvey: async (_, { survey }) => {
      const checkTagID = async () => {
        let genID = handleGenTagID();
        const tagID = await prisma.survey.findFirst({
          where: { tagID: genID.toString() },
        });
        if (tagID) {
          return checkTagID();
        } else {
          return genID.toString();
        }
      };

      const tagID = await checkTagID();

      const data = await prisma.survey.create({
        data: {
          type: "random",
          adminUserUid: survey.adminUserUid,
          tagID: tagID,
        },
      });
      return data;
    },
    createQuery: async (_, { query }) => {
      console.log("New Query: ", query);

      return await prisma.queries.create({
        data: {
          queries: query.queries,
          surveyId: query.surveyId,
          type: query.type,
          onTop: query.onTop,
          style: query.style,
        },
      });
    },
    createOption: async (_, { option }) => {
      return await prisma.option.create({
        data: {
          title: option.title,
          desc: option.desc,
          queryId: option.queryId,
          mediaUrlId: option.mediaUrlId,
        },
      });
    },
    createAge: async (_, { age }) => {
      return await prisma.ageBracket.create({ data: { segment: age } });
    },
    deleteAge: async (_, { id }) => {
      return await prisma.ageBracket.delete({ where: { id } });
    },
    updateAge: async (_, { age }) => {
      return await prisma.ageBracket.update({
        where: { id: age.id },
        data: { segment: age.value },
      });
    },
    createGender: async (_, { gender }) => {
      return await prisma.gender.create({ data: { name: gender } });
    },
    deleteGender: async (_, { id }) => {
      return await prisma.gender.delete({ where: { id } });
    },
    updateGender: async (_, { gender }) => {
      return await prisma.gender.update({
        where: { id: gender.id },
        data: { name: gender.value },
      });
    },
    deleteOption: async (_, { id }) => {
      return await prisma.option.delete({ where: { id } });
    },
    deleteOptionMedia: async (_, { option }) => {
      await prisma.option.update({
        where: { id: option.optionID },
        data: { mediaUrlId: null },
      });
      return await prisma.mediaUrl.delete({ where: { id: option.id } });
    },
    deleteQuery: async (_, { id }) => {
      await prisma.option.deleteMany({ where: { queryId: id } });
      const query = await prisma.queries.delete({ where: { id } });
      return query;
    },
    updateOptionImage: async (_, { image }) => {
      return await prisma.mediaUrl.update({
        where: { id: image.id },
        data: { url: image.url, filename: image.filename, size: image.size },
      });
    },
    updateOption: async (_, { option }) => {
      return await prisma.option.update({
        where: { id: option.id },
        data: { title: option.title, desc: option.desc },
      });
    },
    updateSampleSize: async (_, { sample }) => {
      return await prisma.barangays.update({
        where: { id: sample.id },
        data: {
          sampleRate: sample.sampleRate,
          sampleSize: sample.sampleSize,
          population: sample.population,
          activeSurveyor: sample.activeSurveyor,
          femaleSize: sample.femaleSize,
          maleSize: sample.maleSize,
          surveyor: sample.surveyor,
        },
      });
    },
    createMedia: async (_, { media }) => {
      return prisma.mediaUrl.create({
        data: { filename: media.filename, size: media.size, url: media.url },
      });
    },
    createOptionWithMedia: async (_, { media, option }) => {
      let mediaUrlId = null;

      const createdOption = await prisma.option.create({
        data: {
          title: option.title,
          desc: option.desc,
          queryId: option.queryId,
          onExit: option.onExit,
          onTop: option.onTop,
        },
      });

      if (media) {
        const createdMedia = await prisma.mediaUrl.create({
          data: {
            filename: media.filename,
            size: media.size,
            url: media.url,
            surveyId: media.surveyId,
            optionId: createdOption.id,
          },
        });
        mediaUrlId = createdMedia.id;
      }

      return createdOption;
    },
    surveyConclude: async (_, { id }) => {
      return await prisma.survey.update({
        where: { id: id },
        data: { status: "Concluded" },
      });
    },
    deleteSurvey: async (_, { id }) => {
      return await prisma.survey.delete({ where: { id } });
    },
    createRespondentResponse: async (_, { respondentResponse }) => {
      return await prisma.respondentResponse.create({
        data: {
          id: respondentResponse.id,
          ageBracketId: respondentResponse.ageBracketId,
          genderId: respondentResponse.genderId,
          barangaysId: respondentResponse.barangaysId,
          municipalsId: respondentResponse.municipalsId,
          surveyId: respondentResponse.surveyId,
          surveyResponseId: respondentResponse.id,
        },
      });
    },
    addSurveyResponse: async (_, { surveyResponse }) => {
      return await prisma.surveyResponse.create({
        data: {
          id: surveyResponse.id,
          municipalsId: surveyResponse.municipalsId,
          barangaysId: surveyResponse.barangaysId,
          surveyId: surveyResponse.surveyId,
        },
      });
    },
    addResponse: async (_, { response }) => {
      return await prisma.response.create({
        data: {
          id: response.id,
          ageBracketId: response.ageBracketId,
          genderId: response.genderId,
          barangaysId: response.barangaysId,
          municipalsId: response.municipalsId,
          surveyId: response.surveyId,
          surveyResponseId: response.id,
          optionId: response.optionId,
          queryId: response.queryId,
          respondentResponseId: response.respondentResponseId,
        },
      });
    },
    submitResponse: async (
      _,
      { respondentResponse, response, surveyResponse }
    ) => {
      return await prisma.$transaction(async (prisma) => {
        const checkSurvey = await prisma.survey.findUnique({
          where: { id: surveyResponse.surveyId },
        });
        if (checkSurvey?.status !== "Ongoing") {
          throw new GraphQLError("The survey is currently closed or paused.");
        }
        const surveyResponsed = await prisma.surveyResponse.create({
          data: {
            id: surveyResponse.id,
            municipalsId: surveyResponse.municipalsId,
            barangaysId: surveyResponse.barangaysId,
            surveyId: surveyResponse.surveyId,
          },
        });

        for (const res of respondentResponse) {
          const existingRespondent = await prisma.respondentResponse.findUnique(
            {
              where: { id: res.id }, // Assuming 'id' is unique for each respondent
            }
          );
          if (!existingRespondent) {
            await prisma.respondentResponse.create({
              data: {
                id: res.id,
                ageBracketId: res.ageBracketId,
                genderId: res.genderId,
                barangaysId: res.barangaysId,
                municipalsId: res.municipalsId,
                surveyId: res.surveyId,
                surveyResponseId: surveyResponsed.id,
              },
            });
          }
        }

        // Check and create response data if not already present
        for (const res of response) {
          const existingResponse = await prisma.response.findUnique({
            where: { id: res.id }, // Assuming 'id' is unique for each response
          });
          if (!existingResponse) {
            await prisma.response.create({
              data: {
                id: res.id,
                ageBracketId: res.ageBracketId,
                genderId: res.genderId,
                barangaysId: res.barangaysId,
                municipalsId: res.municipalsId,
                surveyId: res.surveyId,
                surveyResponseId: surveyResponsed.id,
                optionId: res.optionId,
                queryId: res.queryId,
                respondentResponseId: res.respondentResponseId,
              },
            });
          }
        }

        return surveyResponsed;
      });
    },

    updateSurveyor: async (_, { id }) => {
      const checked = await prisma.barangays.findUnique({
        where: { id },
      });
      if (checked && checked.activeSurveyor === checked.surveyor) {
        throw new GraphQLError(`${checked.name} surveyor limit reached.`);
      }
      return await prisma.barangays.update({
        where: { id },
        data: { activeSurveyor: (checked?.activeSurveyor as number) + 1 },
      });
    },
    resetSurveyor: async (_, { id }) => {
      await prisma.barangays.updateMany({
        where: { municipalId: id },
        data: { surveyor: 0, activeSurveyor: 0 },
      });
      return await prisma.barangays.findMany({
        where: { municipalId: id },
      });
    },
    resetBarangayQuota: async (_, { id }) => {
      await prisma.quota.deleteMany({ where: { barangaysId: id } });
      return await prisma.quota.findMany({ where: { barangaysId: id } });
    },
    resetActiveSurvey: async (_, { id }) => {
      return await prisma.barangays.update({
        where: { id },
        data: { activeSurveyor: 0 },
      });
    },
    removeQuota: async (_, { id }) => {
      return await prisma.quota.delete({ where: { id } });
    },
    adminLogin: async (_, { user }) => {
      const secretToken = process.env.JWT_SECRECT_TOKEN;

      if (!secretToken) {
        throw new Error("JWT secret token is not defined");
      }

      const adminUser = await prisma.adminUser.findFirst({
        where: { phoneNumber: user.phoneNumber },
      });

      if (!adminUser) {
        throw new GraphQLError("Phone number not found!", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isPasswordValid = await argon2.verify(
        adminUser.password,
        user.password
      );
      if (!isPasswordValid) {
        throw new GraphQLError("Incorrect password", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const accessToken = jwt.sign(
        { user: adminUser.phoneNumber },
        secretToken,
        { expiresIn: "8h" }
      );

      const { phoneNumber, lastname, firstname, uid } = adminUser;

      return { phoneNumber, lastname, firstname, uid, accessToken };
    },
    createQuota: async (_, { quota, gender }) => {
      const quotaData = await prisma.quota.create({
        data: {
          ageBracketId: quota.ageBracketId,
          barangaysId: quota.barangayId,
        },
      });

      await prisma.genderSize.create({
        data: {
          genderId: gender.genderId,
          size: gender.size,
          quotaId: quotaData.id,
        },
      });
      return quotaData;
    },
    createGenderQuota: async (_, { quota }) => {
      const checked = await prisma.genderSize.findFirst({
        where: {
          quotaId: quota.quotaId,
          genderId: quota.genderId,
        },
      });
      if (checked) {
        throw new GraphQLError("Gender already existed in this quota", {
          extensions: { code: "EXISTED" },
        });
      }
      return await prisma.genderSize.create({
        data: {
          genderId: quota.genderId,
          size: quota.size,
          quotaId: quota.quotaId,
        },
      });
    },
    removeGenderQuota: async (_, { id }) => {
      return await prisma.genderSize.delete({
        where: { id },
      });
    },
    removeQuery: async (_, { id }) => {
      return await prisma.queries.delete({ where: { id } });
    },
    removeBarangay: async (_, { id }) => {
      return await prisma.barangays.delete({
        where: { id },
      });
    },
    updateQuery: async (_, { id, value }) => {
      return await prisma.queries.update({
        where: { id },
        data: { queries: value },
      });
    },
    updateQueryType: async (_, { id, type }) => {
      return await prisma.queries.update({
        where: { id },
        data: { type: type },
      });
    },
    updateOptionTop: async (_, { id, value }) => {
      return await prisma.option.update({
        where: { id },
        data: { onTop: value },
      });
    },
    resetSurveyResponse: async (_, { id, zipCode }) => {
      const result = await prisma.surveyResponse.deleteMany({
        where: { surveyId: id, municipalsId: zipCode },
      });
      return result;
    },
    removeResponse: async (_, { id }) => {
      return await prisma.respondentResponse.delete({ where: { id } });
    },
    changeQueryOnTop: async (_, { id, value }) => {
      return await prisma.queries.update({
        where: { id },
        data: { onTop: value },
      });
    },
    updateQueryAccess: async (_, { id }) => {
      const query = await prisma.queries.findUnique({ where: { id } });
      return await prisma.queries.update({
        where: {
          id,
        },
        data: {
          access: query?.access === "regular" ? "admin" : "regular",
        },
      });
    },
    optionForAll: async (_, { id, value }) => {
      return await prisma.option.update({
        where: { id },
        data: { forAll: value },
      });
    },
    discardDraftedVoter: async (_, { id }) => {
      await prisma.voters.deleteMany({
        where: {
          newBatchDraftId: id,
        },
      });
      return "OK";
    },
    saveDraftedVoter: async (_, { batchId }) => {
      const updatedBatch = await prisma.newBatchDraft.update({
        where: {
          id: batchId,
        },
        data: {
          drafted: false,
        },
      });
      await prisma.voters.updateMany({
        where: {
          newBatchDraftId: batchId,
        },
        data: {
          saveStatus: "listed",
        },
      });
      return updatedBatch;
    },
    removeVoter: async (_, { id }) => {
      await prisma.voters.delete({
        where: {
          id,
        },
      });
      return "OK";
    },
    removeMultiVoter: async (_, { list }) => {
      for (let item of list) {
        try {
          await prisma.voters.delete({
            where: {
              id: item,
            },
          });
        } catch (error) {
          console.log(error);

          continue;
        }
      }
      return "OK";
    },
    setVoterLevel: async (_, { id, level, code }) => {
      console.log(id, level, code);

      const voter = await prisma.voters.findUnique({
        where: {
          id,
        },
      });
      const candidate = await prisma.candidates.findFirst({
        where: {
          code: {
            equals: code.trim(),
            mode: "insensitive",
          },
        },
      });
      if (!candidate) {
        throw new GraphQLError("Code not found", {
          extensions: {
            code: "UNFOUND",
          },
        });
      }

      if (!voter) {
        throw new GraphQLError("Couldn't update, voter not found", {
          extensions: { code: 500 },
        });
      }
      if (voter.level === 3) {
        throw new GraphQLError("Already enlisted as Barangay Coor.", {
          extensions: { code: 500 },
        });
      }

      const leadr = await prisma.teamLeader.create({
        data: {
          hubId: "none",
          votersId: id,
          municipalsId: voter.municipalsId,
          barangaysId: voter.barangaysId,
          candidatesId: candidate.id,
          purokId: voter.purokId as string,
          level,
        },
      });

      const team = await prisma.team.create({
        data: {
          teamLeaderId: leadr.id,
          candidatesId: candidate.id,
          purokId: voter.purokId as string,
          municipalsId: voter.municipalsId,
          barangaysId: voter.barangaysId,
          level: level,
        },
      });

      await prisma.teamLeader.update({
        where: { id: leadr.id },
        data: {
          teamId: team.id,
        },
      });

      await prisma.voters.update({
        where: {
          id,
        },
        data: {
          level,
          candidatesId: candidate.id,
          teamId: team.id,
        },
      });

      return "OK";
    },
    addTeam: async (_, { headId, teamIdList, level }) => {
      const rejectList: RejectListProps[] = [];

      const headerData = await prisma.voters.findUnique({
        where: {
          id: headId,
        },
      });

      if (!headerData) {
        throw new GraphQLError("Head person unfound.", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      if (headerData.level !== level + 1) {
        throw new GraphQLError("Head person unqualified.", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      const votersData = await prisma.voters.findMany({
        where: {
          id: { in: teamIdList.map((member) => member.id) },
        },
      });

      const teamVoterCount = await prisma.team.findFirst({
        where: { teamLeaderId: headId },
        select: {
          _count: { select: { voters: true } },
          id: true,
        },
      });

      if (level === 0 && (teamVoterCount?._count.voters as number) >= 10) {
        throw new GraphQLError("Limit reached", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      const purokCoorTeam = await prisma.purokCoor.findFirst({
        where: { votersId: headId },
        select: {
          _count: { select: { TeamLeader: true } },
          id: true,
        },
      });

      if (level === 1 && (purokCoorTeam?._count.TeamLeader as number) >= 10) {
        throw new GraphQLError("Limit reached", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      await Promise.all(
        teamIdList.map(async (member) => {
          const voter = votersData.find((v) => v.id === member.id);

          if (!voter) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Not found in master list",
              teamId: member.teamId,
              code: 0,
            });
            return;
          }
          if (voter.barangaysId !== headerData.barangaysId) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Makaibang Baranggay sa Leader",
              teamId: member.teamId,
              code: 0,
            });
            return;
          }

          // Check for status
          if (voter.status === 0) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Sumaka-bilang buhay na.",
              teamId: member.teamId,
              code: 11,
            });
            return;
          }

          if (voter.oor === "YES") {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Wala sa nasabing ankop na lugar.",
              teamId: member.teamId,
              code: 11,
            });
            return;
          }

          if (voter.level === 3) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Nakalista na, bilang isang Barangay Coor.",
              teamId: member.teamId,
              code: 3,
            });
            return;
          }

          if (voter.level === 2) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Nakalista na, bilang isang Purok Coor.",
              teamId: member.teamId,
              code: 2,
            });
            return;
          }

          if (voter.level === 1) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Nakalista na, bilang isang Team Leader.",
              teamId: member.teamId,
              code: 1,
            });
            return;
          }

          rejectList.push({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            municipal: member.municipalsId,
            barangay: member.barangaysId,
            reason: "OK",
            teamId: member.teamId,
            code: 100,
          });
          //TL voters
          if (level === 0) {
            if (voter.teamId) {
              rejectList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipal: voter.municipalsId,
                barangay: voter.barangaysId,
                reason: "Meron ng team (Dala na ng ibang team leader)",
                teamId: voter.teamId,
                code: 13,
              });
              return;
            }

            const teamLeader = await prisma.teamLeader.findFirst({
              where: {
                voterId: headId,
              },
            });

            if (!teamLeader) {
              throw new GraphQLError("Team Leader not found");
            }

            const team = await prisma.team.findFirst({
              where: {
                teamLeaderId: teamLeader.id,
              },
            });

            if (!team) {
              throw new GraphQLError("No team found with selected leader");
            }
            await prisma.voters.update({
              where: { id: member.id },
              data: {
                level,
                teamId: team.id,
                candidatesId: headerData.candidatesId,
              },
            });
            return;
          }
          //Team Leader
          if (level === 1) {
            const teamLeader = await prisma.teamLeader.create({
              data: {
                votersId: member.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                handle: 10,
                hubId: "Unknown",
                level: 1,
                candidatesId: headerData.candidatesId,
              },
            });
            const team = await prisma.team.create({
              data: {
                teamLeaderId: teamLeader.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                candidatesId: headerData.candidatesId,
                level: 1,
              },
            });
            await prisma.teamLeader.update({
              where: { id: teamLeader.id },
              data: { teamId: team.id },
            });
            await prisma.voters.update({
              where: { id: voter.id },
              data: {
                level: 1,
                teamId: team.id,
                candidatesId: headerData.candidatesId,
              },
            });
            return;
          }

          // If adding as Purok Coordinator
          if (level === 2) {
            console.log("Member: ", member);

            const teamLeader = await prisma.teamLeader.create({
              data: {
                votersId: member.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                handle: 10,
                hubId: "Unknown",
                level,
              },
            });
            if (!teamLeader) return;
            console.log("Team leader creared: ", teamLeader);

            const team = await prisma.team.create({
              data: {
                teamLeaderId: teamLeader.id,
                municipalsId: teamLeader.municipalsId,
                barangaysId: teamLeader.barangaysId,
                purokId: teamLeader.purokId as string,
                candidatesId: headerData.candidatesId,
                level,
              },
            });
            console.log("Team Created: ", team);

            await prisma.teamLeader.update({
              where: { id: teamLeader.id },
              data: { teamId: team.id },
            });
            await prisma.voters.update({
              where: { id: voter.id },
              data: {
                level,
                teamId: team.id,
                candidatesId: headerData.candidatesId,
              },
            });

            return;
          }
        })
      );

      return JSON.stringify(rejectList);
    },
    addMember: async (_, { headId, teamIdList, level, teamId }) => {
      const rejectList: RejectListProps[] = [];

      const headerData = await prisma.voters.findUnique({
        where: {
          id: headId,
        },
      });

      if (!headerData) {
        throw new GraphQLError("Head person unfound.", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      if (headerData.level !== level + 1) {
        throw new GraphQLError("Head person unqualified.", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      const votersData = await prisma.voters.findMany({
        where: {
          id: { in: teamIdList.map((member) => member.id) },
        },
      });

      const teamVoterCount = await prisma.team.findFirst({
        where: { teamLeaderId: headId },
        select: {
          _count: { select: { voters: true } },
          id: true,
        },
      });

      if (level === 0 && (teamVoterCount?._count.voters as number) >= 10) {
        throw new GraphQLError("Limit reached", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      const purokCoorTeam = await prisma.purokCoor.findFirst({
        where: { votersId: headId },
        select: {
          _count: { select: { TeamLeader: true } },
          id: true,
        },
      });

      if (level === 1 && (purokCoorTeam?._count.TeamLeader as number) >= 10) {
        throw new GraphQLError("Limit reached", {
          extensions: { code: "REQUEST_ERROR" },
        });
      }

      await Promise.all(
        teamIdList.map(async (member) => {
          const voter = votersData.find((v) => v.id === member.id);

          if (!voter) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Not found in master list",
              teamId: member.teamId,
              code: 0,
            });
            return;
          }
          if (voter.barangaysId !== headerData.barangaysId) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Makaibang Baranggay sa Leader",
              teamId: member.teamId,
              code: 0,
            });
            return;
          }

          // Check for status
          if (voter.status === 0) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Sumaka-bilang buhay na.",
              teamId: member.teamId,
              code: 11,
            });
            return;
          }

          if (voter.oor === "YES") {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Wala sa nasabing ankop na lugar.",
              teamId: member.teamId,
              code: 11,
            });
            return;
          }

          if (voter.level === 3) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Nakalista na, bilang isang Barangay Coor.",
              teamId: member.teamId,
              code: 3,
            });
            return;
          }

          if (voter.level === 2) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Nakalista na, bilang isang Purok Coor.",
              teamId: member.teamId,
              code: 2,
            });
            return;
          }

          if (voter.level === 1) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: "Nakalista na, bilang isang Team Leader.",
              teamId: member.teamId,
              code: 1,
            });
            return;
          }

          rejectList.push({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            municipal: member.municipalsId,
            barangay: member.barangaysId,
            reason: "OK",
            teamId: member.teamId,
            code: 100,
          });
          //TL voters
          if (level === 0) {
            if (voter.teamId) {
              rejectList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipal: voter.municipalsId,
                barangay: voter.barangaysId,
                reason: "Meron ng team (Dala na ng ibang team leader)",
                teamId: voter.teamId,
                code: 13,
              });
              return;
            }

            const team = await prisma.team.findFirst({
              where: {
                id: teamId,
              },
            });

            if (!team) {
              throw new GraphQLError("No team found with selected leader");
            }
            await prisma.voters.update({
              where: { id: member.id },
              data: {
                level,
                teamId: team.id,
                candidatesId: headerData.candidatesId,
              },
            });
            return;
          }
          //Team Leader
          if (level === 1) {
            const teamLeader = await prisma.teamLeader.create({
              data: {
                votersId: member.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                handle: 10,
                hubId: "Unknown",
                level: 1,
                candidatesId: headerData.candidatesId,
              },
            });
            const team = await prisma.team.create({
              data: {
                teamLeaderId: teamLeader.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                candidatesId: headerData.candidatesId,
                level: 1,
              },
            });
            await prisma.teamLeader.update({
              where: { id: teamLeader.id },
              data: { teamId: team.id },
            });
            await prisma.voters.update({
              where: { id: voter.id },
              data: {
                level: 1,
                teamId: teamId,
                candidatesId: headerData.candidatesId,
              },
            });
            return;
          }

          // If adding as Purok Coordinator
          if (level === 2) {
            console.log("Member: ", member);

            const teamLeader = await prisma.teamLeader.create({
              data: {
                votersId: member.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                handle: 10,
                hubId: "Unknown",
                level,
                teamId,
              },
            });
            if (!teamLeader) return;
            const team = await prisma.team.create({
              data: {
                teamLeaderId: teamLeader.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                candidatesId: headerData.candidatesId,
                level: 2,
              },
            });
            await prisma.teamLeader.update({
              where: { id: teamLeader.id },
              data: { teamId: team.id },
            });
            await prisma.voters.update({
              where: { id: voter.id },
              data: {
                level,
                teamId: teamId,
                candidatesId: headerData.candidatesId,
              },
            });

            return;
          }
        })
      );

      return JSON.stringify(rejectList);
    },
    removeVotersArea: async (_, { zipCode, barangayId, purokId }) => {
      if (purokId && purokId !== "all") {
        await prisma.voters.deleteMany({
          where: {
            purokId,
          },
        });
      } else if (barangayId && barangayId !== "all") {
        await prisma.voters.deleteMany({
          where: {
            barangaysId: barangayId,
          },
        });
      } else if (zipCode && zipCode !== "all") {
        await prisma.voters.deleteMany({
          where: {
            municipalsId: parseInt(zipCode, 10),
          },
        });
      } else {
        await prisma.voters.deleteMany();
      }
      return "OK";
    },
    genderBundleQrCode: async (_, { idList }) => {
      const rejectList: RejectListProps[] = [];
      for (let item of idList) {
        try {
          const voter = await prisma.voters.findUnique({ where: { id: item } });
          if (voter?.qrCode !== "None") {
            rejectList.push({
              id: item,
              firstname: "Not Found",
              lastname: "Not Found",
              municipal: 0,
              barangay: "Not Found",
              reason: "QR code already generated.",
              teamId: null,
              code: 1,
            });
            continue;
          }
          if (!voter) {
            rejectList.push({
              id: item,
              firstname: "Not Found",
              lastname: "Not Found",
              municipal: 0,
              barangay: "Not Found",
              reason: "Voter not found",
              teamId: null,
              code: 1,
            });
            continue;
          }
          const generatedCode = await qrcode.toDataURL(item);

          const stampOne = await prisma.qRcode.create({
            data: {
              qrCode: generatedCode,
              votersId: item,
              stamp: 1,
            },
          });
          await prisma.qRcode.create({
            data: {
              qrCode: generatedCode,
              votersId: item,
              stamp: 2,
              number: stampOne.number,
            },
          });
        } catch (error) {
          continue;
        }
      }
      return JSON.stringify(rejectList);
    },
    generatedTeamQRCode: async (_, { teamId }) => {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });
      if (!team) {
        throw new GraphQLError("Couldn't find team");
      }
      const teamMembers = await prisma.voters.findMany({
        where: {
          teamId,
        },
      });
      if (teamMembers.length === 0) {
        throw new GraphQLError("NO team members were found");
      }
      for (const voter of teamMembers) {
        try {
          if (voter.qrCodeNumber) {
            continue;
          }
          const generatedCode = await qrcode.toDataURL(voter.id);
          if (!generatedCode) {
            continue;
          }

          const stampOne = await prisma.qRcode.create({
            data: {
              qrCode: generatedCode,
              votersId: voter.id,
              stamp: 1,
            },
          });
          await prisma.qRcode.create({
            data: {
              qrCode: generatedCode,
              votersId: voter.id,
              stamp: 2,
              number: stampOne.number,
            },
          });
          await prisma.voters.update({
            where: { id: voter.id },
            data: {
              qrCode: generatedCode,
              qrCodeNumber: stampOne.number,
            },
          });
        } catch (error) {
          console.log(error);
          continue;
        }
      }
      return "OK";
    },
    removeQRcode: async (_, { id }) => {
      await prisma.voters.updateMany({
        where: {
          id: { in: id.map((item) => item) },
        },
        data: {
          qrCode: "None",
          qrCodeNumber: 0,
        },
      });

      await prisma.qRcode.deleteMany({
        where: {
          votersId: { in: id.map((item) => item) },
        },
      });
      return "OK";
    },
    createPostion: async (_, { title }) => {
      const position: Position | null = await prisma.position.findFirst({
        where: {
          title,
        },
      });
      if (position && position.title.toLowerCase() === title.toLowerCase()) {
        throw new GraphQLError("Position already exist.");
      }
      await prisma.position.create({
        data: {
          title,
        },
      });
      return "OK";
    },
    addNewCandidate: async (
      _: unknown,
      { firstname, lastname, code, colorCode }
    ) => {
      const candidate: Candidates | null = await prisma.candidates.findFirst({
        where: {
          lastname,
          firstname,
        },
      });

      if (candidate) {
        if (candidate.code === code) {
          throw new GraphQLError("Candidate code already used", {
            extensions: { code: "CODE_EXIST" },
          });
        }
        if (candidate.colorCode === colorCode) {
          throw new GraphQLError("Candidate color code already used", {
            extensions: { code: "COLOR_CODE_EXIST" },
          });
        }

        throw new GraphQLError("Candidate already exists", {
          extensions: { code: "EXISTED_NAME" },
        });
      }

      await prisma.candidates.create({
        data: {
          firstname,
          lastname,
          code,
          candidateBatchId: "none",
          colorCode,
        },
      });

      return "OK";
    },
    updateLeader: async (_, { teamId, id, level, method }) => {
      if (method === 0) {
        await prisma.team.update({
          where: {
            id: teamId,
            teamLeaderId: id,
          },
          data: {
            teamLeaderId: undefined,
          },
        });
        await prisma.teamLeader.delete({
          where: {
            id,
          },
        });
      }
      if (method === 1) {
      }

      return "OK";
    },
    changeLeader: async (_, { id, teamId, level }) => {
      const data = await prisma.voters.findUnique({
        where: { id },
      });
      if (!data) {
        throw new GraphQLError("Voter not found", {
          extensions: { code: "VOTER_NOT_FOUND" },
        });
      }
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });
      if (!team) {
        throw new GraphQLError("Team not found");
      }
      const teamLeader = await prisma.teamLeader.create({
        data: {
          votersId: data.id,
          municipalsId: data.municipalsId,
          barangaysId: data.barangaysId,
          purokId: data.purokId as string,
          handle: 10,
          hubId: "Unknown",
          level: 1,
          candidatesId: team.candidatesId,
        },
      });
      const newteam = await prisma.team.update({
        where: { id: teamId },
        data: {
          teamLeaderId: teamLeader.id,
        },
      });
      await prisma.voters.update({
        where: {
          id,
        },
        data: {
          teamId: newteam.id,
          candidatesId: team.candidatesId,
        },
      });
      return "OK";
    },
    deleteTeams: async () => {
      await prisma.qRcode.deleteMany();
      await prisma.team.deleteMany();
      return "OK";
    },
    assignBarangayIDnumber: async (_, { zipCode }) => {
      const barangays = await prisma.barangays.findMany({
        where: {
          municipalId: zipCode,
        },
        orderBy: {
          name: "asc",
        },
      });

      const updates = barangays.map((barangay, index) => {
        return prisma.barangays.update({
          where: {
            id: barangay.id,
          },
          data: {
            number: index + 1,
          },
        });
      });

      await Promise.all(updates);

      return "OK";
    },
    assignTeam: async (_, { team }) => {
      const resultList: RejectListedProps[] = [];
      const members = [
        ...team.members,
        team.barangayCoorId,
        team.purokCoorId,
        team.teamLeaderId,
      ];

      const barangay = await prisma.barangays.findFirst({
        where: {
          number: parseInt(team.barangayId, 10),
        },
      });

      if (!barangay) {
        throw new GraphQLError("Barangay not found");
      }

      const supporting = await prisma.candidates.findFirst({
        where: {
          code: { contains: "jml", mode: "insensitive" },
        },
      });

      const handleLeaderData = (idNumber: string, level: number) => {
        return membersList.find((item) => item.idNumber === idNumber);
      };

      const membersList = await prisma.voters.findMany({
        where: {
          idNumber: { in: members },
          municipalsId: team.zipCode,
          barangay: {
            number: parseInt(team.barangayId, 10),
          },
        },
      });

      const barangayCoor = handleLeaderData(team.barangayCoorId, 3);
      const purokCoor = handleLeaderData(team.purokCoorId, 2);
      const teamLeader = handleLeaderData(team.teamLeaderId, 1);

      const handleLeaderInfo = async (
        id: string,
        level: number,
        teamId?: string,
        purokId?: string,
        voterId?: string
      ) => {
        console.log("Params: ", { id, level, teamId, purokId });
        console.log("Supporting: ", supporting?.code);

        const leader = await prisma.teamLeader.findFirst({
          where: {
            voter: {
              idNumber: id,
              municipalsId: team.zipCode,
              barangay: {
                number: parseInt(team.barangayId, 10),
              },
            },
          },
        });

        if (!leader) {
          const teamData = await prisma.team.create({
            data: {
              municipalsId: team.zipCode,
              barangaysId: barangay.id,
              purokId: purokId ? purokId : (barangayCoor?.purokId as string),
              level,
            },
          });

          const leaderMetaData = await prisma.teamLeader.create({
            data: {
              votersId: voterId,
              municipalsId: team.zipCode,
              barangaysId: barangay.id,
              purokId: purokId ? purokId : (barangayCoor?.purokId as string),
              handle: 0,
              hubId: "Unknown",
              level,
              candidatesId: supporting?.id,
              teamId: teamData.id,
            },
          });
          console.log("Created Leader: ", leaderMetaData);

          await prisma.team.update({
            where: {
              id: teamData.id,
            },
            data: {
              teamLeaderId: leaderMetaData.id,
            },
          });
          console.log("Created Team: ", teamData);

          const updatedVoter = await prisma.voters.update({
            where: {
              id: voterId,
            },
            data: {
              teamId,
              level,
              candidatesId: supporting?.id,
            },
          });

          console.log("Updated Voter: ", updatedVoter);
        }

        return leader;
      };

      if (!teamLeader) {
        resultList.push({
          id: "Unknown",
          firstname: "Unknown",
          lastname: "Unknown",
          municipalsId: 1111,
          barangaysId: "Unknown",
          reason: "Wala sa Master list",
          level: 1,
          idNumber: team.teamLeaderId,
          code: 1,
        });
      }

      if (!purokCoor) {
        resultList.push({
          id: "Unknown",
          firstname: "Unknown",
          lastname: "Unknown",
          municipalsId: 1111,
          barangaysId: "Unknown",
          reason: "Wala sa Master list",
          level: 2,
          idNumber: team.purokCoorId,
          code: 1,
        });
      }

      if (!barangayCoor) {
        resultList.push({
          id: "Unknown",
          firstname: "Unknown",
          lastname: "Unknown",
          municipalsId: team.zipCode,
          barangaysId: team.barangayId,
          reason: "Wala sa Master list",
          level: 3,
          idNumber: team.barangayCoorId,
          code: 1,
        });
      }

      const barangayCoorData = await handleLeaderInfo(
        team.barangayCoorId,
        3,
        undefined,
        barangayCoor?.purokId as string,
        barangayCoor?.id
      );
      const purokCoorData = await handleLeaderInfo(
        team.purokCoorId,
        2,
        barangayCoorData?.teamId as string,
        purokCoor?.purokId as string,
        purokCoor?.id
      );
      const teamLeaderData = await handleLeaderInfo(
        team.teamLeaderId,
        1,
        purokCoorData?.teamId as string,
        purokCoorData?.purokId,
        teamLeader?.id
      );

      console.log("Headers: ", {
        teamLeaderData,
        purokCoorData,
        barangayCoorData,
      });

      const temp = await prisma.validatedTeams.create({
        data: {
          purokId: purokCoor?.purokId as string,
          barangaysId: barangay.id,
          municipalsId: team.zipCode,
          teamLeaderId: teamLeaderData?.id,
        },
      });

      for (const member of membersList) {
        try {
          if (member.barangaysId !== barangay.id) {
            resultList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipalsId: member.municipalsId,
              barangaysId: member.barangaysId,
              reason: "Wala sa angkop na lugar.",
              level: member.level,
              idNumber: member.idNumber,
              code: 1,
            });
            continue;
          }
          if (member.level > 0) {
            resultList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipalsId: member.municipalsId,
              barangaysId: member.barangaysId,
              reason: `May katayuan na (${handleLevel(member.level)})`,
              level: member.level,
              idNumber: member.idNumber,
              code: 1,
            });
            continue;
          }

          if (member.teamId) {
            resultList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipalsId: member.municipalsId,
              barangaysId: member.barangaysId,
              reason: "May team na",
              level: member.level,
              idNumber: member.idNumber,
              code: 1,
            });
            continue;
          }

          if (member.oor === "YES") {
            resultList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipalsId: member.municipalsId,
              barangaysId: member.barangaysId,
              reason: "Wala sa ankop na lugar.",
              level: member.level,
              idNumber: member.idNumber,
              code: 1,
            });
            continue;
          }

          if (member.status === 0) {
            resultList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipalsId: member.municipalsId,
              barangaysId: member.barangaysId,
              reason: "Sumakabilang buhay na.",
              level: member.level,
              idNumber: member.idNumber,
              code: 1,
            });
            continue;
          }

          resultList.push({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            municipalsId: member.municipalsId,
            barangaysId: member.barangaysId,
            reason: "OK",
            level: member.level,
            idNumber: member.idNumber,
            code: 0,
          });

          await prisma.voters.update({
            where: { id: member.id },
            data: {
              teamId: teamLeaderData?.teamId,
              candidatesId: teamLeaderData?.candidatesId,
              level: 0,
            },
          });
        } catch (error) {
          console.error(error);
          continue;
        }
      }
      const teamMembers: ValidatedTeamMembers[] = resultList.map((item) => {
        return {
          idNumber: item.idNumber as string,
          votersId: item.id,
          barangayId: item.barangaysId,
          municipalsId: item.municipalsId,
          purokId: (teamLeaderData?.purokId as string) ?? purokCoor?.purokId,
          teamLeaderId: teamLeaderData?.id as string,
          validatedTeamsId: temp.id,
          remark: item.reason,
        };
      });

      console.log("resultLIst", teamMembers);

      await prisma.validatedTeamMembers.createMany({
        data: teamMembers,
        skipDuplicates: true,
      });

      return JSON.stringify(teamMembers);
    },
    composeTeam: async (_, { team }) => {
      console.log({ team });

      const resultList: RejectListedProps[] = [];
      const members = [
        team.barangayCoorId,
        team.purokCoorId,
        team.teamLeaderId,
      ];

      const barangay = await prisma.barangays.findFirst({
        where: {
          number: parseInt(team.barangayId, 10),
          municipalId: team.zipCode,
        },
      });
      if (!barangay) {
        throw new GraphQLError(`Could not find Barangay`);
      }

      const supporting = await prisma.candidates.findFirst({
        where: {
          code: { contains: "jml", mode: "insensitive" },
        },
      });

      const membersData = await prisma.voters.findMany({
        where: {
          idNumber: { in: members },
          municipalsId: team.zipCode,
          barangay: {
            number: parseInt(team.barangayId, 10),
          },
        },
      });

      const handleGetInitInfo = (id: string) => {
        return membersData.find((item) => item.idNumber === id);
      };

      const barangayCoor = handleGetInitInfo(team.barangayCoorId);
      const purokCoor = handleGetInitInfo(team.purokCoorId);
      const teamLeader = handleGetInitInfo(team.teamLeaderId);

      const handleGetLeaderData = async (
        id: string,
        level: number,
        voterId: string,
        purokId: string,
        teamId?: string,
        headIdOne?: string,
        headIdTwo?: string
      ) => {
        try {
          console.log(
            "Params: ",
            teamId,
            purokId,
            voterId,
            headIdOne,
            headIdTwo
          );

          // Find existing leader
          const leader = await prisma.teamLeader.findFirst({
            where: {
              voter: {
                idNumber: id,
              },
              municipalsId: team.zipCode,
              barangaysId: barangay.id,
            },
          });

          if (leader) {
            return { ...leader, teamId: leader.teamId };
          }

          // Create a new leader
          const newLeader = await prisma.teamLeader.create({
            data: {
              votersId: voterId,
              municipalsId: team.zipCode,
              barangaysId: barangay.id,
              teamId: null, // Initially null, will be updated later
              candidatesId: supporting?.id,
              level,
              hubId: "unknown",
              handle: 0,
              purokId: purokId,
              barangayCoorId: level === 2 || level === 1 ? headIdOne : null,
              purokCoorsId: level === 1 ? headIdTwo : null,
            },
          });

          // Create a new team and assign the leader
          const newTeam = await prisma.team.create({
            data: {
              barangaysId: barangay.id,
              municipalsId: team.zipCode,
              teamLeaderId: newLeader.id,
              candidatesId: supporting?.id,
              hubId: null,
              level,
            },
          });

          // Update the teamId for the new leader
          await prisma.teamLeader.update({
            where: { id: newLeader.id },
            data: {
              teamId: newTeam.id,
            },
          });

          const updatedVoter = await prisma.voters.update({
            where: {
              id: voterId,
            },
            data: {
              teamId: teamId,
              level,
              candidatesId: supporting?.id,
            },
          });

          console.log("New leader created:", level, newLeader);
          console.log("Updated voter record:", level, updatedVoter);

          return { ...newLeader, teamId: newTeam.id };
        } catch (error) {
          console.error("Something went wrong:", error);
          return null;
        }
      };

      const barangayCoorData = await handleGetLeaderData(
        team.barangayCoorId,
        3,
        barangayCoor?.id as string,
        barangayCoor?.purokId as string,
        undefined,
        undefined
      );

      const purokCoorData = await handleGetLeaderData(
        team.purokCoorId,
        2,
        purokCoor?.id as string,
        purokCoor?.purokId as string,
        barangayCoorData?.teamId as string,
        barangayCoorData?.id
      );

      const teamLeaderData = await handleGetLeaderData(
        team.teamLeaderId,
        1,
        teamLeader?.id as string,
        teamLeader?.purokId as string,
        purokCoorData?.teamId as string,
        barangayCoorData?.id,
        purokCoorData?.id
      );

      const temp = await prisma.validatedTeams.create({
        data: {
          purokId: purokCoor?.purokId as string,
          barangaysId: barangay.id,
          municipalsId: team.zipCode,
          teamLeaderId: teamLeaderData?.id,
        },
      });

      const processedVoters = new Set<string>();

      for (const member of team.members) {
        try {
          const voter = await prisma.voters.findFirst({
            where: {
              idNumber: member,
              municipalsId: team.zipCode,
              barangay: {
                number: parseInt(team.barangayId, 10),
              },
            },
          });

          let votersTeam = null;

          if (voter?.teamId) {
            votersTeam = await prisma.team.findFirst({
              where: {
                id: voter.teamId,
              },
              include: {
                TeamLeader: {
                  select: {
                    id: true,
                    teamId: true,
                    voter: {
                      select: {
                        firstname: true,
                        lastname: true,
                        level: true,
                      },
                    },
                  },
                },
              },
            });
          }

          if (!voter) {
            if (!processedVoters.has(member)) {
              resultList.push({
                id: member,
                firstname: "Unknown",
                lastname: "Unknown",
                municipalsId: team.zipCode,
                barangaysId: barangay.id,
                reason: "Wala sa master list",
                level: 0,
                idNumber: member,
                code: 1,
              });
              processedVoters.add(member);
            }
            continue;
          }

          if (voter.barangaysId !== barangay.id) {
            if (!processedVoters.has(voter.id)) {
              resultList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                reason: "Wala sa angkop na lugar.",
                level: voter.level,
                idNumber: voter.idNumber,
                code: 1,
              });
              processedVoters.add(voter.id);
            }
          }

          if (voter.level > 0) {
            if (!processedVoters.has(voter.id)) {
              resultList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                reason: `May katayuan na (${handleLevel(voter.level)})`,
                level: voter.level,
                idNumber: voter.idNumber,
                code: 1,
              });
              processedVoters.add(voter.id);
            }
          }

          if (voter.teamId) {
            if (!processedVoters.has(voter.id)) {
              resultList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                reason: `May team na (${handleLevel(
                  votersTeam?.TeamLeader?.voter?.level as number
                )}): ${votersTeam?.TeamLeader?.voter?.lastname}, ${
                  votersTeam?.TeamLeader?.voter?.firstname
                }`,
                level: voter.level,
                idNumber: voter.idNumber,
                code: 1,
              });
              processedVoters.add(voter.id);
            }
          }

          if (voter.oor === "YES") {
            if (!processedVoters.has(voter.id)) {
              resultList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                reason: "Wala sa ankop na lugar (OR).",
                level: voter.level,
                idNumber: voter.idNumber,
                code: 1,
              });
              processedVoters.add(voter.id);
            }
          }

          if (voter.status === 0) {
            if (!processedVoters.has(voter.id)) {
              resultList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                reason: "Sumakabilang buhay na.",
                level: voter.level,
                idNumber: voter.idNumber,
                code: 1,
              });
              processedVoters.add(voter.id);
            }
          }

          if (!processedVoters.has(voter.id)) {
            resultList.push({
              id: voter.id,
              firstname: voter.firstname,
              lastname: voter.lastname,
              municipalsId: voter.municipalsId,
              barangaysId: voter.barangaysId,
              reason: "OK",
              level: voter.level,
              idNumber: voter.idNumber,
              code: 0,
            });
            processedVoters.add(voter.id);
          }

          await prisma.voters.update({
            where: { id: voter.id },
            data: {
              teamId: teamLeaderData?.teamId,
              candidatesId: teamLeaderData?.candidatesId,
              level: 0,
            },
          });
        } catch (error) {
          console.error(error);
          continue;
        }
      }
      const teamMembers: ValidatedTeamMembers[] = resultList.map((item) => {
        return {
          idNumber: item.idNumber as string,
          votersId: item.id,
          barangayId: item.barangaysId,
          municipalsId: item.municipalsId,
          purokId: (teamLeaderData?.purokId as string) ?? purokCoor?.purokId,
          teamLeaderId: teamLeaderData?.id as string,
          validatedTeamsId: temp.id,
          remark: item.reason,
        };
      });

      const records: VoterRecordsProps[] = resultList
        .filter((item) => item.reason !== "OK")
        .map((item) => {
          return {
            desc: item.reason,
            votersId: item.id,
            usersUid: undefined,
            questionable: true,
          };
        });

      const totalIssues = resultList.reduce((base, item) => {
        if (item.reason !== "OK") {
          return base + 1;
        }
        return base;
      }, 0);

      await Promise.all([
        prisma.voterRecords.createMany({
          data: records,
        }),
        prisma.validatedTeams.update({
          where: {
            id: temp.id,
          },
          data: {
            issues: totalIssues,
          },
        }),
        prisma.validatedTeamMembers.createMany({
          data: teamMembers,
          skipDuplicates: true,
        }),
      ]);
      await prisma.$disconnect();
      return JSON.stringify(teamMembers);
    },
    clearTeamRecords: async () => {
      await prisma.validatedTeams.deleteMany();
      return "OK";
    },
    multiSelectVoter: async (_, { teamId, members, method }) => {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });
      console.log("team: ", team && team.level);

      if (method) {
        await prisma.voters.updateMany({
          where: { id: { in: members } },
          data: { teamId: teamId, candidatesId: team?.candidatesId, level: 0 },
        });
        return "OK";
      }

      await prisma.voters.updateMany({
        where: { id: { in: members } },
        data: { teamId: null, candidatesId: null, level: 0 },
      });

      // Delete related TeamLeader records first
      const deletedLeaders = await prisma.teamLeader.deleteMany({
        where: {
          votersId: { in: members },
        },
      });
      console.log("Deleted Leaders: ", deletedLeaders);

      // Delete team records
      const deletedTeams = await prisma.team.deleteMany({
        where: {
          TeamLeader: {
            voter: {
              id: { in: members },
            },
          },
        },
      });
      console.log("Deleted Teams: ", deletedTeams);

      return "OK";
    },
    removeTeam: async (_, { id }) => {
      await prisma.voters.updateMany({
        where: {
          teamId: id,
        },
        data: {
          teamId: null,
          candidatesId: null,
          level: 0,
        },
      });
      await prisma.teamLeader.deleteMany({
        where: {
          teamId: id,
        },
      });
      await prisma.team.delete({
        where: {
          id,
        },
      });

      return "OK";
    },
    removeAllTeams: async () => {
      await prisma.team.deleteMany();
      return "OK";
    },
    createCustomOption: async (_, { id }) => {
      await prisma.customOption.create({
        data: {
          value: "0",
          queriesId: id,
        },
      });
      return "OK";
    },
  },
  Voter: {
    votersCount: async () => {
      return await prisma.voters.count();
    },
    purok: async (parent) => {
      return prisma.purok.findUnique({
        where: {
          id: parent.purokId as string,
        },
      });
    },
    barangay: async (parent) => {
      return await prisma.barangays.findUnique({
        where: {
          id: parent.barangaysId,
        },
      });
    },
    municipal: async (parent) => {
      return await prisma.municipals.findUnique({
        where: {
          id: parent.municipalsId,
        },
      });
    },
    qrCodes: async (parent) => {
      return await prisma.qRcode.findMany({
        where: {
          votersId: parent.id,
        },
      });
    },
    leader: async (parent) => {
      return await prisma.teamLeader.findFirst({
        where: { votersId: parent.id },
      });
    },
    record: async (parent) => {
      return await prisma.voterRecords.findMany({
        where: {
          votersId: parent.id,
        },
      });
    },
  },
  Municipal: {
    barangays: async (parent) => {
      return await prisma.barangays.findMany({
        where: { municipalId: parent.id },
      });
    },
    voters: async (parent) => {
      return await prisma.voters.findMany({
        where: { municipalsId: parent.id },
      });
    },
    barangaysCount: async (parent) => {
      return await prisma.barangays.count({
        where: { municipalId: parent.id },
      });
    },
  },
  Barangay: {
    barangayVotersCount: async (parent) => {
      return await prisma.voters.count({
        where: { municipalsId: parent.municipalId, barangaysId: parent.id },
      });
    },
    purokCount: async (parent) => {
      return await prisma.purok.count({ where: { barangaysId: parent.id } });
    },
    puroks: async (parent) => {
      return await prisma.purok.findMany({ where: { barangaysId: parent.id } });
    },
    surveyResponse: async (parent, { survey }) => {
      return await prisma.surveyResponse.findMany({
        where: { municipalsId: survey.municipalsId, surveyId: survey.surveyId },
      });
    },
    surveyRespondentResponse: async (parent, { survey }) => {
      return await prisma.respondentResponse.findMany({
        where: {
          municipalsId: survey.municipalsId,
          surveyId: survey.surveyId,
          barangaysId: parent.id,
        },
      });
    },
    RespondentResponse: async (parent, { id, zipCode }) => {
      return await prisma.respondentResponse.count({
        where: {
          barangaysId: parent.id,
          surveyId: id,
          municipalsId: zipCode,
        },
      });
    },
    quota: async (parent) => {
      return await prisma.quota.findMany({
        where: { barangaysId: parent.id },
      });
    },
    quotas: async (parent) => {
      return await prisma.quota.findFirst({
        where: { barangaysId: parent.id },
      });
    },
    optionResponse: async (parent, { id, surveyId }) => {
      return await prisma.response.count({
        where: {
          barangaysId: parent.id,
          surveyId: surveyId,
          optionId: id,
        },
      });
    },
    selectedQuery: async (parent, { id }) => {
      return await prisma.option.findMany({
        where: {
          queryId: id,
        },
      });
    },
    validationList: async (parent) => {
      return await prisma.validation.findMany({
        where: {
          barangaysId: parent.id,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
    },
  },
  Purok: {
    purokDraftedVotersCount: async (parent) => {
      return await prisma.voters.count({
        where: {
          municipalsId: parent.municipalsId,
          barangaysId: parent.barangaysId,
          newBatchDraftId: parent.draftID,
          purokId: parent.id,
          saveStatus: "drafted",
        },
      });
    },
  },
  NewBatchDraft: {
    barangay: async (parent) => {
      return await prisma.barangays.findUnique({
        where: { id: parent.barangayId },
      });
    },

    municipal: async (parent) => {
      if (parent.municipalId === null) {
        throw new Error("Municipal ID cannot be null");
      }

      return await prisma.municipals.findUnique({
        where: { id: parent.municipalId },
      });
    },
  },
  Survey: {
    admin: async (parent) => {
      return await prisma.adminUser.findUnique({
        where: { uid: parent.adminUserUid },
      });
    },
    queries: async (parent) => {
      return await prisma.queries.findMany({ where: { surveyId: parent.id } });
    },
    images: async (parent) => {
      return await prisma.mediaUrl.findMany({ where: { surveyId: parent.id } });
    },
    responseCount: async (parent, { zipCode }) => {
      return await prisma.respondentResponse.count({
        where: { municipalsId: zipCode, surveyId: parent.id },
      });
    },
    ageCount: async () => {
      return await prisma.ageBracket.findMany();
    },
  },
  Queries: {
    options: async (parent) => {
      return await prisma.option.findMany({
        where: { queryId: parent.id },
        orderBy: { order: "asc" },
      });
    },
    respondentOption: async (parent, { id }) => {
      return await prisma.response.findMany({
        where: {
          queryId: parent.id,
          respondentResponseId: id,
        },
      });
    },
    barangayList: async (_, { zipCode }) => {
      console.log(zipCode);

      return await prisma.barangays.findMany({
        where: { municipalId: zipCode },
        orderBy: { name: "asc" },
      });
    },
    customOption: async (parent) => {
      return await prisma.customOption.findMany({
        where: {
          queriesId: parent.id,
        },
      });
    },
  },
  Option: {
    fileUrl: async (parent) => {
      if (!parent.id) {
        return null;
      }

      return await prisma.mediaUrl.findFirst({
        where: { optionId: parent.id as string },
      });
    },
    overAllResponse: async (parent, { id, zipCode, barangayId, genderId }) => {
      let filters: any = {
        optionId: parent.id,
        surveyId: id,
        municipalsId: zipCode,
      };

      if (barangayId !== "all") {
        filters.barangaysId = barangayId;
      }

      if (genderId !== "all") {
        filters.genderId = genderId;
      }
      const responses = await prisma.response.count({
        where: filters,
      });

      return responses;
    },
    ageCountRank: async (
      parent,
      { id, ageBracketId, barangayId, genderId }
    ) => {
      let filters: any = {
        surveyId: id,
        ageBracketId: ageBracketId,
        optionId: parent.id,
      };

      if (barangayId !== "all") {
        filters.barangaysId = barangayId;
      }
      if (genderId !== "all") {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
    optionRank: async (
      parent,
      { surveyId, ageBracketId, barangayId, genderId }
    ) => {
      let filters: any = {
        surveyId: surveyId,
        ageBracketId: ageBracketId,
        optionId: parent.id,
      };

      if (barangayId !== "all") {
        filters.barangaysId = barangayId;
      }
      if (genderId !== "all") {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
    barangays: async () => {
      return await prisma.barangays.findMany({ where: { municipalId: 4905 } });
    },
  },
  RespondentResponse: {
    age: async (parent) => {
      return await prisma.ageBracket.findUnique({
        where: { id: parent.ageBracketId },
      });
    },
    gender: async (parent) => {
      return await prisma.gender.findUnique({ where: { id: parent.genderId } });
    },
    responses: async (parent) => {
      return await prisma.response.findMany({
        where: { respondentResponseId: parent.id },
      });
    },
    barangay: async (parent) => {
      return await prisma.barangays.findFirst({
        where: { id: parent.barangaysId },
      });
    },
  },
  SurveyResponse: {
    barangay: async (parent) => {
      return await prisma.barangays.findUnique({
        where: { id: parent.barangaysId },
      });
    },
    respondentResponses: async (parent) => {
      return prisma.respondentResponse.findMany({
        where: { surveyResponseId: parent.id },
      });
    },
  },
  Quota: {
    age: async (parent) => {
      return await prisma.ageBracket.findUnique({
        where: { id: parent.ageBracketId },
      });
    },
    gendersSize: async (parent) => {
      return await prisma.genderSize.findMany({
        where: { quotaId: parent.id },
      });
    },
  },
  AgeBracket: {
    quota: async (parent, { id }) => {
      return await prisma.quota.findMany({
        where: { ageBracketId: parent.id, barangaysId: id },
      });
    },
    surveyAgeCount: async (parent, { id, zipCode, barangayId, genderId }) => {
      const filters: any = {
        ageBracketId: parent.id,
        surveyId: id,
        municipalsId: zipCode,
      };

      if (barangayId !== "all") {
        filters.barangaysId = barangayId;
      }

      if (genderId !== "all") {
        filters.genderId = genderId;
      }

      // Perform the count query with the constructed filters
      const responses = await prisma.respondentResponse.count({
        where: filters,
      });

      return responses;
    },
    optionAgeCount: async (_, { surveyId }) => {
      return await prisma.queries.findMany({
        where: {
          onTop: true,
          surveyId: surveyId,
        },
      });
    },
    overAllAgeRanking: async (_, { id }) => {
      return await prisma.queries.findMany({
        where: {
          surveyId: id,
        },
      });
    },
    optionRank: async (
      parent,
      { surveyId, zipCode, barangayId, genderId, optionId }
    ) => {
      let filters: any = {
        ageBracketId: parent.id,
        surveyId: surveyId,
        optionId: optionId,
        municipalsId: 4905,
      };
      if (barangayId !== "all") {
        filters.barangayId = barangayId;
      }
      if (genderId !== "all") {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
  },
  GenderSize: {
    gender: async (parent) => {
      return await prisma.gender.findFirst({
        where: { id: parent.genderId },
      });
    },
  },
  Response: {
    option: async (parent) => {
      return await prisma.option.findMany({
        where: { id: parent.optionId },
      });
    },
    queries: async (parent) => {
      return await prisma.queries.findUnique({ where: { id: parent.queryId } });
    },
  },
  ResponseRespondent: {
    barangay: async (parent) => {
      return await prisma.barangays.findUnique({
        where: { id: parent.barangaysId },
      });
    },
  },
  Team: {
    voters: async (parent) => {
      return await prisma.voters.findMany({ where: { teamId: parent.id } });
    },
    teamLeader: async (parent) => {
      if (parent.teamLeaderId === null) {
        return null;
      }
      return await prisma.teamLeader.findUnique({
        where: { id: parent.teamLeaderId },
      });
    },
    candidate: async (parent) => {
      if (parent.candidatesId === null) {
        return null;
      }
      return await prisma.candidates.findFirst({
        where: { id: parent.candidatesId },
      });
    },
    purok: async (parent) => {
      if (parent.purokId === null) {
        return null;
      }
      return await prisma.purok.findUnique({
        where: { id: parent.purokId },
      });
    },
    barangay: async (parent) => {
      return await prisma.barangays.findUnique({
        where: {
          id: parent.barangaysId,
        },
      });
    },
    municipal: async (parent) => {
      return await prisma.municipals.findUnique({
        where: {
          id: parent.municipalsId,
        },
      });
    },
  },
  TeamLeader: {
    voter: async (parent) => {
      if (parent.votersId === null) {
        return null;
      }
      return await prisma.voters.findFirst({
        where: { id: parent.votersId },
      });
    },
    barangayCoor: async (parent) => {
      if (parent.barangayCoorId === null) {
        return null;
      }
      return await prisma.teamLeader.findFirst({
        where: {
          id: parent.barangayCoorId,
        },
      });
    },
    purokCoors: async (parent) => {
      if (parent.purokCoorsId === null) {
        return null;
      }
      return await prisma.teamLeader.findFirst({
        where: {
          id: parent.purokCoorsId,
        },
      });
    },
  },
  Candidates: {
    supporters: async (parent) => {
      return await prisma.voters.count({
        where: { candidatesId: parent.id },
      });
    },
  },
  ValidatedTeams: {
    teamLeader: async (parent) => {
      if (!parent.teamLeaderId) return null;
      return await prisma.teamLeader.findUnique({
        where: {
          id: parent.teamLeaderId as string,
        },
      });
    },
    municipal: async (parent) => {
      if (!parent.municipalsId) return null;
      return await prisma.municipals.findUnique({
        where: {
          id: parent.municipalsId,
        },
      });
    },
    barangay: async (parent) => {
      if (!parent.barangaysId) return null;
      return await prisma.barangays.findUnique({
        where: {
          id: parent.barangaysId as string,
        },
      });
    },
    purok: async (parent) => {
      if (!parent.purokId) return null;
      return prisma.purok.findUnique({
        where: {
          id: parent.purokId as string,
        },
      });
    },
    validatedTeamMembers: async (parent) => {
      return await prisma.validatedTeamMembers.findMany({
        where: {
          validatedTeamsId: parent.id,
        },
      });
    },
  },
  ValidatedTeamMembers: {
    voter: async (parent) => {
      if (!parent.votersId) return null;
      return await prisma.voters.findUnique({
        where: {
          id: parent.votersId as string,
        },
      });
    },
  },
  Users: {
    qrCode: async (parent) => {
      if (!parent.userQRCodeId) return null;
      return await prisma.userQRCode.findUnique({
        where: { id: parent.userQRCodeId },
      });
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const main = async () => {
  try {
    await server.start();

    app.use(
      "/graphql",
      cors<cors.CorsRequest>(),
      express.json(),
      expressMiddleware(server)
    );

    app.use("/upload", fileRoutes);
    app.use("/precint", precint);
    app.use("/voters", voters);
    app.use("/purok", purok);
    app.use("/export", pdfFile);

    //test
    app.get("/test", (req: Request, res: Response) => {
      res.status(200).json({ message: "Hello Wolrd" });
    });

    io.on("connection", (socket) => {
      // Listener for draftedCounter event
      socket.on("draftedCounter", (data) => {
        console.log("Drafted Counter Data:", data);
      });

      // Listener for updateVoterCounter event
      socket.on("updateVoterCounter", (data) => {
        console.log("Update Voter Counter Data:", data);
      });

      // Listener for disconnect event
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });

    const port = 3000;

    ioserver.listen(port, async () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
  }
};
main();
