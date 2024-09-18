import { ApolloServer } from "@apollo/server";

import { expressMiddleware } from "@apollo/server/express4";
import express, { Request, Response } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import ServerlessHttp from "serverless-http";
import cors from "cors";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

import {PrismaClient } from "@prisma/client";
import { typeDefs } from "../schema/schema";
import { Resolvers } from "../interface/types";
import bodyParser from "body-parser";

//routes
import files from "../routes/files";
import precint from "../routes/precint";
import voters from "../routes/voter";
import purok from "../routes/purok";
import imageUpload from "../routes/image";
//utils
import { handleGenTagID } from "../utils/data";
import { GraphQLError } from "graphql";

const prisma = new PrismaClient();
const app = express();
const ioserver = createServer(app);
const io = new Server(ioserver, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

//
const fileRoutes = files(io);
app.use(express.json({ limit: "10mb" })); // Increase the limit to 10MB
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const resolvers: Resolvers = {
  Query: {
    users: async () => {
      return await prisma.users.findMany();
    },
    voters: async () => await prisma.voters.findMany(),
    voter: async (_, { id }) =>
      await prisma.voters.findUnique({ where: { id } }),
    votersCount: async () => {
      return await prisma.voters.count();
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
    barangayList: async (_, { municipalId }) => {
      return await prisma.barangays.findMany({
        where: { municipalId: municipalId },
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
      return await prisma.survey.findMany({ orderBy: { timestamp: "asc" } });
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
    newUser: async (_, user) => {
      return await prisma.users.create({ data: { ...user } });
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
      return await prisma.queries.create({
        data: {
          queries: query.queries,
          surveyId: query.surveyId,
          type: query.type,
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

        const respondentData = respondentResponse.map((res) => ({
          id: res.id,
          ageBracketId: res.ageBracketId,
          genderId: res.genderId,
          barangaysId: res.barangaysId,
          municipalsId: res.municipalsId,
          surveyId: res.surveyId,
          surveyResponseId: surveyResponsed.id,
        }));

        await prisma.respondentResponse.createMany({
          data: respondentData,
        });

        // Create Response entries in batch
        const responseData = response.map((res) => ({
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
        }));

        await prisma.response.createMany({
          data: responseData,
        });

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
      console.log(id);

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
        where: { municipalsId: parent.municipalId },
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
    RespondentResponse: async (parent, { id }) => {
      return await prisma.respondentResponse.count({
        where: {
          barangaysId: parent.id,
          surveyId: id,
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
  },
  Queries: {
    options: async (parent) => {
      return await prisma.option.findMany({
        where: { queryId: parent.id },
        orderBy: { order: "asc" },
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
      return await prisma.barangays.findFirst({ where: { id: parent.id } });
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
  },
  GenderSize: {
    gender: async (parent) => {
      return await prisma.gender.findFirst({
        where: { id: parent.genderId },
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
    app.use("/upload", imageUpload);

    //test
    app.get("/test", (req: Request, res: Response) => {
      res.status(200).json({ message: "Hello Wolrd" });
    });

    io.on("connection", (socket) => {
      socket.on("draftedCounter", (data) => {
        console.log(data);
      });
      socket.off("draftedCounter", () => {
        console.log("Disconnected");
      });
    });

    const port = 3000;

    ioserver.listen(port, async () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
};
main();
export const handler = ServerlessHttp(app);