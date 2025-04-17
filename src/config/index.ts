import { ApolloServer } from '@apollo/server';

import { expressMiddleware } from '@apollo/server/express4';
import express, { Request, Response } from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import qrcode from 'qrcode';
import path from 'path';
import {
  prisma,
  Candidates,
  Position,
  Prisma,
  Voters,
  Team,
  TeamLeader,
  QRcode,
} from '../../prisma/prisma';
import { typeDefs } from '../schema/schema';
import { Resolvers } from '../interface/types';
import bodyParser from 'body-parser';

//routes
import files from '../routes/files';
import precint from '../routes/precint';
import voters from '../routes/voter';
import purok from '../routes/purok';
import pdfFile from '../../routes/pdfFile';
import image from '../../src/routes/image';
import auth from '../routes/auth';
import data from '../routes/data';
//utils
import {
  handleDataType,
  handleGenTagID,
  handleLevel,
  removeAllSpaces,
  teamMembersCount,
} from '../utils/data';
import { GraphQLError } from 'graphql';
import {
  BarangayOptionResponse,
  RejectListProps,
  RespondentResponseProps,
  RejectListedProps,
  ValidatedTeamMembers,
  VoterRecordsProps,
  SurveyResults,
  GroupedVotersToUpdate,
  CalibratedResult,
} from '../interface/data';
import { timeStamp } from 'node:console';

const app = express();
const ioserver = createServer(app);
const io = new Server(ioserver, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://jml-client-test.netlify.app',
      'https://jml-portal.netlify.app',
      'https://jml-client-test.netlify.app/',
      'https://jml-portal.netlify.app',
      'http://3.80.143.15:5173/',
      'https://one-app-u7hu.onrender.com/',
      'https://one-app-u7hu.onrender.com/graphql',
    ],
    methods: ['GET', 'POST'],
  },
});

//routes
const fileRoutes = files(io);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://jml-client-test.netlify.app',
      'https://jml-portal.netlify.app',
      'https://jml-client-test.netlify.app/',
      'https://jml-portal.netlify.app',
      'http://3.80.143.15:5173/',
      'https://one-app-u7hu.onrender.com/',
      'https://one-app-u7hu.onrender.com/graphql',
    ],
  }),
);
app.use(express.static(path.join(__dirname, 'react-app/build')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const resolvers: Resolvers = {
  Query: {
    users: async () => {
      return await prisma.users.findMany();
    },
    voters: async (_, { skip, zipCode, barangayId }) => {
      console.log({ skip, zipCode, barangayId });

      const filter: any = {};
      if (zipCode) {
        filter.municipalsId = zipCode;
      }
      if (barangayId) {
        filter.barangaysId = barangayId;
      }
      return await prisma.voters.findMany({
        where: {
          saveStatus: 'listed',
          ...filter,
        },
        skip: skip ?? 0,
        take: 50,
      });
    },
    voter: async (_, { id }) => {
      return await prisma.voters.findUnique({ where: { id } });
    },
    votersCount: async () => {
      return await prisma.voters.count({
        where: {
          saveStatus: 'listed',
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
                mode: 'insensitive',
              },
            },
            {
              firstname: {
                contains: query.params,
                mode: 'insensitive',
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
        orderBy: { name: 'asc' },
      });
    },
    municipals: async () => await prisma.municipals.findMany(),
    municipal: async (_, { zipCode }) => {
      console.log('Id ', zipCode);

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
          saveStatus: 'drafted',
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
        where: { tagID: tagID, status: 'Ongoing' },
      });

      if (!target) {
        throw new GraphQLError('No active survey found with tag ID', {
          extensions: { code: 'SURVEY_NOT_FOUND' },
        });
      }
      return target;
    },
    surveyList: async () => {
      return await prisma.survey.findMany({
        orderBy: { timestamp: 'asc' },
      });
    },

    queries: async (_, { id }) => {
      return await prisma.queries.findUnique({ where: { id } });
    },
    ageList: async () => {
      return await prisma.ageBracket.findMany({ orderBy: { order: 'asc' } });
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
        orderBy: { timestamp: 'asc' },
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
      const groupedByQueries: { [key: string]: RespondentResponseProps } = responses.reduce(
        (grouped, response) => {
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
            id: response.option?.id as string,
            queryId: queryId,
            title: response.option?.title as string,
            desc: response.option?.desc as string,
          });

          return grouped;
        },
        {} as { [key: string]: RespondentResponseProps },
      );

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
      if (optionId === 'all') {
        return 0;
      }
      return await prisma.response.count({ where: { optionId, ageBracketId } });
    },
    optionRank: async (
      _,
      { surveyId, ageBracketId, zipCode, barangayId, genderId, optionId, queryId },
    ) => {
      let filters: any = {
        surveyId: surveyId,
        ageBracketId: ageBracketId,
        optionId: optionId,
        queryId: queryId,
        municipalsId: zipCode,
      };

      if (barangayId !== 'all') {
        filters.barangaysId = barangayId;
      }
      if (genderId !== 'all') {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
    optionGenderRank: async (
      _,
      { surveyId, ageBracketId, zipCode, barangayId, genderId, optionId, queryId },
    ) => {
      let filters: any = {
        surveyId: surveyId,
        ageBracketId: ageBracketId,
        optionId: optionId,
        queryId: queryId,
        municipalsId: zipCode,
      };

      if (barangayId !== 'all') {
        filters.barangaysId = barangayId;
      }
      if (genderId !== 'all') {
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
          name: 'asc',
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
        by: ['barangaysId', 'optionId'],
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
            (rc) => rc.barangaysId === barangay.id && rc.optionId === option.id,
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
      let filter: Prisma.VotersWhereInput = { saveStatus: 'listed' }; // use Prisma's typing if possible

      if (zipCode !== 'all') {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }
      return await prisma.voters.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          lastname: 'asc',
        },
        where: filter,
      });
    },
    searchVoter: async (_, { query, skip, take, zipCode, barangayId }) => {
      console.log({ query, skip, take, zipCode, barangayId });

      const filter: any = {
        OR: [
          {
            lastname: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            firstname: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            idNumber: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      };
      if (zipCode) {
        filter.municipalsId = zipCode;
      }
      if (barangayId) {
        filter.barangaysId = barangayId;
      }
      return await prisma.voters.findMany({
        skip,
        take,
        where: {
          saveStatus: 'listed',
          ...filter,
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
        by: ['barangaysId'],
        where: {
          optionId,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
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
        barangay: barangayDetails.find((detail) => detail.id === barangay.barangaysId) || null,
      }));
      return JSON.stringify(result);
    },
    getAllPurokCoor: async () => {
      return await prisma.purokCoor.findMany();
    },
    getAllTeamLeader: async (_, { skip, zipCode, barangayId }) => {
      console.log({ skip, zipCode, barangayId });

      const filter: any = {};
      if (zipCode) {
        filter.municipalsId = zipCode;
      }

      if (barangayId) {
        filter.barangaysId = barangayId;
      }
      console.log({ filter });

      const data = await prisma.teamLeader.findMany({
        skip: skip ?? 0,
        take: 20,
        where: filter,
      });

      return data;
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
        mode,
        withoutTeam,
      },
    ) => {
      console.log({ skip });

      const filter: any = { saveStatus: 'listed' };
      // if(withoutTeam === "YES"){
      //   filter.teamId= null
      //   filter.candidatesId= null
      // }

      if (zipCode !== 'all') {
        filter.municipalsId = parseInt(zipCode, 10);
      }

      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }

      if (purokId !== 'all') {
        filter.purokId = purokId;
      }
      if (pwd === 'YES') {
        filter.pwd = 'YES';
      }
      if (oor === 'YES') {
        filter.oor = 'YES';
      }
      if (inc === 'YES') {
        filter.inc = 'YES';
      }
      if (illi === 'YES') {
        filter.illi = 'YES';
      }
      if (dead === 'YES') {
        filter.status = 0;
      }
      if (senior === 'YES') {
        filter.senior = true;
      }
      if (youth === 'YES') {
        filter.youth = true;
      }
      if (gender !== 'all') {
        filter.gender = gender;
      }

      if (level !== 'all') {
        filter.level = parseInt(level, 10);
      }
      if (query) {
        const searchTerms = query.split(' ').filter((term) => term.trim() !== '');

        filter.OR = [
          ...searchTerms.flatMap((term) => [
            { lastname: { contains: term, mode: 'insensitive' } },
            { firstname: { contains: term, mode: 'insensitive' } },
            { idNumber: { contains: term, mode: 'insensitive' } },
          ]),
          {
            AND: searchTerms.map((term) => ({
              OR: [
                { firstname: { contains: term, mode: 'insensitive' } },
                { lastname: { contains: term, mode: 'insensitive' } },
                { idNumber: { contains: term, mode: 'insensitive' } },
              ],
            })),
          },
        ];
      }

      const result = await prisma.voters.findMany({
        where: filter,
        skip: skip ?? 0,
        take,
        orderBy: {
          idNumber: 'asc',
        },
      });

      const count = await prisma.voters.count({ where: filter });

      console.log('Filter: ', filter);
      console.log('Result: ', result);

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
      { zipCode, barangayId, purokId, level, query, skip, candidate, withIssues, members },
    ) => {
      const filter: any = {};

      console.log({ members });
      const teamMembers = teamMembersCount(members);

      const levelList: any = [
        { name: 'TL', value: 1 },
        { name: 'PC', value: 2 },
        { name: 'BC', value: 3 },
      ];
      if (query) {
        filter.TeamLeader = {
          voter: {
            OR: [
              { lastname: { contains: query, mode: 'insensitive' } },
              { firstname: { contains: query, mode: 'insensitive' } },
              { idNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
        };
      }
      const teamLevel = levelList.find((x: { name: string }) => x.name === level);

      if (zipCode !== 'all') {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }
      if (purokId !== 'all') {
        filter.purokId = purokId;
      }
      if (level !== 'all') {
        filter.level = teamLevel.value;
      }

      const teams = await prisma.team.findMany({
        where: {
          teamLeaderId: { not: null },
          TeamLeader: {
            votersId: { not: null },
          },
          ...filter,
        },
        take: 50,
        skip: skip ?? 0,
        select: {
          id: true,
          purokId: true,
          barangaysId: true,
          municipalsId: true,
          hubId: true,
          level: true,
          teamLeaderId: true,
          candidatesId: true,
          timestamp: true,
          _count: {
            select: {
              voters: {
                where: {
                  candidatesId: { not: null },
                  teamId: { not: null },
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

      return teams.filter((team) => {
        if (members === 'noMembers') {
          return team._count.voters === 0;
        }
        if (members === 'five') {
          return team._count.voters === 5;
        }
        return team;
      });
    },
    teamCount: async (
      _,
      { zipCode, barangayId, purokId, level, query, skip, candidate, withIssues, members },
    ) => {
      const filter: any = {};

      const levelList: any = [
        { name: 'TL', value: 1 },
        { name: 'PC', value: 2 },
        { name: 'BC', value: 3 },
      ];
      if (query) {
        filter.TeamLeader = {
          voter: {
            OR: [
              { lastname: { contains: query, mode: 'insensitive' } },
              { firstname: { contains: query, mode: 'insensitive' } },
              { idNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
        };
      }
      const teamLevel = levelList.find((x: { name: string }) => x.name === level);

      if (zipCode !== 'all') {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }
      if (purokId !== 'all') {
        filter.purokId = purokId;
      }
      if (level !== 'all') {
        filter.level = teamLevel.value;
      }
      const count = await prisma.team.count({
        where: {
          teamLeaderId: { not: null },
          TeamLeader: {
            votersId: { not: null },
          },
          ...filter,
        },
      });
      return count;
    },
    teamMembersCount: async (_, { zipCode, barangayId, purokId, level, query }) => {
      const filter: any = {};
      console.log({ level });

      const levelList: any = [
        { name: 'TL', value: 1 },
        { name: 'PC', value: 2 },
        { name: 'BC', value: 3 },
      ];

      if (query) {
        filter.TeamLeader = {
          voter: {
            OR: [
              { lastname: { contains: query, mode: 'insensitive' } },
              { firstname: { contains: query, mode: 'insensitive' } },
              { idNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
        };
      }

      // Handle level filtering more safely
      if (level !== 'all') {
        const teamLevel = levelList.find((x: { name: string }) => x.name === level);
        if (!teamLevel) {
          throw new Error(`Invalid level: ${level}`);
        }
        console.log('Level: ', teamLevel.value);
        filter.level = teamLevel.value;
      }

      if (zipCode !== 'all') {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }
      if (purokId !== 'all') {
        filter.purokId = purokId;
      }

      const memberLevel: any = {};
      if (level !== 'all') {
        const teamLevel = levelList.find((x: { name: string }) => x.name === level);
        memberLevel.where = {
          level: teamLevel.value - 1,
          teamId: { not: null },
        };
      }

      const voterFilter = level === 'all' ? true : memberLevel;
      const count = await prisma.team.findMany({
        where: {
          teamLeaderId: { not: null },
          TeamLeader: {
            votersId: { not: null },
          },
          ...filter,
        },
        include: {
          _count: {
            select: {
              voters: voterFilter,
            },
          },
        },
      });

      const totalMember = count.reduce((acc, item) => acc + item._count.voters, 0);
      return totalMember;
    },
    candidates: async (_, { zipCode }) => {
      const filter: any = {};
      if (zipCode === '4903') {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      // const newBatch = await prisma.ccaandidates.update({
      //   where:{
      //     candidateBatchId: null
      //   },
      //   data:{
      //     candidateBatchId: "9dd41693-8638-40ef-b87c-526d43d33479"
      //   }
      // })
      // console.log(newBatch);

      return await prisma.candidates.findMany({
        where: filter,
      });
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
    teams: async (_, { skip, zipCode, barangayId }) => {
      console.log({ skip, zipCode });
      const filter: any = {};
      if (zipCode) {
        filter.municipalsId = zipCode;
      }
      if (barangayId) {
        filter.barangaysId = barangayId;
      }

      const data = await prisma.team.findMany({
        where: filter,
        take: 50,
        skip: skip ?? 0,
      });
      console.log({ data });

      return data;
    },
    teamRecord: async (_, { query, skip, municipal, barangay }) => {
      let filter: any = {};
      if (municipal !== 'all') {
        filter.municipalsId = parseInt(municipal, 10);
      }
      if (barangay !== 'all') {
        filter.barangaysId = barangay;
      }
      if (query) {
        filter.teamLeader = {
          voter: {
            OR: [
              { lastname: { contains: query, mode: 'insensitive' } },
              { firstname: { contains: query, mode: 'insensitive' } },
            ],
          },
        };
      }

      return await prisma.validatedTeams.findMany({
        where: filter,
        skip: skip ?? 0,
        orderBy: {
          timestamp: 'desc',
        },
      });
    },
    getTeamRecord: async (_, { id }) => {
      return await prisma.validatedTeams.findUnique({
        where: { id },
      });
    },
    userList: async (_, { zipCode }) => {
      console.log('user zc', zipCode);

      const filter: any = {};
      if (zipCode !== 4905) {
        filter.forMunicipal = zipCode;
      }
      return await prisma.users.findMany({
        where: filter,
      });
    },
    userQRCodeList: async () => {
      return await prisma.userQRCode.findMany();
    },
    purokList: async (_, { zipCode }) => {
      console.log({ zipCode });

      return await prisma.purok.findMany({
        where: {
          municipalsId: zipCode,
        },
      });
    },
    voterRecords: async (_, { skip, zipCode }) => {
      console.log("Voter's record skipped: ", { skip });
      return await prisma.voterRecords.findMany({
        skip: skip ?? 0,
        take: 50,
        where: {
          voter: {
            municipalsId: zipCode,
          },
        },
      });
    },
    printOptionResponse: async (_, { surveyId, queryId, zipCode }) => {
      const response = await prisma.queries.findMany();
      return response;
    },
    candidate: async (_, { id }) => {
      return await prisma.candidates.findUnique({
        where: { id },
      });
    },
    duplicateteamMembers: async (_, { skip, zipCode }) => {
      console.log('Duplicated: ', { skip }, zipCode);
      return await prisma.duplicateteamMembers.findMany({
        skip: skip ?? 0,
        take: 50,
        where: {
          municipalsId: zipCode,
        },
      });
    },
    delistedVotes: async (_, { skip, zipCode }) => {
      console.log('Delisted ', { skip }, zipCode);
      const response = await prisma.delistedVoter.findMany({
        skip: skip ?? 0,
        take: 50,
        where: {
          municipalsId: zipCode,
        },
      });
      return response;
    },
    accountTeamHandle: async (_, { id, skip }) => {
      console.log({ id, skip });

      return await prisma.accountHandleTeam.findMany({
        where: {
          usersUid: id,
        },
        skip: skip ?? 0,
        take: 50,
      });
    },
    user: async (_, { id }) => {
      if (!id) return null;
      return prisma.users.findUnique({
        where: {
          uid: id,
        },
      });
    },
    getAssignedTeams: async (_, { userId, zipCode, barangaysId, from, take, max, min }) => {
      console.log('Params ,', { userId, zipCode, barangaysId, from, take, max, min });

      const barangay = await prisma.barangays.findFirst({
        where: {
          municipalId: zipCode,
          number: barangaysId,
        },
      });
      const teams = await prisma.team.findMany({
        where: {
          barangaysId: barangay?.id,
          municipalsId: zipCode,
          level: 1,
          AccountHandleTeam: {
            none: {},
          },
        },
        include: {
          _count: {
            select: {
              voters: true,
            },
          },
        },
        skip: from - 1,
        take,
      });

      const filteredTeams = teams.filter(
        (team) => team._count.voters >= min && team._count.voters <= max,
      );
      console.log('Checked: ', filteredTeams.length);

      await prisma.accountHandleTeam.createMany({
        data: filteredTeams.map((item) => {
          return {
            usersUid: userId,
            teamId: item.id,
            municipalsId: item.municipalsId,
            barangaysId: item.barangaysId,
          };
        }),
        skipDuplicates: true,
      });
      const handleTeams = await prisma.accountHandleTeam.findMany({
        where: {
          usersUid: userId,
        },
      });
      return handleTeams;
    },

    accountHandleTeamList: async () => {
      return await prisma.accountHandleTeam.findMany({});
    },
    teamLeaderTeamHandle: async (_, { level, zipCode, barangay, skip }) => {
      console.log({ level, zipCode, barangay, skip });

      const filter: any = {
        level: level,
      };
      if (zipCode !== 'all') {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangay !== 'all') {
        filter.barangaysId = barangay;
      }
      return await prisma.teamLeader.findMany({
        where: filter,
        include: {
          team: {
            where: {
              level: level - 1,
            },
          },
        },
        skip: skip ?? 0,
        take: 10,
      });
    },
    figureHeads: async (_, { level, barangayId }) => {
      console.log('con: ', { level, barangayId });

      return await prisma.team.findMany({
        where: {
          level,
          barangaysId: barangayId,
        },
        include: {
          TeamLeader: {
            select: {
              voter: true,
              barangayCoor: true,
              purokCoors: true,
            },
          },
        },
        orderBy: {
          TeamLeader: {
            voter: { lastname: 'asc' },
          },
        },
      });
    },
    butaws: async () => {
      const [voters, team, tl] = await prisma.$transaction([
        prisma.voters.findMany({
          where: {
            municipalsId: 4905,
            candidatesId: '842e7060-e38a-48a1-8f29-ec9c766b0fa0',
            teamId: { not: null },
          },
        }),
        prisma.team.findMany({
          where: {
            municipalsId: 4905,
            candidatesId: '842e7060-e38a-48a1-8f29-ec9c766b0fa0',
          },
        }),
        prisma.teamLeader.findMany({
          where: {
            municipalsId: 4905,
            candidatesId: '842e7060-e38a-48a1-8f29-ec9c766b0fa0',
            teamId: { not: null },
          },
        }),
      ]);
      if (voters.length === 0 || team.length === 0 || tl.length === 0) {
        throw new GraphQLError('Could not find participants');
      }
      console.log(voters.length, team.length, tl.length);

      await prisma.$transaction([
        prisma.voters.updateMany({
          where: {
            id: { in: voters.map((item) => item.id) },
          },
          data: {
            candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
          },
        }),
        prisma.team.updateMany({
          where: {
            id: { in: team.map((item) => item.id) },
          },
          data: {
            candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
          },
        }),
        prisma.teamLeader.updateMany({
          where: {
            id: { in: tl.map((item) => item.id) },
          },
          data: {
            candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
          },
        }),
      ]);

      const data = await prisma.voters.findMany({
        where: {
          municipalsId: 4905,
          candidatesId: null,
          teamId: { not: null },
          level: 0,
        },
        take: 1,
      });
      return data;
    },
    getTLQrCode: async (_, { barangayId, skip }) => {
      const filter: any = {};
      const barangay = await prisma.barangays.findUnique({
        where: {
          id: barangayId,
        },
        select: {
          voters: {
            select: {
              id: true,
              QRcode: {
                where: {},
              },
            },
          },
        },
      });

      return await prisma.teamlLeaderQRcodes.findMany({
        where: {
          TeamLeader: {
            barangaysId: barangayId,
          },
        },
        skip: skip ?? 0,
      });
    },
    getVoterQRcode: async (_, { barangayId, skip }) => {
      return await prisma.qRcode.findMany({
        where: {
          voter: {
            barangaysId: barangayId,
            candidatesId: { not: null },
            teamId: { not: null },
            level: 0,
            QRcode: {
              some: {},
            },
          },
        },
        take: 50,
        skip: skip ?? 0,
      });
    },
    getAllCollBatch: async (_, { zipCode }) => {
      console.log({ zipCode });

      const data = await prisma.collectionBatch.findMany({
        where: {
          municipalsId: zipCode,
        },
      });
      console.log(data);

      return data;
    },
    getCollReport: async (_, { zipCode }) => {
      return await prisma.barangays.findMany({
        where: {
          municipalId: zipCode,
        },
      });
    },
    calibrateTeamArea: async (_, { zipCode, barangayId, level }) => {
      const calibratedTeams: CalibratedResult[] = [];
      console.log({ zipCode, barangayId });
      const filter: any = {};
      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }

      // Fetch voters in the specified area
      const voters = await prisma.voters.findMany({
        where: {
          municipalsId: zipCode,
          ...filter,
        },
        include: {
          barangay: true,
          TeamLeader: true,
          Team: true,
        },
      });

      if (voters.length === 0) {
        throw new GraphQLError('No voters found');
      }

      // Get all team leaders in this voter set
      const teamLeaders = await prisma.teamLeader.findMany({
        where: {
          votersId: { in: voters.map((item) => item.id) },
        },
        select: {
          voter: {
            select: {
              firstname: true,
              lastname: true,
              id: true,
              level: true,
              idNumber: true,
            },
          },
          id: true,
          votersId: true,
          purokCoorsId: true,
          barangayCoorId: true,
          teamId: true,
          level: true,
          purokCoors: {
            select: {
              teamId: true,
            },
          },
        },
      });
      const teams = await prisma.team.findMany({
        where: {
          TeamLeader: {
            votersId: { in: voters.map((item) => item.id) },
          },
        },
        include: {
          TeamLeader: {
            select: {
              id: true,
              votersId: true,
            },
          },
        },
      });

      for (const voter of voters) {
        const isTeamLeader = teamLeaders.find((tl) => tl.votersId === voter.id);
        let team = teams.find((item) => item.TeamLeader?.votersId === voter.id);
        console.log('Selected Voters: ', {
          team,
          isTeamLeader,
          voter,
        });

        let code = 0;
        let reason = 'V-list';
        let correct = 'Add to team, promote to TL/PC/BC';
        let currentLevel = voter.level || 0;
        let tlData = undefined;

        // Condition 1: Has candidate ID but no team
        if (!voter.candidatesId && voter.teamId) {
          code = 2;
          reason = 'Candidate not found';
          correct = 'Remove from team or assign candidate';
        } else if (
          voter.level > 0 &&
          voter.candidatesId &&
          voter.teamId &&
          !isTeamLeader &&
          !team
        ) {
          code = 2;
          reason = 'Invalid Team Data';
          correct = 'Remove from team or assign candidate';
        }
        // Condition 3: Is team leader but level is 0
        else if (voter.level === 0 && isTeamLeader) {
          code = 3;
          tlData = isTeamLeader;
          reason = `Unmatched level: (${handleLevel(voter.level)}, ${handleLevel(
            isTeamLeader.level,
          )})`;
          correct = 'Calibrate for TL; refresh for member';
        }
        // Condition 4: Is TL but missing PC/BC assignment
        else if (
          voter.level === 1 &&
          (!isTeamLeader?.purokCoorsId ||
            !isTeamLeader?.barangayCoorId ||
            !voter.teamId ||
            voter.teamId !== isTeamLeader.purokCoors?.teamId)
        ) {
          code = 3;
          reason = 'Missing PC/BC assignment';
          correct = 'Assign PC/BC';
        }
        // Condition 5: Is PC but missing BC assignment
        else if (voter.level === 2 && !isTeamLeader?.barangayCoorId) {
          code = 3;
          reason = 'Missing BC assignment';
          correct = 'Assign BC';
        }

        // Only push to results if we found an issue (code > 0)
        if (code > 0) {
          calibratedTeams.push({
            voter: voter,
            level: voter.level || 0,
            reason,
            code,
            barangay: undefined,
            teamLeader: tlData,
            team: undefined,
            correct,
            teamLeaderId: isTeamLeader?.id || null,
            teamId: voter.teamId || (tlData?.teamId as string) || null,
            currentLevel,
            votersId: voter.id,
            barangaysId: voter.barangaysId,
          });
        }
      }

      return calibratedTeams;
    },
    getAllMachines: async (_, { zipCode }) => {
      console.log({ zipCode });

      return await prisma.machine.findMany({
        where: {
          municipalsId: zipCode,
        },
        include: {
          _count: {
            select: {
              prints: true,
            },
          },
          prints: {
            include: {
              _count: {
                select: {
                  Voters: true,
                },
              },
            },
          },
        },
        orderBy: {
          number: 'asc',
        },
      });
    },
  },
  Mutation: {
    signUp: async (_, { user }) => {
      const hash = await argon2.hash(user.password);
      const check = await prisma.adminUser.findFirst({
        where: { phoneNumber: user.phoneNumber },
      });
      if (check) {
        throw new Error('Phone number already exit.');
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
      const { username, password, privilege, purpose, role, encryptPassword, forMunicipal } = user;

      const checked = await prisma.users.findFirst({ where: { username } });
      if (checked) {
        throw new GraphQLError('Username already exists');
      }
      const hashedPassword = encryptPassword ? await argon2.hash(password) : password;
      await prisma.$transaction(async (prisma) => {
        // Create user
        const createdUser = await prisma.users.create({
          data: {
            username,
            password: hashedPassword,
            status: 1,
            privilege,
            purpose,
            role,
            forMunicipal: forMunicipal ? parseInt(forMunicipal, 10) : null,
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

      return 'OK';
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
            mode: 'insensitive',
          },
          municipalId: barangay.municipalId,
        },
      });
      if (existed) {
        throw new Error('Barangay name already exists');
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
        where: { newBatchDraftId: id, saveStatus: 'drafted' },
      });
      return await prisma.newBatchDraft.delete({ where: { id } });
    },
    createPrecent: async (_, { precint }) => {
      return await prisma.precents.create({
        data: {
          precintNumber: precint.precintNumber,
          id: precint.id,
          municipalsId: precint.municipalsId,
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
      console.log({ survey });

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
          type: 'random',
          adminUserUid: '35962b1b-6108-4e1e-a2ae-6940d1986edd',
          tagID: tagID,
        },
      });
      return data;
    },
    createQuery: async (_, { query }) => {
      console.log('New Query: ', query);

      return await prisma.queries.create({
        data: {
          queries: query.queries,
          surveyId: query.surveyId,
          type: query.type,
          onTop: query.onTop,
          style: query.style,
          withCustomOption: query.withCustomOption,
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
      console.log({ option });
      let mediaUrlId = null;

      const createdOption = await prisma.option.create({
        data: {
          title: option.title,
          desc: option.desc,
          queryId: option.queryId,
          onExit: option.onExit,
          onTop: option.onTop,
          customizable: option.customizable,
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
        data: { status: 'Concluded' },
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
    harvestResponse: async (_, { response, surveyResponse, respondentResponse, customOptions }) => {
      console.log({
        response,
        respondentResponse,
      });

      for (let item of surveyResponse) {
        try {
          await prisma.surveyResponse.create({
            data: {
              id: item.id,
              municipalsId: item.municipalsId,
              barangaysId: item.barangaysId,
              surveyId: item.surveyId,
              usersUid: item.accountID,
            },
          });
        } catch (error) {
          continue;
        }
      }

      for (let item of respondentResponse) {
        try {
          await prisma.respondentResponse.create({
            data: {
              id: item.id,
              ageBracketId: item.ageBracketId,
              genderId: item.genderId,
              barangaysId: item.barangaysId,
              municipalsId: item.municipalsId,
              surveyId: item.surveyId,
              usersUid: item.accountID,
              surveyResponseId: item.surveyResponseId,
              valid: item.valid,
            },
          });
        } catch (error) {
          continue;
        }
      }

      for (let item of response) {
        try {
          await prisma.response.create({
            data: {
              id: item.id,
              ageBracketId: item.ageBracketId,
              genderId: item.genderId,
              barangaysId: item.barangaysId,
              municipalsId: item.municipalsId,
              surveyId: item.surveyId,
              surveyResponseId: item.surveyResponseId,
              optionId: item.optionId || null,
              queryId: item.queryId,
              respondentResponseId: item.respondentResponseId,
            },
          });
        } catch (error) {
          continue;
        }
      }

      if (customOptions.length) {
        for (let item of customOptions) {
          try {
            await prisma.customOption.createMany({
              data: {
                id: item.id,
                value: item.value,
                queriesId: item.queriesId,
                respondentResponseId: item.respondentResponseId,
              },
            });
          } catch (error) {
            continue;
          }
        }
      }

      // await prisma.surveyResponse.createMany({
      //   data: surveyResponse.map((item) => {
      //     return {
      //       id: item.id,
      //       municipalsId: item.municipalsId,
      //       barangaysId: item.barangaysId,
      //       surveyId: item.surveyId,
      //       usersUid: item.accountID,
      //     };
      //   }),
      //   skipDuplicates: true,
      // });

      // await prisma.respondentResponse.createMany({
      //   data: respondentResponse.map((item) => {
      //     return {
      //       id: item.id,
      //       ageBracketId: item.ageBracketId,
      //       genderId: item.genderId,
      //       barangaysId: item.barangaysId,
      //       municipalsId: item.municipalsId,
      //       surveyId: item.surveyId,
      //       usersUid: item.accountID,
      //       surveyResponseId: item.surveyResponseId,
      //       valid: item.valid,
      //     };
      //   }),
      //   skipDuplicates: true,
      // });

      // await prisma.response.createMany({
      //   data: response.map((item) => {
      //     return {
      //       id: item.id,
      //       ageBracketId: item.ageBracketId,
      //       genderId: item.genderId,
      //       barangaysId: item.barangaysId,
      //       municipalsId: item.municipalsId,
      //       surveyId: item.surveyId,
      //       surveyResponseId: item.surveyResponseId,
      //       optionId: item.optionId || null,
      //       queryId: item.queryId,
      //       respondentResponseId: item.respondentResponseId,
      //     };
      //   }),
      //   skipDuplicates: true,
      // });

      // if (customOptions.length) {
      //   await prisma.customOption.createMany({
      //     data: customOptions.map((item) => {
      //       return {
      //         id: item.id,
      //         value: item.value,
      //         queriesId: item.queriesId,
      //         respondentResponseId: item.respondentResponseId,
      //       };
      //     }),
      //     skipDuplicates: true,
      //   });
      // }
      return 'OK';
    },
    submitResponse: async (_, { respondentResponse, response, surveyResponse }) => {
      return await prisma.$transaction(async (prisma) => {
        const checkSurvey = await prisma.survey.findUnique({
          where: { id: surveyResponse.surveyId },
        });
        if (checkSurvey?.status !== 'Ongoing') {
          throw new GraphQLError('The survey is currently closed or paused.');
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
          const existingRespondent = await prisma.respondentResponse.findUnique({
            where: { id: res.id },
          });
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
        throw new Error('JWT secret token is not defined');
      }

      const adminUser = await prisma.adminUser.findFirst({
        where: { phoneNumber: user.phoneNumber },
      });

      if (!adminUser) {
        throw new GraphQLError('Phone number not found!', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const isPasswordValid = await argon2.verify(adminUser.password, user.password);
      if (!isPasswordValid) {
        throw new GraphQLError('Incorrect password', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const accessToken = jwt.sign({ user: adminUser.phoneNumber }, secretToken, {
        expiresIn: '8h',
      });

      const { phoneNumber, lastname, firstname, uid } = adminUser;
      await prisma.$disconnect();
      return { phoneNumber, lastname, firstname, uid, accessToken };
    },
    userLogin: async (_, { user }) => {
      const secretToken = process.env.JWT_SECRECT_TOKEN;

      if (!secretToken) {
        throw new GraphQLError('JWT secret token is not defined');
      }

      const userData = await prisma.users.findFirst({
        where: {
          username: {
            contains: user.username,
            mode: 'insensitive',
          },
        },
      });

      if (!userData) {
        throw new GraphQLError('Username not found!', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const isPasswordValid = await argon2.verify(userData.password, user.password);
      if (!isPasswordValid) {
        throw new GraphQLError('Incorrect password', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const accessToken = jwt.sign({ user: userData.username }, secretToken, { expiresIn: '8h' });

      const { username, role, uid } = userData;
      await prisma.$disconnect();
      return { username, role, uid, accessToken };
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
        throw new GraphQLError('Gender already existed in this quota', {
          extensions: { code: 'EXISTED' },
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
          access: query?.access === 'regular' ? 'admin' : 'regular',
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
      return 'OK';
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
          saveStatus: 'listed',
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
      return 'OK';
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
      return 'OK';
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
            mode: 'insensitive',
          },
        },
      });
      if (!candidate) {
        throw new GraphQLError('Code not found', {
          extensions: {
            code: 'UNFOUND',
          },
        });
      }

      if (!voter) {
        throw new GraphQLError("Couldn't update, voter not found", {
          extensions: { code: 500 },
        });
      }
      if (voter.level === 3) {
        throw new GraphQLError('Already enlisted as Barangay Coor.', {
          extensions: { code: 500 },
        });
      }

      const leadr = await prisma.teamLeader.create({
        data: {
          hubId: 'none',
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

      return 'OK';
    },
    addTeam: async (_, { headId, teamIdList, level }) => {
      const rejectList: RejectListProps[] = [];

      const [headerData, votersData, figureHead] = await prisma.$transaction([
        prisma.voters.findUnique({
          where: {
            id: headId,
          },
        }),
        prisma.voters.findMany({
          where: {
            id: { in: teamIdList.map((member) => member.id) },
          },
        }),
        prisma.teamLeader.findFirst({
          where: {
            votersId: headId,
          },
        }),
      ]);

      if (!headerData || !figureHead) {
        throw new GraphQLError('Head person unfound.', {
          extensions: { code: 'REQUEST_ERROR' },
        });
      }

      if (headerData.level !== level + 1) {
        throw new GraphQLError('Head person unqualified.', {
          extensions: { code: 'REQUEST_ERROR' },
        });
      }
      let data: any = {};
      if (level === 2) {
        data = {
          barangayCoorId: figureHead.id,
          purokCoorsId: null,
        };
      } else if (level === 1) {
        data = {
          barangayCoorId: figureHead.id,
          purokCoorsId: figureHead.id,
        };
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
              reason: 'Not found in master list',
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
              reason: 'Makaibang Baranggay sa Leader',
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
              reason: 'Sumaka-bilang buhay na.',
              teamId: member.teamId,
              code: 11,
            });
            return;
          }

          if (voter.oor === 'YES') {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: 'Wala sa nasabing ankop na lugar.',
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
              reason: 'Nakalista na, bilang isang Barangay Coor.',
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
              reason: 'Nakalista na, bilang isang Purok Coor.',
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
              reason: 'Nakalista na, bilang isang Team Leader.',
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
            reason: 'OK',
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
                reason: 'Meron ng team (Dala na ng ibang team leader)',
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
              throw new GraphQLError('Figure Head not found');
            }

            const team = await prisma.team.findFirst({
              where: {
                teamLeaderId: teamLeader.id,
              },
            });

            if (!team) {
              throw new GraphQLError('No team found with selected leader');
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
                hubId: 'Unknown',
                level: 1,
                candidatesId: figureHead.candidatesId,
                ...data,
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
              data: { teamId: team.id, purokCoorsId: figureHead.id },
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
            const teamLeader = await prisma.teamLeader.create({
              data: {
                votersId: member.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                handle: 10,
                hubId: 'Unknown',
                level,
                ...data,
              },
            });

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
            console.log('Team Created: ', team);

            await prisma.teamLeader.update({
              where: { id: teamLeader.id },
              data: {
                teamId: team.id,
                barangayCoorId: figureHead.id,
              },
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
        }),
      );

      return JSON.stringify(rejectList);
    },
    addMember: async (_, { headId, teamIdList, level, teamId }) => {
      const rejectList: RejectListProps[] = [];

      const [headerData, figureHead] = await prisma.$transaction([
        prisma.voters.findUnique({
          where: {
            id: headId,
          },
        }),
        prisma.teamLeader.findFirst({
          where: {
            votersId: headId,
          },
          include: {
            voter: true,
          },
        }),
      ]);

      console.log({ headerData, figureHead });

      if (!headerData || !figureHead) {
        throw new GraphQLError('Head person unfound.', {
          extensions: { code: 'REQUEST_ERROR' },
        });
      }

      const [votersData] = await prisma.$transaction([
        prisma.voters.findMany({
          where: {
            id: { in: teamIdList.map((member) => member.id) },
          },
          include: {
            WhiteList: true,
          },
        }),
      ]);
      let data: any = {};
      if (level === 1) {
        data = {
          barangayCoorId: figureHead.barangayCoorId,
          purokCoorsId: figureHead.purokCoorsId,
        };
      } else if (level === 2) {
        data = {
          barangayCoorId: figureHead.id,
          purokCoorsId: figureHead.purokCoorsId,
        };
      } else {
        data = {
          barangayCoorId: null,
          purokCoorsId: null,
        };
      }
      console.log(votersData);

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
              reason: 'Not found in master list',
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
              reason: 'Makaibang Baranggay sa Leader',
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
              reason: 'Sumaka-bilang buhay na.',
              teamId: member.teamId,
              code: 11,
            });
            return;
          }

          // if (voter.oor === "YES") {
          //   rejectList.push({
          //     id: member.id,
          //     firstname: member.firstname,
          //     lastname: member.lastname,
          //     municipal: member.municipalsId,
          //     barangay: member.barangaysId,
          //     reason: "Wala sa nasabing ankop na lugar.",
          //     teamId: member.teamId,
          //     code: 11,
          //   });
          //   return;
          // }

          if (voter.level === 3) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: 'Already a Barangay Coor.',
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
              reason: 'Already a Purok Coor.',
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
              reason: 'Already a Team Leader.',
              teamId: member.teamId,
              code: 1,
            });
            return;
          }

          if (voter.WhiteList.length > 0) {
            rejectList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipal: member.municipalsId,
              barangay: member.barangaysId,
              reason: 'Already a BlackListed.',
              teamId: member.teamId,
              code: 1,
            });
          }

          rejectList.push({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            municipal: member.municipalsId,
            barangay: member.barangaysId,
            reason: 'OK',
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
                reason: 'Meron ng team (Dala na ng ibang team leader)',
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
              throw new GraphQLError('No team found with selected leader');
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
                hubId: 'Unknown',
                level: 1,
                candidatesId: headerData.candidatesId,
                ...data,
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
                teamId: figureHead.teamId,
                candidatesId: headerData.candidatesId,
              },
            });
            return;
          }

          // If adding as Purok Coordinator
          if (level === 2) {
            const teamLeader = await prisma.teamLeader.create({
              data: {
                votersId: member.id,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                purokId: voter.purokId as string,
                handle: 10,
                hubId: 'Unknown',
                level,
                ...data,
              },
            });
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
            await prisma.$transaction([
              prisma.teamLeader.update({
                where: { id: teamLeader.id },
                data: { teamId: team.id },
              }),
              prisma.voters.update({
                where: { id: voter.id },
                data: {
                  level: 2,
                  teamId: figureHead.teamId,
                  candidatesId: headerData.candidatesId,
                },
              }),
            ]);

            return;
          }
        }),
      );
      console.log(rejectList);

      return JSON.stringify(rejectList);
    },
    removeVotersArea: async (_, { zipCode, barangayId, purokId }) => {
      if (purokId && purokId !== 'all') {
        await prisma.voters.deleteMany({
          where: {
            purokId,
          },
        });
      } else if (barangayId && barangayId !== 'all') {
        await prisma.voters.deleteMany({
          where: {
            barangaysId: barangayId,
          },
        });
      } else if (zipCode && zipCode !== 'all') {
        await prisma.voters.deleteMany({
          where: {
            municipalsId: parseInt(zipCode, 10),
          },
        });
      } else {
        await prisma.voters.deleteMany();
      }
      return 'OK';
    },
    genderBundleQrCode: async (_, { idList }) => {
      const rejectList: RejectListProps[] = [];
      for (let item of idList) {
        try {
          const voter = await prisma.voters.findUnique({ where: { id: item } });
          if (voter?.qrCode !== 'None') {
            rejectList.push({
              id: item,
              firstname: 'Not Found',
              lastname: 'Not Found',
              municipal: 0,
              barangay: 'Not Found',
              reason: 'QR code already generated.',
              teamId: null,
              code: 1,
            });
            continue;
          }
          if (!voter) {
            rejectList.push({
              id: item,
              firstname: 'Not Found',
              lastname: 'Not Found',
              municipal: 0,
              barangay: 'Not Found',
              reason: 'Voter not found',
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
        throw new GraphQLError('NO team members were found');
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
      return 'OK';
    },
    removeQRcode: async (_, { id }) => {
      await prisma.voters.updateMany({
        where: {
          id: { in: id.map((item) => item) },
        },
        data: {
          qrCode: 'None',
          qrCodeNumber: 0,
        },
      });

      await prisma.qRcode.deleteMany({
        where: {
          votersId: { in: id.map((item) => item) },
        },
      });
      return 'OK';
    },
    createPostion: async (_, { title }) => {
      const position: Position | null = await prisma.position.findFirst({
        where: {
          title,
        },
      });
      if (position && position.title.toLowerCase() === title.toLowerCase()) {
        throw new GraphQLError('Position already exist.');
      }
      await prisma.position.create({
        data: {
          title,
        },
      });
      return 'OK';
    },
    addNewCandidate: async (_: unknown, { firstname, lastname, code, colorCode }) => {
      const candidate: Candidates | null = await prisma.candidates.findFirst({
        where: {
          lastname,
          firstname,
        },
      });

      if (candidate) {
        if (candidate.code === code) {
          throw new GraphQLError('Candidate code already used', {
            extensions: { code: 'CODE_EXIST' },
          });
        }
        if (candidate.colorCode === colorCode) {
          throw new GraphQLError('Candidate color code already used', {
            extensions: { code: 'COLOR_CODE_EXIST' },
          });
        }

        throw new GraphQLError('Candidate already exists', {
          extensions: { code: 'EXISTED_NAME' },
        });
      }

      await prisma.candidates.create({
        data: {
          firstname,
          lastname,
          code,
          candidateBatchId: 'none',
          colorCode,
        },
      });

      return 'OK';
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

      return 'OK';
    },
    changeLeader: async (_, { id, teamId, level, currentTl }) => {
      console.log({ id, teamId, level, currentTl });

      const [data, team, tl] = await prisma.$transaction([
        prisma.voters.findUnique({
          where: { id: id },
        }),
        prisma.team.findUnique({
          where: {
            id: teamId,
          },
        }),
        prisma.teamLeader.findUnique({
          where: {
            id: currentTl,
          },
        }),
      ]);
      if (!data || !team || !tl) {
        throw new GraphQLError('Voter or Team or Team Leader not found', {
          extensions: { code: 'VOTER_NOT_FOUND' },
        });
      }
      console.log({ data, team, tl });

      await prisma.$transaction([
        prisma.teamLeader.update({
          where: { id: tl.id },
          data: {
            votersId: data.id,
          },
        }),
        prisma.voters.update({
          where: {
            id: tl.votersId as string,
          },
          data: {
            teamId: null,
            candidatesId: null,
            level: 0,
          },
        }),
        prisma.voters.update({
          where: {
            id: data.id,
          },
          data: {
            teamId: team.id,
            level: 1,
            candidatesId: team.candidatesId,
          },
        }),
      ]);
      return 'OK';
    },
    deleteTeams: async () => {
      await prisma.qRcode.deleteMany();
      await prisma.team.deleteMany();
      return 'OK';
    },
    assignBarangayIDnumber: async (_, { zipCode }) => {
      const barangays = await prisma.barangays.findMany({
        where: {
          municipalId: zipCode,
        },
        orderBy: {
          name: 'asc',
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

      return 'OK';
    },
    assignTeam: async (_, { team }) => {
      const resultList: RejectListedProps[] = [];
      const members = [...team.members, team.barangayCoorId, team.purokCoorId, team.teamLeaderId];

      const barangay = await prisma.barangays.findFirst({
        where: {
          number: parseInt(team.barangayId, 10),
        },
      });

      if (!barangay) {
        throw new GraphQLError('Barangay not found');
      }

      const supporting = await prisma.candidates.findFirst({
        where: {
          code: { contains: 'jml', mode: 'insensitive' },
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
        voterId?: string,
      ) => {
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
              hubId: 'Unknown',
              level,
              candidatesId: supporting?.id,
              teamId: teamData.id,
            },
          });
          console.log('Created Leader: ', leaderMetaData);

          await prisma.team.update({
            where: {
              id: teamData.id,
            },
            data: {
              teamLeaderId: leaderMetaData.id,
            },
          });
          console.log('Created Team: ', teamData);

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

          console.log('Updated Voter: ', updatedVoter);
        }

        return leader;
      };

      if (!teamLeader) {
        resultList.push({
          id: 'Unknown',
          firstname: 'Unknown',
          lastname: 'Unknown',
          municipalsId: 1111,
          barangaysId: 'Unknown',
          reason: 'Wala sa Master list',
          level: 1,
          idNumber: team.teamLeaderId,
          code: 1,
        });
      }

      if (!purokCoor) {
        resultList.push({
          id: 'Unknown',
          firstname: 'Unknown',
          lastname: 'Unknown',
          municipalsId: 1111,
          barangaysId: 'Unknown',
          reason: 'Wala sa Master list',
          level: 2,
          idNumber: team.purokCoorId,
          code: 1,
        });
      }

      if (!barangayCoor) {
        resultList.push({
          id: 'Unknown',
          firstname: 'Unknown',
          lastname: 'Unknown',
          municipalsId: team.zipCode,
          barangaysId: team.barangayId,
          reason: 'Wala sa Master list',
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
        barangayCoor?.id,
      );
      const purokCoorData = await handleLeaderInfo(
        team.purokCoorId,
        2,
        barangayCoorData?.teamId as string,
        purokCoor?.purokId as string,
        purokCoor?.id,
      );
      const teamLeaderData = await handleLeaderInfo(
        team.teamLeaderId,
        1,
        purokCoorData?.teamId as string,
        purokCoorData?.purokId,
        teamLeader?.id,
      );

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
              reason: 'Wala sa angkop na lugar.',
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
              reason: 'May team na',
              level: member.level,
              idNumber: member.idNumber,
              code: 1,
            });
            continue;
          }

          if (member.oor === 'YES') {
            resultList.push({
              id: member.id,
              firstname: member.firstname,
              lastname: member.lastname,
              municipalsId: member.municipalsId,
              barangaysId: member.barangaysId,
              reason: 'Wala sa ankop na lugar.',
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
              reason: 'Sumakabilang buhay na.',
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
            reason: 'OK',
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

      await prisma.validatedTeamMembers.createMany({
        data: teamMembers,
        skipDuplicates: true,
      });

      return JSON.stringify(teamMembers);
    },

    composeTeam: async (_, { team, code }) => {
      let successCount = 0;
      const resultList: RejectListedProps[] = [];
      const members = [team.barangayCoorId, team.purokCoorId, team.teamLeaderId];

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
          code: { contains: 'jml', mode: 'insensitive' },
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
        headIdTwo?: string,
      ) => {
        try {
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

          const newLeader = await prisma.teamLeader.create({
            data: {
              votersId: voterId,
              municipalsId: team.zipCode,
              barangaysId: barangay.id,
              teamId: null,
              candidatesId: supporting?.id,
              level,
              hubId: 'unknown',
              handle: 0,
              purokId: purokId,
              barangayCoorId: level === 2 || level === 1 ? headIdOne : null,
              purokCoorsId: level === 1 ? headIdTwo : null,
            },
          });

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

          await prisma.teamLeader.update({
            where: { id: newLeader.id },
            data: {
              teamId: newTeam.id,
            },
          });

          await prisma.voters.update({
            where: {
              id: voterId,
            },
            data: {
              teamId: teamId,
              level,
              candidatesId: supporting?.id,
            },
          });

          return { ...newLeader, teamId: newTeam.id };
        } catch (error) {
          console.error('Something went wrong:', error);
          return null;
        }
      };
      //Figure Heads Creation
      //creation BC
      const barangayCoorData = await handleGetLeaderData(
        team.barangayCoorId,
        3,
        barangayCoor?.id as string,
        barangayCoor?.purokId as string,
        undefined,
        undefined,
      );
      //creation PC
      const purokCoorData = await handleGetLeaderData(
        team.purokCoorId,
        2,
        purokCoor?.id as string,
        purokCoor?.purokId as string,
        barangayCoorData?.teamId as string,
        barangayCoorData?.id,
      );
      //creation TL
      const teamLeaderData = await handleGetLeaderData(
        team.teamLeaderId,
        1,
        teamLeader?.id as string,
        teamLeader?.purokId as string,
        purokCoorData?.teamId as string,
        barangayCoorData?.id,
        purokCoorData?.id,
      );

      const tlTeam = await prisma.team.findUnique({
        where: {
          id: teamLeaderData?.teamId as string,
        },
      });

      const temp = await prisma.validatedTeams.create({
        data: {
          purokId: purokCoor?.purokId as string,
          barangaysId: barangay.id,
          municipalsId: team.zipCode,
          teamLeaderId: teamLeaderData?.id,
        },
      });

      const processedVoters = new Set<string>();
      const alreadyInTeam: {
        votersId: string;
        teamId: string;
        foundTeamId: string | undefined | null;
        municipalsId: number;
        barangaysId: string;
      }[] = [];

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
          const inAlreadList = new Set(alreadyInTeam.map((item) => item.votersId));

          if (!voter) {
            if (!processedVoters.has(member)) {
              resultList.push({
                id: undefined,
                firstname: 'Unknown',
                lastname: 'Unknown',
                municipalsId: team.zipCode,
                barangaysId: barangay.id,
                reason: 'Wala sa master list',
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
                reason: 'Wala sa angkop na lugar.',
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
            continue;
          }

          if (voter.teamId) {
            if (!processedVoters.has(voter.id)) {
              // resultList.push({
              //   id: voter.id,
              //   firstname: voter.firstname,
              //   lastname: voter.lastname,
              //   municipalsId: voter.municipalsId,
              //   barangaysId: voter.barangaysId,
              //   reason: `May team na (${handleLevel(
              //     votersTeam?.TeamLeader?.voter?.level as number
              //   )}): ${votersTeam?.TeamLeader?.voter?.lastname}, ${
              //     votersTeam?.TeamLeader?.voter?.firstname
              //   }`,
              //   level: voter.level,
              //   idNumber: voter.idNumber,
              //   code: 1,
              // });
              processedVoters.add(voter.id);
              alreadyInTeam.push({
                votersId: voter.id,
                teamId: voter.teamId as string, // Voter's current team
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                foundTeamId: tlTeam?.id,
              });

              continue;
            }
          }

          if (voter.oor === 'YES') {
            if (!processedVoters.has(voter.id)) {
              resultList.push({
                id: voter.id,
                firstname: voter.firstname,
                lastname: voter.lastname,
                municipalsId: voter.municipalsId,
                barangaysId: voter.barangaysId,
                reason: 'Wala sa ankop na lugar (OR).',
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
                reason: 'Sumakabilang buhay na.',
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
              reason: 'OK',
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
          successCount++;
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
        .filter((item) => item.reason !== 'OK')
        .map((item) => {
          return {
            desc: item.reason,
            votersId: item.id,
            usersUid: undefined,
            questionable: true,
          };
        });

      const totalIssues = resultList.reduce((base, item) => {
        if (item.reason !== 'OK') {
          return base + 1;
        }
        return base;
      }, 0);

      await prisma.$transaction([
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
        prisma.duplicateteamMembers.createMany({
          data: alreadyInTeam.map((item) => ({
            votersId: item.votersId,
            teamId: item.teamId,
            foundTeamId: item.foundTeamId,
            municipalsId: item.municipalsId,
            barangaysId: item.barangaysId,
          })),
        }),
      ]);
      console.log({ successCount });

      return JSON.stringify(teamMembers);
    },
    clearTeamRecords: async () => {
      await prisma.validatedTeams.deleteMany();
      return 'OK';
    },
    multiSelectVoter: async (_, { teamId, members, method }) => {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });
      console.log('team: ', team && team.level);

      if (method) {
        await prisma.voters.updateMany({
          where: { id: { in: members } },
          data: { teamId: teamId, candidatesId: team?.candidatesId, level: 0 },
        });
        return 'OK';
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
      console.log('Deleted Leaders: ', deletedLeaders);

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
      console.log('Deleted Teams: ', deletedTeams);

      return 'OK';
    },
    removeTeam: async (_, { id }) => {
      const [tl] = await prisma.$transaction([
        prisma.teamLeader.findFirst({
          where: {
            teamId: id,
          },
        }),
      ]);
      console.log({ tl });

      const tlVoter = await prisma.voters.findFirst({
        where: {
          id: tl?.votersId as string,
        },
      });
      console.log({ tlVoter });

      await prisma.$transaction([
        prisma.teamLeaderAttendance.deleteMany({
          where: {
            teamLeaderId: tl?.id,
          },
        }),
        prisma.voters.updateMany({
          where: {
            teamId: id,
          },
          data: {
            teamId: null,
            candidatesId: null,
            level: 0,
          },
        }),
        prisma.teamLeader.deleteMany({
          where: {
            teamId: id,
          },
        }),

        prisma.team.delete({
          where: {
            id,
          },
        }),
        prisma.voters.updateMany({
          where: {
            id: tlVoter?.id as string,
          },
          data: {
            teamId: null,
            candidatesId: null,
            level: 0,
          },
        }),
      ]);

      return 'OK';
    },
    removeAllTeams: async () => {
      await prisma.team.deleteMany();
      return 'OK';
    },
    createCustomOption: async (_, { id }) => {
      await prisma.customOption.create({
        data: {
          value: '0',
          queriesId: id,
        },
      });
      return 'OK';
    },
    resetTeamList: async (_, { zipCode, barangayId }) => {
      console.log({ zipCode, barangayId });

      const filter: any = {};
      if (zipCode) {
        filter.municipalsId = parseInt(zipCode, 10);
      }
      if (barangayId) {
        filter.barangay = {
          number: parseInt(barangayId, 10),
        };
      }
      await prisma.$transaction([
        prisma.voters.updateMany({
          where: {
            teamId: { not: null },
            ...filter,
          },
          data: {
            teamId: null,
            candidatesId: null,
            level: 0,
          },
        }),
        prisma.team.deleteMany({
          where: filter,
        }),
        prisma.teamLeader.deleteMany({
          where: {
            ...filter,
          },
        }),
        prisma.voterRecords.deleteMany({
          where: {
            voter: filter,
          },
        }),
        prisma.duplicateteamMembers.deleteMany({
          where: filter,
        }),
      ]);
      return 'OK';
    },
    teamMerger: async (_, { firstId, secondId }) => {
      console.log({ firstId, secondId });

      const [first, second, teamSecond] = await prisma.$transaction([
        prisma.teamLeader.findUnique({
          where: { id: firstId },
          include: {
            voter: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        }),
        prisma.teamLeader.findUnique({
          where: { id: secondId },
          include: {
            voter: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        }),
        prisma.team.findFirst({
          where: { teamLeaderId: secondId },
        }),
      ]);

      if (!first || !second || !teamSecond) {
        throw new GraphQLError('Could not find any team leader or associated team');
      }

      console.log({ first, second, teamSecond });

      await prisma.$transaction([
        prisma.voters.updateMany({
          where: {
            teamId: teamSecond.id, // Voters associated with the second team
          },
          data: {
            teamId: first.teamId, // Reassign to the first team
          },
        }),

        prisma.team.update({
          where: {
            id: teamSecond.id,
          },
          data: {
            teamLeaderId: firstId,
          },
        }),
        prisma.teamLeader.delete({
          where: {
            id: secondId,
          },
        }),
      ]);

      return 'OK';
    },
    validationUpdate: async (
      _,
      {
        validateDuplicate,
        votersToTransfer,
        validatedDelisted,
        votersToUpdate,
        newVoterRecord,
        appoinments,
        untrackedList,
        recordToDelete,
        validatedPerson,
        validatedTeams,
        teamExcluded,
        teamToMerge,
        toSplit,
        accountTeamHoldings,
      },
    ) => {
      console.log({
        validateDuplicate,
        votersToTransfer,
        validatedDelisted,
        votersToUpdate,
        newVoterRecord,
        appoinments,
        untrackedList,
        recordToDelete,
        validatedPerson,
        validatedTeams,
        teamExcluded,
        teamToMerge,
        toSplit,
        accountTeamHoldings,
      });

      if (votersToTransfer.length > 0) {
        try {
          const voterIds = votersToTransfer.map((item) => item.votersId);
          const teamIds = votersToTransfer.map((item) => item.toTeamId);

          const [voters, teams, duplicateRecords] = await prisma.$transaction([
            prisma.voters.findMany({
              where: { id: { in: voterIds } },
            }),
            prisma.team.findMany({
              where: { id: { in: teamIds } },
              include: {
                TeamLeader: {
                  include: {
                    voter: true,
                  },
                },
              },
            }),
            prisma.duplicateteamMembers.findMany({
              where: { votersId: { in: voterIds } }, // Fetch all duplicate records first
            }),
          ]);
          console.log({ teams });

          if (voters.length > 0) {
            console.log({ voters });

            const updatePromises = voters
              .map((voter) => {
                console.log('Team OK 0');
                const votersTeam = votersToTransfer.find((item) => item.votersId === voter.id);
                if (!votersTeam) return null;
                console.log('Team OK 1');
                const toTeam = teams.find((item) => item.id === votersTeam.toTeamId);
                console.log('Team TO: ', toTeam);

                if (!toTeam || voter.teamId === toTeam.id) return null; // Skip if already in the correct team
                console.log('Team OK 2');

                return prisma.voters.update({
                  data: { teamId: toTeam.id },
                  where: { id: voter.id },
                });
              })
              .filter(Boolean); // Remove null values

            // const deletePromises = duplicateRecords.map((record) =>
            //   prisma.duplicateteamMembers.delete({
            //     where: { id: record.id },
            //   })
            // );

            await Promise.all([...updatePromises]); // Batch process updates and deletes
            console.log('OK');
          }
        } catch (error) {
          console.error('Error transferring voters:', error);
        }
      }

      if (validateDuplicate.length > 0) {
        const duplicatedIds = validateDuplicate.map((item) => item.duplicateteamMemberId);
        const duplicates = await prisma.duplicateteamMembers.findMany({
          where: {
            id: { in: duplicatedIds },
          },
        });
        console.log({ duplicates });

        if (duplicates.length > 0) {
          await prisma.duplicateteamMembers.deleteMany({
            where: {
              id: { in: duplicates.map((item) => item.id) },
            },
          });
        } else {
          console.log('No Duplicates to remove');
        }
      }

      //voter's to exclude
      if (teamExcluded.length > 0) {
        const voters = await prisma.voters.findMany({
          where: {
            id: { in: teamExcluded.map((item) => item.votersId as string) },
          },
        });

        const votersIdSet = new Set(voters.map((voter) => voter.id));
        const votersToExclude = teamExcluded.filter((voter) =>
          votersIdSet.has(voter.votersId as string),
        );

        if (votersToExclude.length > 0) {
          const groupedTeams: Record<string, any> = {};

          votersToExclude.forEach((voter) => {
            if (!groupedTeams[voter.teamId as string]) {
              groupedTeams[voter.teamId as string] = { teamId: voter.teamId, voters: [] };
            }
            groupedTeams[voter.teamId as string].voters.push({ ...voter });
          });

          const groupedTeamsArray = Object.values(groupedTeams);

          for (const team of groupedTeamsArray) {
            try {
              const teamRec = await prisma.teamUpdateArchive.create({
                data: {
                  teamId: team.teamId,
                  result: team.voters.length,
                  level: 0,
                  method: 0,
                },
              });

              await prisma.teamMembersTransac.createMany({
                data: team.voters.map((voter: { votersId: any }) => ({
                  votersId: voter.votersId,
                  teamUpdateArchiveId: teamRec.id,
                })),
              });

              console.log('✅ Team update successfully recorded');
            } catch (error) {
              console.error('❌ Error processing team:', error);
            }
          }

          await prisma.$transaction([
            prisma.blackList.createMany({
              data: votersToExclude.map((item) => ({
                votersId: item.votersId as string,
                municipalsId: 4903,
                barangaysId: item.barangaysId as string,
              })),
            }),
            prisma.voters.updateMany({
              where: {
                id: { in: votersToExclude.map((item) => item.votersId as string) },
              },
              data: {
                teamId: null,
                candidatesId: null,
                level: 0,
              },
            }),
          ]);
        }
      }

      if (votersToUpdate.length > 0) {
        // Fetch voters using votersId instead of item.id
        const voters = await prisma.voters.findMany({
          where: {
            id: { in: votersToUpdate.map((item) => item.votersId) },
          },
        });

        const votersMap = new Map(voters.map((voter) => [voter.id, voter]));

        // Group updates by votersId
        const groupedVotersToUpdate: Record<string, any> = {};

        votersToUpdate.forEach((item) => {
          if (!groupedVotersToUpdate[item.votersId]) {
            groupedVotersToUpdate[item.votersId] = {
              votersId: item.votersId,
              props: [],
            };
          }
          groupedVotersToUpdate[item.votersId].props.push({
            id: item.id,
            props: item.props,
            type: item.type,
            value: item.value,
            action: item.action,
            teamId: item.teamId,
          });
        });

        for (const item of Object.values(groupedVotersToUpdate)) {
          const voter = votersMap.get(item.votersId);
          if (!voter) continue; // Ensure voter exists

          // Only keep properties that need updating
          const propsToUpdate = item.props.filter(
            (prop: { type: string; value: string; props: string | number }) => {
              const valueForUpdate = handleDataType(prop.type, prop.value);
              const voterPropsTyped = voter as Record<string, any>;

              // Ensure both are strings for comparison safety
              return String(voterPropsTyped[prop.props]) !== String(valueForUpdate);
            },
          );

          if (propsToUpdate.length > 0) {
            const updateData: Record<string, any> = {};
            propsToUpdate.forEach(
              (prop: { props: string | number; type: string; value: string }) => {
                updateData[prop.props] = handleDataType(prop.type, prop.value);
              },
            );

            await prisma.voters.update({
              where: { id: item.votersId },
              data: updateData,
            });
            console.log('----------->Voter update successfully');
          } else {
            console.log(`No changes for voter ${item.votersId}`);
          }
        }
      } else {
        console.log('No voters to update.');
      }

      //save validated Teams
      if (validatedTeams.length > 0) {
        console.log({ validatedTeams });

        // Fetch only existing teams
        const existingTeams = await prisma.team.findMany({
          where: {
            id: { in: validatedTeams.map((item) => item.teamId as string) },
          },
          select: { id: true },
        });

        const existingTeamIds = new Set(existingTeams.map((team) => team.id));

        const validTeamsToInsert = validatedTeams.filter((item) =>
          existingTeamIds.has(item.teamId as string),
        );
        console.log({ validTeamsToInsert });

        if (validTeamsToInsert.length > 0) {
          await prisma.accountValidateTeam.createMany({
            data: validTeamsToInsert.map((item) => ({
              id: item.id,
              usersUid: item.accountId,
              teamId: item.teamId,
              municipalsId: item.municipalsId ? parseInt(item.municipalsId, 10) : null,
              barangaysId: item.barangaysId,
              timstamp: new Date(item.timestamp as string).toISOString(),
            })),
            skipDuplicates: true,
          });
          console.log('Added New Valdiated Teams');
        } else {
          console.log('No valid teams found for insertion.');
        }
      }

      if (validatedPerson.length > 0) {
        const voterIds = validatedPerson.map((item) => item.votersId as string);

        const voters = await prisma.voters.findMany({
          where: {
            id: { in: voterIds },
          },
        });

        if (voters.length > 0) {
          const existingMembers = await prisma.valdilatedMembers.findMany({
            where: {
              votersId: { in: voterIds },
            },
            select: {
              votersId: true,
            },
          });

          const existingVoterIds = existingMembers.map((member) => member.votersId);

          const newVoters = voters.filter((voter) => !existingVoterIds.includes(voter.id));

          if (newVoters.length > 0) {
            await prisma.valdilatedMembers.createMany({
              data: newVoters.map((item) => ({
                votersId: item.id,
                teamId: item.teamId,
                timestamp: new Date(item.timestamp).toISOString(),
              })),
            });
            console.log('----------->Validated members successfully');
            console.log('Validated Members added.');
          } else {
            console.log('No new validated members to add.');
          }
        } else {
          console.log('No Validated Voters to record');
        }
      }

      if (untrackedList.length > 0) {
        console.log('Original untracked list:', untrackedList);

        const voterIds = untrackedList.map((item) => item.votersId as string);

        // Fetch existing voters
        const voters = await prisma.voters.findMany({
          where: {
            id: { in: voterIds },
          },
          select: { id: true },
        });
        const untrackedVoterList = await prisma.untrackedVoter.findMany({
          where: {
            votersId: { in: voters.map((item) => item.id) },
          },
        });
        const untrackedListIds = new Set(untrackedVoterList.map((item) => item.votersId));

        const newUntrackedList = untrackedList.filter(
          (item) => !untrackedListIds.has(item.votersId),
        );

        console.log('New untracked voters:', newUntrackedList);

        if (newUntrackedList.length > 0) {
          const list = await prisma.untrackedVoter.createMany({
            data: newUntrackedList.map((item) => ({
              id: item.id,
              votersId: item.votersId,
              timestamp: new Date(item.timestamp).toISOString(),
              teamId: item.team_Id,
              municipalsId: item.municipalsId ? parseInt(item.municipalsId, 10) : null,
              barangaysId: item.barangaysId,
              usersUid: item.account_id,
            })),
            skipDuplicates: true,
          });
          console.log({ list });

          console.log('Added new untracked voters.');
        } else {
          console.log('No new untracked voters to add.');
        }
      }

      if (newVoterRecord.length) {
        console.log({ newVoterRecord });

        const records = await prisma.voterRecords.findMany({
          where: {
            id: { in: newVoterRecord.map((item) => item.id) },
          },
        });
        const existingRecordIds = records.map((item) => item.id);
        const newRecords = newVoterRecord.filter((item) => !existingRecordIds.includes(item.id));
        console.log({ newRecords });

        if (newRecords.length > 0) {
          await prisma.voterRecords.createMany({
            data: newRecords.map((item) => {
              return {
                id: item.id,
                type: item.type,
                votersId: item.voter_id,
                questionable: item.questionable === 1 ? true : false,
                desc: item.desc ?? 'Questionable',
                usersUid: item.account_id,
              };
            }),
            skipDuplicates: true,
          });
          console.log('Multi Inserted');
        } else {
          console.log('No new records found!');
        }
      }
      if (toSplit.length > 0) {
        const [teams, voters] = await prisma.$transaction([
          prisma.team.findMany({
            where: {
              id: { in: toSplit.map((item) => item.teamId as string) },
            },
            include: {
              _count: {
                select: {
                  voters: true,
                },
              },
              TeamLeader: {
                include: {
                  purokCoors: {
                    select: {
                      teamId: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.voters.findMany({
            where: {
              id: { in: toSplit.map((item) => item.votersId as string) },
            },
          }),
        ]);

        const teamToSplitIds = new Set(teams.map((item) => item.id));
        const validTeamsToSplit = toSplit.filter((item) =>
          teamToSplitIds.has(item.teamId as string),
        );
        if (validTeamsToSplit.length) {
          for (let team of toSplit) {
            const teamToSplit = teams.find((item) => item.id === team.teamId);
            if (!teamToSplit) continue;
            if (teamToSplit._count.voters <= 9) continue;
          }
        }
      }

      return 'OK';
    },
    resetAccountTeamhandle: async () => {
      await prisma.accountHandleTeam.deleteMany();
      await prisma.accountValidateTeam.deleteMany();
      return 'OK';
    },
    assignedTeamsOnAccount: async (_, { userId, zipCode, barangaysId, from, take, max, min }) => {
      console.log('Params ,', { userId, zipCode, barangaysId, from, take, max, min });

      const barangay = await prisma.barangays.findFirst({
        where: {
          municipalId: zipCode,
          number: barangaysId,
        },
      });
      if (!barangay) {
        throw new GraphQLError('Barangay not found.');
      }
      const teams = await prisma.team.findMany({
        where: {
          barangaysId: barangay.id,
          municipalsId: zipCode,
          AccountHandleTeam: {
            none: {},
          },
        },
        include: {
          _count: {
            select: {
              voters: true,
            },
          },
        },
        skip: from - 1,
        take,
        orderBy: {
          TeamLeader: {
            voter: {
              lastname: 'asc',
            },
          },
        },
      });

      const filteredTeams = teams.filter(
        (team) => team._count.voters >= min && team._count.voters <= max,
      );
      console.log('Checked: ', filteredTeams.length);

      await prisma.accountHandleTeam.createMany({
        data: filteredTeams.map((item) => {
          return {
            usersUid: userId,
            teamId: item.id,
            municipalsId: item.municipalsId,
            barangaysId: item.barangaysId,
          };
        }),
        skipDuplicates: true,
      });
      return 'OK';
    },
    deleteAssignTeam: async (_, { id }) => {
      console.log('Deleting ID:', id);

      const existingRecord = await prisma.accountHandleTeam.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        throw new Error(`Record with id ${id} not found.`);
      }

      await prisma.accountHandleTeam.delete({
        where: { id },
      });

      return 'OK';
    },
    selectedTeamAssign: async (_, { ids, userId }) => {
      console.log(ids, userId);
      const teams = await prisma.team.findMany({
        where: {
          id: { in: ids },
          AccountHandleTeam: {
            none: {},
          },
        },
      });

      await prisma.accountHandleTeam.createMany({
        data: teams.map((item) => {
          return {
            usersUid: userId,
            teamId: item.id,
            municipalsId: item.municipalsId,
            barangaysId: item.barangaysId,
          };
        }),
      });
      console.log(JSON.stringify(teams, null, 2));

      return 'OK';
    },
    creatCandidateBatch: async (_, {}) => {
      await prisma.candidates.findMany({
        where: {},
      });
      return 'OK';
    },
    markTeamVerified: async (_, { teamId, accountID }) => {
      const [team, validatedTeam] = await prisma.$transaction([
        prisma.team.findUnique({
          where: {
            id: teamId,
          },
        }),
        prisma.accountValidateTeam.findFirst({
          where: {
            teamId: teamId,
            usersUid: accountID,
          },
        }),
      ]);
      if (!team) {
        throw new GraphQLError(`Team not found!`);
      }
      if (!validatedTeam) {
        const data = await prisma.accountValidateTeam.create({
          data: {
            teamId: team.id,
            municipalsId: team.municipalsId,
            barangaysId: team.barangaysId,
            usersUid: accountID,
          },
        });
        console.log(data);

        return 'OK';
      }
      await prisma.accountValidateTeam.delete({
        where: {
          id: validatedTeam?.id,
        },
      });

      return 'OK';
    },
    markMemberVerified: async (_, { memberId, accountID }) => {
      console.log({ memberId });

      const [members, validatedTeam] = await prisma.$transaction([
        prisma.voters.findMany({
          where: {
            id: { in: memberId },
          },
        }),
        prisma.valdilatedMembers.findMany({
          where: {
            votersId: { in: memberId },
          },
        }),
      ]);
      if (!members) {
        throw new GraphQLError(`Member not found!`);
      }

      if (validatedTeam.length === 0) {
        const response = await prisma.valdilatedMembers.createMany({
          data: members.map((item) => {
            return {
              votersId: item.id,
              teamId: item.teamId,
            };
          }),
        });

        return 'OK';
      }
      console.log('Not');

      await prisma.valdilatedMembers.deleteMany({
        where: {
          id: { in: validatedTeam.map((item) => item.id) },
        },
      });

      return 'OK';
    },
    updateTeamMemberProps: async (_, { memberId, props }) => {
      const voters = await prisma.voters.findMany({
        where: {
          id: { in: memberId },
        },
      });
      if (voters.length > 0) {
        for (let item of voters) {
          if (!item) {
            continue;
          }
          if (props === 'status') {
            await prisma.voters.updateMany({
              where: {
                id: { in: memberId },
              },
              data: {
                status: item.status === 1 ? 0 : 1,
              },
            });
            continue;
          }
          const voterProps = item as Record<string, any>;
          const value = voterProps[props] === 'YES' ? 'NO' : 'YES';
          await prisma.voters.updateMany({
            where: {
              id: { in: voters.map((item) => item.id) },
            },
            data: {
              [props]: value,
            },
          });
        }
      }
      return 'OK';
    },
    memberExclude: async (_, { membersId }) => {
      const [voters, votersRecord, blackList] = await prisma.$transaction([
        prisma.voters.findMany({
          where: {
            id: { in: membersId },
          },
        }),
        prisma.voterRecords.findMany({
          where: {
            votersId: { in: membersId },
          },
        }),
        prisma.blackList.findMany({
          where: {
            votersId: { in: membersId },
          },
        }),
      ]);
      const blackListIDs = new Set(blackList.map((item) => item.votersId));
      const newToBlackList = voters.filter((voter) => !blackListIDs.has(voter.id));
      const teamId = voters[0].teamId;
      if (voters.length > 0) {
        const [, , teamUpdate] = await prisma.$transaction([
          prisma.voters.updateMany({
            where: {
              id: { in: voters.map((item) => item.id) },
            },
            data: {
              teamId: null,
              candidatesId: null,
            },
          }),
          prisma.voterRecords.deleteMany({
            where: {
              id: { in: votersRecord.map((item) => item.id) },
            },
          }),
          prisma.teamUpdateArchive.create({
            data: {
              teamId: teamId,
              result: voters.length,
              method: 0,
              level: 0,
            },
          }),
          prisma.blackList.createMany({
            data: newToBlackList.map((item) => {
              return {
                votersId: item.id,
                municipalsId: item.municipalsId,
                barangaysId: item.barangaysId,
              };
            }),
          }),
        ]);
        await prisma.teamMembersTransac.createMany({
          data: voters.map((item) => {
            return {
              votersId: item.id,
              teamUpdateArchiveId: teamUpdate.id,
            };
          }),
        });
      }

      return 'OK';
    },
    swapVoters: async (_, { voterOneId, voterTwoId }) => {
      if (!voterOneId || !voterTwoId) {
        throw new GraphQLError('Bad Request');
      }

      // Fetch voters
      const [voterOne, voterTwo] = await prisma.$transaction([
        prisma.voters.findUnique({
          where: { id: voterOneId },
        }),
        prisma.voters.findUnique({
          where: { id: voterTwoId },
        }),
      ]);

      console.log({ voterOne, voterTwo });

      if (!voterOne || !voterTwo) {
        throw new GraphQLError('Voters not found!');
      }

      // Fetch team leaders (if they exist)
      const [firstTl, secondTl] = await prisma.$transaction([
        prisma.teamLeader.findFirst({
          where: { votersId: voterOne.id },
          include: { voter: true },
        }),
        prisma.teamLeader.findFirst({
          where: { votersId: voterTwo.id },
          include: { voter: true },
        }),
      ]);

      // Case when both voters have a level > 0 (direct level swap)
      if (voterOne.level > 0 && voterTwo.level > 0) {
        await prisma.$transaction([
          prisma.voters.update({
            where: { id: voterOne.id },
            data: { level: voterTwo.level },
          }),
          prisma.voters.update({
            where: { id: voterTwo.id },
            data: { level: voterOne.level },
          }),
        ]);

        if (firstTl && secondTl) {
          await prisma.$transaction([
            prisma.teamLeader.update({
              where: { id: firstTl.id },
              data: { votersId: voterTwo.id },
            }),
            prisma.teamLeader.update({
              where: { id: secondTl.id },
              data: { votersId: voterOne.id },
            }),
          ]);
        }
        return 'OK';
      }

      // Handle cases where one or both voters do not have a direct level
      if (secondTl) {
        await prisma.$transaction([
          prisma.teamLeader.update({
            where: { id: secondTl.id },
            data: { votersId: voterOne.id },
          }),
          prisma.voters.update({
            where: { id: secondTl.votersId as string },
            data: { teamId: voterOne.teamId || undefined, level: voterOne.level },
          }),
        ]);
        await prisma.voters.update({
          where: { id: voterOne.id },
          data: { teamId: voterTwo.teamId, level: secondTl.level },
        });
      }

      return 'OK';
    },
    markUntracked: async (_, { memberId }) => {
      const voters = await prisma.voters.findMany({
        where: {
          id: { in: memberId },
        },
      });

      const untrackedList = await prisma.untrackedVoter.findMany({
        where: {
          votersId: { in: voters.map((item) => item.id) },
        },
      });
      const untrackedIDs = new Set(untrackedList.map((item) => item.votersId));
      const newToUntracked = voters.filter((voter) => !untrackedIDs.has(voter.id));
      const toRemoveOnUntracked = voters.filter((voter) => untrackedIDs.has(voter.id));
      if (newToUntracked.length > 0) {
        await prisma.untrackedVoter.createMany({
          data: newToUntracked.map((item) => {
            return {
              votersId: item.id,
              municipalsId: item.municipalsId,
              barangaysId: item.barangaysId,
              teamId: item.teamId,
            };
          }),
        });
      }
      if (toRemoveOnUntracked.length > 0) {
        await prisma.untrackedVoter.deleteMany({
          where: {
            votersId: { in: toRemoveOnUntracked.map((item) => item.id) },
          },
        });
      }
      return 'OK';
    },
    transferVotersArea: async (_, { memberId, zipCode, barangay }) => {
      const [voters] = await prisma.$transaction([
        prisma.voters.findMany({
          where: {
            municipalsId: 4904,
          },
        }),
      ]);

      if (voters.length > 0) {
        await prisma.$transaction([
          prisma.voters.updateMany({
            where: {
              id: { in: voters.map((item) => item.id) },
            },
            data: {
              municipalsId: 4905,
              barangaysId: 'acccf8e6-a6f2-4a62-bbff-9292f98a5bca',
              candidatesId: null,
              teamId: null,
            },
          }),
        ]);
      }

      return 'OK';
    },
    resetPassword: async (_, { id, newPassword }) => {
      const user = await prisma.users.findUnique({
        where: {
          uid: id,
        },
      });

      if (!user) {
        throw new GraphQLError('User not found');
      }
      const sanitize = removeAllSpaces(newPassword);
      const hashedPassword = await argon2.hash(sanitize);
      await prisma.users.update({
        where: {
          uid: user.uid,
        },
        data: {
          password: hashedPassword,
        },
      });
      return 'OK';
    },
    updateCandidate: async (_, { id }) => {
      const candidate = await prisma.candidates.findUnique({
        where: {
          id: id,
        },
      });
      if (!candidate) {
        throw new GraphQLError('Could not find candidate');
      }
      await prisma.candidates.update({
        where: {
          id: candidate.id,
        },
        data: {
          municipalsId: 4903,
        },
      });
      return 'OK';
    },
    tranCandidate: async () => {
      const jpCan = await prisma.candidates.findFirst({
        where: {
          firstname: 'Joey',
        },
      });
      if (!jpCan) {
        throw new GraphQLError('Could not find Joey');
      }
      console.log(jpCan);

      await prisma.$transaction([
        prisma.voters.updateMany({
          where: {
            municipalsId: 4903,
            teamId: { not: null },
          },
          data: {
            candidatesId: jpCan.id,
          },
        }),
        prisma.teamLeader.updateMany({
          where: {
            municipalsId: 4903,
            teamId: { not: null },
          },
          data: {
            candidatesId: jpCan.id,
          },
        }),
        prisma.team.updateMany({
          where: {
            municipalsId: 4903,
          },
          data: {
            candidatesId: jpCan.id,
          },
        }),
      ]);
      return 'OK';
    },
    transferGroup: async (_, { id, toId }) => {
      const [team, toTeam, headers] = await prisma.$transaction([
        prisma.team.findUnique({
          where: {
            id,
          },
        }),
        prisma.team.findUnique({
          where: {
            id: toId,
          },
        }),
        prisma.teamLeader.findFirst({
          where: {
            teamId: toId,
          },
        }),
      ]);

      const voters = await prisma.voters.findMany({
        where: {
          teamId: id,
        },
      });
      const asMember = await prisma.teamLeader.findMany({
        where: {
          votersId: { in: voters.map((item) => item.id) },
          level: {
            lte: 2,
            gte: 1,
          },
        },
      });

      if (!team || !toTeam || voters.length === 0 || asMember.length === 0 || !headers) {
        throw new GraphQLError('Current Team or target team not found');
      }

      let data: any = {};
      if (team.level === 1) {
        data = {
          purokCoorsId: headers.purokCoorsId,
          barangayCoorId: headers.barangayCoorId,
        };
      } else if (team.level === 2) {
        data = {
          barangayCoorId: headers.barangayCoorId,
        };
      }
      await prisma.$transaction([
        prisma.teamLeader.update({
          where: {
            id: team.teamLeaderId as string,
          },
          data: {
            teamId: toTeam.id,
          },
        }),
        prisma.voters.updateMany({
          where: {
            id: { in: voters.map((item) => item.id) },
          },
          data: {
            teamId: toTeam.id,
          },
        }),
        prisma.teamLeader.updateMany({
          where: {
            id: { in: asMember.map((item) => item.id) },
          },
          data: data,
        }),
      ]);
      return 'Ok';
    },
    transferSelectMembers: async (_, { ids, toTeam, level, currTL, toTL }) => {
      let data: any = {};

      const [voters, toTeams, toTeamLeader] = await prisma.$transaction([
        prisma.voters.findMany({
          where: {
            id: { in: ids },
            level: level - 1,
          },
        }),
        prisma.team.findUnique({
          where: {
            id: toTeam,
          },
        }),
        prisma.teamLeader.findUnique({
          where: {
            id: toTL,
          },
        }),
      ]);

      let tls: TeamLeader[] = [];
      if (level === 1 || level === 2) {
        tls = await prisma.teamLeader.findMany({
          where: {
            votersId: { in: voters.map((item) => item.id) },
          },
        });
      }

      if (voters.length === 0 || !toTeams || !toTeamLeader) {
        throw new GraphQLError('Required not found');
      }
      if (level === 1) {
        data = {
          barangayCoorId: toTeamLeader.barangayCoorId,
          purokCoorsId: toTeamLeader.purokCoorsId,
        };
      } else if (level === 2) {
        data = {
          barangayCoorId: toTeamLeader.barangayCoorId,
        };
      }
      await prisma.$transaction([
        prisma.voters.updateMany({
          where: {
            id: { in: voters.map((item) => item.id) },
          },
          data: {
            teamId: toTeams.id,
          },
        }),
        prisma.teamLeader.updateMany({
          where: {
            id: { in: tls.map((item) => item.id) },
          },
          data: data,
        }),
      ]);
      return 'OK';
    },
    assignFigure: async (_, { id, toId, level }) => {
      console.log({ id, toId, level });
      let data: any = {};
      // Validate level
      if (![2, 3].includes(level)) {
        throw new GraphQLError('Invalid level. Only level 2 or 3 is allowed.');
      }

      // Fetch team leaders
      const [toTeam, tl] = await prisma.$transaction([
        prisma.teamLeader.findUnique({
          where: { id: toId },
        }),
        prisma.teamLeader.findUnique({
          where: { id },
        }),
      ]);

      // Ensure both teams exist
      if (!toTeam || !tl) {
        throw new GraphQLError('Current Team or Target Team not found');
      }
      if (level === 2) {
        data = {
          barangayCoorId: toTeam.barangayCoorId,
          purokCoorsId: toTeam.id,
        };
      } else if (level === 3) {
        data = {
          barangayCoorId: toTeam.id,
        };
      } else {
        data = {
          barangayCoorId: toTeam.barangayCoorId,
          purokCoorsId: toTeam.purokCoorsId,
        };
      }
      // Update database
      await prisma.$transaction([
        prisma.voters.update({
          where: { id: tl.votersId as string },
          data: { teamId: toTeam.teamId },
        }),
        prisma.teamLeader.update({
          where: { id: tl.id },
          data: {
            ...data,
          },
        }),
      ]);
      return 'OK';
    },
    updateVoter: async (_, { id }) => {
      // console.log("Voter: ", id);
      // const voter = await prisma.voters.findUnique({
      //   where: {
      //     id
      //   }
      // })
      // console.log(voter);
      // const tl = await prisma.teamLeader.findFirst({
      //   where: {
      //     votersId: voter?.id
      //   }
      // })
      // const team = await prisma.team.findMany({
      //   where: {
      //     municipalsId: 4905,
      //     candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
      //     barangaysId: { not: undefined },
      //     level: {
      //       gte: 1,
      //       lte: 3,
      //     },
      //   },
      //   include: {
      //     _count: {
      //       select: {
      //         voters: true,
      //       },
      //     },
      //   },
      // });
      // const totalMember = team.reduce((acc, item) => acc + item._count.voters, 0);
      // const header = await prisma.voters.count({
      //   where: {
      //     municipalsId: 4905,
      //     teamId: { not: null },
      //     candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
      //     level: 0,
      //   },
      // });
      // console.log('All headers: ', header, 'Compare to: ', totalMember);

      // const [target, account, butaw, queryTwo, optionTwo,] = await prisma.$transaction([
      //   prisma.queries.findUnique({
      //     where: {
      //       id: "4725e09c-8d64-4387-ba56-c7bf089a9d1c"
      //     }
      //   }),
      //   prisma.option.findMany({
      //     where: {
      //       queryId: "4725e09c-8d64-4387-ba56-c7bf089a9d1c"
      //     }
      //   }),
      //   prisma.response.count({
      //     where: {
      //       queryId: "4725e09c-8d64-4387-ba56-c7bf089a9d1c"
      //     }
      //   }),
      //   prisma.queries.findUnique({
      //     where: {
      //       id: "ea4ed6f7-1e47-4315-88d0-a29958ac522f"
      //     }
      //   }),
      //   prisma.option.findMany({
      //     where: {
      //       queryId: "ea4ed6f7-1e47-4315-88d0-a29958ac522f"
      //     },
      //     include: {
      //      _count: {
      //        select: {
      //         Response: true
      //        }
      //      },
      //      Response: {
      //       take: 5
      //      },

      //     }
      //   }),
      // ])

      //tls attendance
      // const tls = await prisma.teamLeaderAttendance.findFirst({
      //   where: {
      //     teamLeader: {
      //       voter: {
      //         idNumber: 'N45',
      //       },
      //       barangay: {
      //         number: 25,
      //       },
      //     },
      //   },
      //   include: {
      //     teamLeader: {
      //       include: {
      //         voter: {
      //           select: {
      //             firstname: true,
      //             lastname: true,
      //             idNumber: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });
      // console.log(tls);

      const pre = await prisma.precents.findMany({
        include: {
          _count: {
            select: {
              Voters: true,
            },
          },
        },
      });
      console.log(JSON.stringify(pre, null, 2));

      // const responseTwo = await prisma.response.groupBy({
      //   by: ["respondentResponseId", "optionId", "queryId"],
      //   where: {
      //     queryId: "ea4ed6f7-1e47-4315-88d0-a29958ac522f"
      //   },
      //   _count: {
      //     respondentResponseId: true, // Count occurrences of each respondentResponseId
      //     optionId: true, // (Optional) Count responses for each optionId
      //     queryId: true // (Optional) Count responses per queryId
      //   }
      // });

      // console.log(responseTwo);

      // console.log(JSON.stringify({ target, account, butaw, queryTwo, optionTwo, responseTwo }, null, 2));

      // const [target] = await prisma.$transaction([
      //   prisma.users.findFirst({
      //     where: {
      //       username: {
      //         contains: "peduarte",
      //         mode: "insensitive"
      //       }
      //     }
      //   }),
      // prisma.users.findFirst({
      //   where: {
      //     username: "jopen"
      //   }
      // })
      //])
      // if(!target ){
      //   throw new GraphQLError("User not found")
      // }
      // console.log(target);

      await prisma.$transaction([
        // prisma.users.update({
        //   where: {
        //     uid: target.uid,
        //   },
        //   data: {
        //     status: 0,
        //     role: 2
        //   }
        // }),
        // prisma.users.update({
        //   where: {
        //     uid: account.uid,
        //   },
        //   data: {
        //     status: 1,
        //     role: 1
        //   }
        // }),
        // prisma.teamLeader.updateMany({
        //   where: {
        //     municipalsId: 4905,
        //   },
        //   data: {
        //     candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
        //   },
        // }),
        // prisma.team.updateMany({
        //   where: {
        //     municipalsId: 4905,
        //   },
        //   data: {
        //     candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
        //   },
        // }),
        // prisma.voters.updateMany({
        //   where: {
        //     municipalsId: 4905,
        //     teamId: { not: null },
        //     candidatesId: null,
        //   },
        //   data: {
        //     candidatesId: 'eb2e1921-c9c1-459c-b1ea-8d4543b9772b',
        //   },
        // }),
        // prisma.voters.updateMany({
        //   where:{
        //     municipalsId: 4905,
        //     teamId: {not: null},
        //     candidatesId: "842e7060-e38a-48a1-8f29-ec9c766b0fa0"
        //   },
        //   data: {
        //     candidatesId: "eb2e1921-c9c1-459c-b1ea-8d4543b9772b"
        //   }
        // }),
        // prisma.team.updateMany({
        //   where:{
        //     municipalsId: 4905,
        //     candidatesId: "842e7060-e38a-48a1-8f29-ec9c766b0fa0"
        //   },
        //   data: {
        //     candidatesId: "eb2e1921-c9c1-459c-b1ea-8d4543b9772b"
        //   }
        // }),
        // prisma.teamLeader.updateMany({
        //   where: {
        //      municipalsId: 4905,
        //     candidatesId: "842e7060-e38a-48a1-8f29-ec9c766b0fa0"
        //   },
        //   data: {
        //     candidatesId: "eb2e1921-c9c1-459c-b1ea-8d4543b9772b"
        //   }
        // })
      ]);

      // await prisma.teamLeader.update({
      //   where: {
      //     id: tl?.id
      //   },
      //   data: {
      //     level: 1,
      //     teamId: "57cbbae7-0645-4db9-bf7a-67786ff9c5df"
      //   }
      // })
      return 'OK';
    },
    comments: async (_, { ids, tag }) => {
      const voters = await prisma.voters.findMany({
        where: {
          id: { in: ids },
        },
      });
      const voterRecords = await prisma.voterRecords.findMany({
        where: {
          votersId: { in: ids },
          type: tag,
        },
      });
      const newVoterRecordTagId = new Set(voterRecords.map((v) => v.votersId));
      const newComments = voters.filter((item) => !newVoterRecordTagId.has(item.id));
      const oldComment = voterRecords.filter((item) => newVoterRecordTagId.has(item.votersId));

      if (newComments.length > 0) {
        await prisma.$transaction([
          prisma.voterRecords.createMany({
            data: newComments.map((voter) => ({
              votersId: voter.id,
              type: tag,
              desc: 'Questionable',
            })),
          }),
        ]);
      }
      if (oldComment.length > 0) {
        await prisma.voterRecords.deleteMany({
          where: {
            id: { in: oldComment.map((item) => item.id) },
          },
        });
      }
      return 'OK';
    },
    calibrateTeam: async (_, { id, bcID, pcID, tlID }) => {
      console.log({ id, bcID, pcID, tlID });

      const [team, tl, bcTeam] = await prisma.$transaction([
        prisma.team.findUnique({
          where: {
            id: id,
          },
        }),

        prisma.teamLeader.findUnique({
          where: {
            id: tlID,
          },
        }),
        prisma.team.findFirst({
          where: {
            teamLeaderId: bcID,
          },
        }),
      ]);
      const pc = pcID
        ? await prisma.teamLeader.findUnique({
            where: {
              id: pcID,
            },
          })
        : null;

      const bc = bcID
        ? await prisma.teamLeader.findUnique({
            where: {
              id: bcID,
            },
          })
        : null;

      if (!tl || !team || !bcTeam) {
        throw new GraphQLError('Bad Request');
      }
      const voter = await prisma.voters.findFirst({
        where: {
          id: tl?.votersId as string,
        },
      });
      console.log({ tl, team, bc, pc, bcTeam });

      const tlVoter = await prisma.voters.findMany({
        where: {
          id: tl.votersId as string,
        },
      });

      if (!tlVoter) {
        throw new GraphQLError('TL voters not found');
      }
      let teamID = '';
      let data: any = {};
      let shouldLevel = 0;
      if (team.level === 1) {
        data = {
          barangayCoorId: bc?.id,
          purokCoorsId: pc?.id,
        };
        shouldLevel = 0;
        teamID = pc?.teamId as string;
      } else if (team.level === 2) {
        data = {
          barangayCoorId: bc?.id,
          purokCoorsId: null,
        };
        shouldLevel = 1;
        teamID = bcTeam.id;
      } else if (team.level === 3) {
        data = {
          barangayCoorId: null,
          purokCoorsId: null,
        };
        shouldLevel = 2;
        teamID = team.id;
      }

      await prisma.$transaction([
        prisma.teamLeader.update({
          where: {
            id: tlID,
          },
          data: {
            candidatesId: bc?.candidatesId,
            teamId: id,
            level: team.level,
            ...data,
          },
        }),
        prisma.voters.update({
          where: {
            id: voter?.id,
          },
          data: {
            teamId: teamID,
            level: team.level,
            candidatesId: bc?.candidatesId,
          },
        }),
        prisma.voters.update({
          where: {
            id: bc?.votersId as string,
          },
          data: {
            teamId: bcTeam.id,
            level: 3,
          },
        }),
        prisma.voters.updateMany({
          where: {
            teamId: team.id,
          },
          data: {
            level: shouldLevel,
          },
        }),
        prisma.teamLeader.update({
          where: {
            id: bc?.id,
          },
          data: {
            teamId: bcTeam.id,
            level: 3,
          },
        }),
        // prisma.teamLeader.update({
        //   where: {
        //     id: pcID,
        //   },
        //   data: {
        //     purokCoorsId: team.id,
        //   },
        // }),
      ]);
      teamID = '';
      data = {};
      return 'OK';
    },
    changeMerits: async (_, { id, level }) => {
      if (id.length === 0) {
        throw new GraphQLError('Bad Request');
      }
      const headers = await prisma.teamLeader.findMany({
        where: {
          id: { in: id },
        },
      });

      if (headers.length > 0) {
        const teams = await prisma.team.findMany({
          where: {
            id: { in: headers.map((item) => item.teamId as string) },
          },
        });
        await prisma.$transaction([
          prisma.teamLeader.updateMany({
            where: {
              id: { in: headers.map((item) => item.id) },
            },
            data: {
              level: level,
            },
          }),
          prisma.voters.updateMany({
            where: {
              id: { in: headers.map((item) => item.votersId as string) },
            },
            data: {
              level: level,
            },
          }),
          prisma.voters.updateMany({
            where: {
              teamId: { in: teams.map((item) => item.id) },
            },
            data: {
              level,
            },
          }),
          prisma.team.updateMany({
            where: {
              id: { in: teams.map((item) => item.id) },
            },
            data: {
              level,
            },
          }),
        ]);
      }
      return 'OK';
    },
    changeLevel: async (_, { targetHeads, targetLevel, targetTeam, teamID, currentTl }) => {
      console.log({ targetHeads, targetLevel, targetTeam, teamID, currentTl });

      let data: any = {};
      const [currentTlData, team, members] = await prisma.$transaction([
        prisma.teamLeader.findUnique({
          where: {
            id: currentTl,
          },
        }),
        prisma.team.findUnique({
          where: {
            id: teamID,
          },
        }),
        prisma.voters.findMany({
          where: {
            teamId: teamID,
          },
        }),
      ]);
      const targetTeams = targetTeam
        ? await prisma.team.findUnique({
            where: {
              id: targetTeam,
            },
          })
        : null;
      const targetLeader = targetHeads
        ? await prisma.teamLeader.findUnique({
            where: {
              id: targetHeads,
            },
          })
        : null;

      const tls = await prisma.teamLeader.findMany({
        where: {
          votersId: { in: members.map((item) => item.id) },
        },
      });
      console.log({
        targetHeads,
        team,
        targetTeams,
        members,
        currentTlData,
        tls,
        targetLevel,
        targetLeader,
      });

      if (!team || members.length === 0 || !currentTlData) {
        throw new GraphQLError('Bad Request', {
          extensions: {
            code: 'BAD_REQUEST',
            messaga: 'Bad Request',
          },
        });
      }

      if (targetLevel === 1 && targetLeader) {
        data = {
          barangayCoorId: targetLeader.barangayCoorId,
          purokCoorsId: targetLeader.purokCoorsId,
        };
      } else if (targetLevel === 2 && targetLeader) {
        data = {
          barangayCoorId: targetLeader?.barangayCoorId,
          purokCoorsId: null,
        };
      } else {
        data = {
          barangayCoorId: null,
          purokCoorsId: null,
        };
      }

      if (targetLevel <= 0 && team.level >= 1 && targetTeams) {
        await prisma.$transaction([
          prisma.team.deleteMany({
            where: {
              id: { in: members.map((item) => item.teamId as string) },
            },
          }),
          prisma.teamLeader.deleteMany({
            where: {
              id: { in: tls.map((item) => item.id) },
            },
          }),
          prisma.voters.updateMany({
            where: {
              id: { in: members.map((item) => item.id) },
            },
            data: {
              level: 0,
              teamId: targetTeams.id,
            },
          }),
        ]);
      } else if (targetLevel >= 1 && team.level - 1 === 0) {
        const currentTeamlevel = team.level - 1;
        for (let item of members) {
          const teamLeader = await prisma.teamLeader.create({
            data: {
              votersId: item.id,
              level: targetLevel,
              municipalsId: team.municipalsId,
              barangaysId: team.barangaysId,
              purokId: team.purokId as string,
              hubId: '',
              ...data,
            },
          });
          const createdTeam = await prisma.team.create({
            data: {
              level: currentTeamlevel,
              teamLeaderId: teamLeader.id,
              municipalsId: team.municipalsId,
              barangaysId: team.barangaysId,
              purokId: team.purokId as string,
              hubId: '',
            },
          });

          await prisma.teamLeader.update({
            where: {
              id: targetLeader?.id,
            },
            data: {
              teamId: createdTeam.id,
            },
          });
        }
      } else {
        await prisma.$transaction([
          prisma.voters.updateMany({
            where: {
              id: { in: members.map((item) => item.id) },
            },
            data: {
              level: targetLevel - 1,
              teamId: targetLevel === 3 ? null : targetTeams?.id,
            },
          }),
          prisma.teamLeader.updateMany({
            where: {
              id: { in: tls.map((item) => item.id) },
            },
            data: {
              level: targetLevel - 1,
              ...data,
            },
          }),
          prisma.teamLeader.update({
            where: {
              id: currentTlData.id,
            },
            data: {
              level: targetLevel,
              ...data,
            },
          }),
        ]);
      }
      data = {};

      return 'OK';
    },
    refreshVoter: async (_, { ids, header, team, connection }) => {
      console.log(ids, header, team, connection);

      const voters = await prisma.voters.findMany({
        where: {
          id: { in: ids },
        },
      });
      if (voters.length === 0) {
        throw new GraphQLError('Bad Request');
      }

      const tls = voters.filter((item) => item.level >= 1);
      const tlData = await prisma.teamLeader.findMany({
        where: {
          id: { in: tls.map((item) => item.id) },
        },
      });
      if (tlData.length > 0) {
        const [teams] = await prisma.$transaction([
          prisma.team.findMany({
            where: {
              teamLeaderId: { in: tlData.map((item) => item.id) },
            },
          }),
        ]);
        if (teams.length > 0 && team) {
          await prisma.team.deleteMany({
            where: {
              id: { in: teams.map((item) => item.id) },
            },
          });
        }

        if (header) {
          await prisma.teamLeader.deleteMany({
            where: {
              id: { in: tlData.map((item) => item.id) },
            },
          });
        }
      }
      if (connection) {
        await prisma.voters.updateMany({
          where: {
            id: { in: voters.map((item) => item.id) },
          },
          data: {
            level: 0,
            teamId: null,
            candidatesId: null,
          },
        });
      }
      return 'OK';
    },
    resetQrCode: async () => {
      await prisma.qRcode.deleteMany();
      return 'OK';
    },
    newCollectionbatch: async (_, { zipCode, title, stab }) => {
      console.log({ zipCode, title, stab });

      await prisma.collectionBatch.create({
        data: {
          municipalsId: zipCode,
          stab: parseInt(stab, 10),
          title: title,
        },
      });
      return 'OK';
    },
    collectAndCheckStab: async (_, { qrId, code, method }) => {
      if (!qrId) {
        throw new GraphQLError('BAD_REQUEST');
      }
      const voterStab = await prisma.qRcode.findUnique({
        where: {
          id: qrId.id,
        },
      });

      if (!voterStab) {
        throw new GraphQLError('QR code not found!');
      }
      if (voterStab.scannedDateTime !== 'N/A') {
        throw new GraphQLError('');
      }

      return 'OK';
    },
    editBarangayCollectionStab: async (_, { collId, barangayId, value, variance }) => {
      console.log({ collId, barangayId, value, variance });

      let barangayColl = await prisma.collectionResult.findFirst({
        where: {
          barangaysId: barangayId,
        },
      });
      if (!barangayColl) {
        barangayColl = await prisma.collectionResult.create({
          data: {
            barangaysId: barangayId,
            result: value,
            variance: variance,
          },
        });
        return 'OK';
      }
      await prisma.collectionResult.update({
        where: {
          id: barangayColl.id,
        },
        data: {
          variance: variance,
          result: value,
        },
      });
      return 'OK';
    },
    addMachine: async (_, { zipCode, precints, machineNo, barangaysId }) => {
      try {
        const checkMachine = await prisma.machine.findFirst({
          where: {
            number: machineNo,
            municipalsId: zipCode,
          },
        });

        console.log({ zipCode, precints, machineNo, barangaysId });

        if (checkMachine) {
          throw new GraphQLError('Machine already exist');
        }

        const newMachineData = await prisma.machine.create({
          data: {
            municipalsId: zipCode,
            barangaysId: barangaysId,
            number: machineNo,
          },
        });

        if (!newMachineData) {
          throw new GraphQLError('Failed to create new machine');
        }

        const existingPrecints = await prisma.precents.findMany({
          where: {
            municipalsId: zipCode,
            precintNumber: { in: precints },
          },
        });

        const existedPrecints = new Set(existingPrecints.map((item) => item.id));
        const newPrecints = precints.filter((item) => !existedPrecints.has(item));

        if (newPrecints.length > 0) {
          await prisma.precents.createMany({
            data: newPrecints.map((item) => ({
              municipalsId: zipCode,
              precintNumber: item,
              machineId: newMachineData.id,
            })),
            skipDuplicates: true,
          });
        }

        return 'OK';
      } catch (error) {
        console.error('Error in newMachine resolver:', error);
        throw new GraphQLError(error as unknown as string);
      }
    },
    editMachine: async (_, { id, precincts, newPrecints, result, precinctMethod }) => {
      const machine = await prisma.machine.findUnique({
        where: {
          id: id,
        },
      });
      if (!machine) {
        throw new GraphQLError('Machine not found!');
      }
      if (precincts.length > 0) {
        const foundPrecincts = await prisma.precents.findMany({
          where: {
            id: { in: precincts },
          },
        });
        if (foundPrecincts.length > 0) {
          await prisma.precents.deleteMany({
            where: {
              id: { in: foundPrecincts.map((item) => item.id) },
            },
          });
        }
      }
      if (newPrecints.length > 0) {
        const existingPrecincts = await prisma.precents.findMany({
          where: {
            id: { in: newPrecints },
            machineId: machine.id,
            municipalsId: machine.municipalsId,
          },
        });

        const existedPrecints = new Set(existingPrecincts.map((item) => item.id));
        const newPrecintsData = newPrecints.filter((item) => !existedPrecints.has(item));
        await prisma.precents.createMany({
          data: newPrecintsData.map((item) => {
            return {
              municipalsId: machine.municipalsId,
              precintNumber: item,
              machineId: machine.id,
            };
          }),
        });
      }
      if (machine.result !== result) {
        await prisma.$transaction([
          prisma.machine.update({
            data: {
              result: result ?? 0,
            },
            where: {
              id: machine.id,
            },
          }),
        ]);
      }

      return 'OK';
    },
    removeMachine: async (_, { id }) => {
      const precints = await prisma.precents.findMany({
        where: {
          machineId: id,
        },
      });

      await prisma.$transaction([
        prisma.precents.deleteMany({
          where: {
            id: { in: precints.map((item) => item.id) },
          },
        }),
        prisma.machine.delete({
          where: {
            id,
          },
        }),
      ]);
      return 'OK';
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
    ValdilatedMember: async (parent) => {
      return await prisma.valdilatedMembers.findFirst({
        where: {
          votersId: parent.id,
        },
      });
    },
    UntrackedVoter: async (parent) => {
      if (!parent) {
        return null;
      }
      return await prisma.untrackedVoter.findFirst({
        where: {
          votersId: parent.id,
        },
      });
    },
    WhiteList: async (parent) => {
      return await prisma.blackList.findMany({
        where: {
          votersId: parent.id,
        },
      });
    },
    precinct: async (parent) => {
      if (!parent.precintsId) return null;
      return prisma.precents.findUnique({
        where: {
          id: parent.precintsId,
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
        where: {
          municipalsId: parent.municipalId,
          barangaysId: parent.id,
          saveStatus: 'listed',
        },
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
          timestamp: 'desc',
        },
      });
    },
    supporters: async (parent, { id }) => {
      const [tl, pc, bc, or, dead, dl] = await prisma.$transaction([
        prisma.team.findMany({
          where: {
            level: 1,
            barangaysId: parent.id,
            teamLeaderId: { not: null },
            TeamLeader: {
              votersId: { not: null },
            },
          },
          include: {
            voters: {
              where: {
                teamId: { not: null },
                level: 0,
              },
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            barangay: {
              name: 'asc',
            },
          },
        }),
        prisma.team.count({
          where: {
            level: 2,
            barangaysId: parent.id,
            teamLeaderId: { not: null },
            TeamLeader: {
              votersId: { not: null },
            },
          },
        }),
        prisma.team.count({
          where: {
            level: 3,
            barangaysId: parent.id,
            teamLeaderId: { not: null },
            TeamLeader: {
              votersId: { not: null },
            },
          },
        }),
        prisma.voters.count({
          where: {
            teamId: { not: null },
            candidatesId: { not: null },
            level: 0,
            barangaysId: parent.id,
            oor: 'YES',
          },
        }),
        prisma.voters.count({
          where: {
            candidatesId: id,
            barangaysId: parent.id,
            status: 0,
            teamId: { not: null },
          },
        }),
        prisma.voters.count({
          where: {
            DelistedVoter: {
              some: {},
            },
            candidatesId: { not: null },
            teamId: { not: null },
          },
        }),
      ]);

      const voterWithoutTeam = await prisma.voters.count({
        where: {
          barangaysId: parent.id,
          candidatesId: id,
          teamId: null,
          level: 0,
        },
      });
      const totalMember = tl.reduce((acc, item) => acc + item.voters.length, 0);

      return {
        figureHeads: tl.length + pc + bc,
        bc,
        pc,
        tl: tl.length,
        withTeams: totalMember,
        voterWithoutTeam: voterWithoutTeam,
        orMembers: or,
        deadWithTeam: dead,
        DLwithTeam: dl,
      };
    },
    teamStat: async (parent, { candidateId }) => {
      const team = await prisma.team.findMany({
        where: {
          barangaysId: parent.id,
          teamLeaderId: { not: null },
          TeamLeader: {
            votersId: { not: null },
          },
        },
        include: {
          voters: {
            where: {
              barangaysId: parent.id,
              teamId: { not: null },
            },
            select: {
              VoterRecords: true,
              status: true,
              oor: true,
              DelistedVoter: true,
            },
          },
        },
      });

      const cleanList = team.filter(
        (item) =>
          item.voters.length > 0 && // Ensure the team has voters
          item.voters.every(
            (voter) =>
              voter.VoterRecords.every((rec) => rec.type === 0) && // ALL VoterRecords must have type === 0
              voter.status === 1 &&
              voter.DelistedVoter.length === 0 &&
              voter.oor === 'NO',
          ),
      );

      return {
        aboveMax: team.filter((item) => item.voters.length > 10).length,
        belowMax: team.filter((item) => item.voters.length < 10 && item.voters.length > 5).length,
        equalToMax: team.filter((item) => item.voters.length === 10).length,
        aboveMin: team.filter((item) => item.voters.length > 5).length,
        equalToMin: team.filter((item) => item.voters.length === 5).length,
        belowMin: team.filter((item) => item.voters.length === 4).length,
        threeAndBelow: team.filter((item) => item.voters.length <= 3 && item.voters.length >= 1)
          .length,
        clean: cleanList.length,
        noMembers: team.filter((item) => item.voters.length === 0).length,
      };
    },
    leaders: async (parent, { skip, candidateId }) => {
      return await prisma.teamLeader.findMany({
        where: {
          barangaysId: parent.id,
          level: 2,
          candidatesId: candidateId,
        },
      });
    },
    barangayDelistedVoter: async (parent) => {
      return await prisma.delistedVoter.count({
        where: {
          barangaysId: parent.id,
        },
      });
    },
    teams: async (parent, { level }) => {
      const filter: any = {
        barangaysId: parent.id,
      };
      if (level) {
        filter.level = level;
      }
      return await prisma.team.findMany({
        where: {
          barangaysId: parent.id,
          teamLeaderId: { not: null },
          TeamLeader: {
            votersId: { not: null },
          },
          ...filter,
        },
        orderBy: {
          TeamLeader: {
            voter: {
              lastname: 'asc',
            },
          },
        },
      });
    },
    teamValidationStat: async (parent) => {
      const [
        validateTLS,
        validatedmember,
        untrackedMember,
        tls,
        teamMembers,
        orMembers,
        dead,
        exclude,
      ] = await prisma.$transaction([
        prisma.accountValidateTeam.count({
          where: {
            barangaysId: parent.id,
          },
        }),
        prisma.valdilatedMembers.count({
          where: {
            voterId: {
              barangaysId: parent.id,
            },
          },
        }),
        prisma.untrackedVoter.count({
          where: {
            voter: {
              barangaysId: parent.id,
            },
          },
        }),
        prisma.teamLeader.count({
          where: {
            level: 1,
            barangaysId: parent.id,
          },
        }),
        prisma.voters.count({
          where: {
            teamId: { not: null },
            level: 0,
            barangaysId: parent.id,
          },
        }),
        prisma.voters.count({
          where: {
            teamId: { not: null },
            level: 0,
            barangaysId: parent.id,
            candidatesId: { not: null },
            oor: 'YES',
          },
        }),
        prisma.voters.count({
          where: {
            teamId: { not: null },
            level: 0,
            barangaysId: parent.id,
            candidatesId: { not: null },
            status: 0,
          },
        }),
        prisma.teamUpdateArchive.count({
          where: {
            method: 0,
            team: {
              barangaysId: parent.id,
            },
          },
        }),
      ]);
      return {
        untrackedMembers: untrackedMember,
        teamLeadersCount: tls,
        validatedMembers: validatedmember,
        validatedTL: validateTLS,
        members: teamMembers,
        orMembers: orMembers,
        dead: dead,
        exclude: exclude,
      };
    },
    teamComment: async (parent) => {
      const ud = await prisma.voterRecords.findMany({
        where: {
          voter: {
            barangaysId: parent.id,
          },
        },
      });
      return ud;
    },
    collectionResult: async (parent, {}) => {
      const [teams, teamMembers, stabOne, stabTwo] = await prisma.$transaction([
        prisma.team.findMany({
          where: {
            barangaysId: parent.id,
          },
          include: {
            voters: {
              where: {
                QRcode: {
                  some: {
                    OR: [{ stamp: 1 }, { stamp: 2 }],
                  },
                },
                teamId: { not: null },
                level: 0,
              },
            },
          },
        }),
        prisma.team.findMany({
          where: {
            barangaysId: parent.id,
          },
          select: {
            _count: {
              select: {
                voters: {
                  where: {
                    teamId: { not: null },
                    level: 0,
                  },
                },
              },
            },
          },
        }),
        prisma.qRcode.count({
          where: {
            voter: {
              barangaysId: parent.id,
              level: 0,
              teamId: { not: null },
              candidatesId: { not: null },
            },
            stamp: 1,
            scannedDateTime: { not: 'N/A' },
          },
        }),
        prisma.qRcode.count({
          where: {
            voter: {
              barangaysId: parent.id,
              teamId: { not: null },
              candidatesId: { not: null },
              level: 0,
            },
            stamp: 2,
            scannedDateTime: { not: 'N/A' },
          },
        }),
      ]);
      const generatedCodes = teams.reduce((acc, base) => {
        return acc + base.voters.length;
      }, 0);
      const totalTeamMembers = teamMembers.reduce((acc, base) => {
        return acc + base._count.voters;
      }, 0);
      return {
        stabOne: stabOne,
        stabTwo: stabTwo,
        genQrCode: generatedCodes,
        allTeamMembers: totalTeamMembers,
      };
    },
    collectionStabVarian: async (parent) => {
      return await prisma.collectionResult.findMany({
        where: {
          barangaysId: parent.id,
        },
      });
    },
    machines: async (parent) => {
      return await prisma.machine.findMany({
        where: {
          barangaysId: parent.id,
        },
      });
    },
    precinct: async (parent, { precinctId }) => {
      console.log(precinctId);

      if (!precinctId) {
        return null;
      }
      return await prisma.precents.findUnique({
        where: {
          id: precinctId,
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
          saveStatus: 'drafted',
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
        throw new Error('Municipal ID cannot be null');
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
    result: async (parent) => {
      const result = await prisma.queries.findMany({
        where: {
          surveyId: parent.id,
        },
        include: {
          Option: {
            include: {
              Response: {
                include: {
                  ageBracket: true,
                  gender: true,
                },
                take: 5,
              },
            },
          },
        },
      });

      let surveyResults: SurveyResults = {
        tagID: '',
        id: '',
        zipCode: 0,
        barangay: '',
        queries: [],
      };

      // const newResult = result.map((query) => {
      //   const matchedQuery = surveyResults.queries.find(
      //     (quer) => quer.id === query.id
      //   );

      //   if (!matchedQuery) {
      //     // If the query doesn't exist, add it to surveyResults
      //     const newQuery = {
      //       id: query.id,
      //       queries: query.queries,
      //       options: [],
      //     };

      //     query.Option.forEach((option) => {
      //       const newOption = {
      //         id: option.id,
      //         title: option.title,
      //         queryId: option.queryId,
      //         response: [],
      //       };

      //       // Group responses by ageBracket.segment and gender
      //       const groupedResponses: Record<
      //         string,
      //         {
      //           id: string;
      //           ageSegment: string;
      //           ageSegmentId: string;
      //           order: 0,
      //           gender: { id: string; name: string }[];
      //         }
      //       > = {};

      //       option.Response.forEach((response) => {
      //         const ageSegmentKey = `${response.ageBracket.segment}-${response.ageBracket.id}`;

      //         if (!groupedResponses[ageSegmentKey]) {
      //           groupedResponses[ageSegmentKey] = {
      //             id: response.id,
      //             ageSegment: response.ageBracket.segment,
      //             ageSegmentId: response.ageBracket.id,
      //             order: response.ageBracket.order,
      //             gender: [],
      //           };
      //         }

      //         // Add gender if it's not already in the list
      //         if (
      //           !groupedResponses[ageSegmentKey].gender.some(
      //             (g) => g.id === response.gender.id
      //           )
      //         ) {
      //           groupedResponses[ageSegmentKey].gender.push(response.gender);
      //         }
      //       });

      //       // Push grouped responses into the option responses
      //       newOption.response = Object.values(groupedResponses);

      //       // Add the option to the new query
      //       newQuery.options.push(newOption);
      //     });

      //     // Add the new query to surveyResults
      //     surveyResults.queries.push(newQuery);
      //   } else {
      //     // If the query already exists, update its options
      //     query.Option.forEach((option) => {
      //       const newOption = {
      //         id: option.id,
      //         title: option.title,
      //         queryId: option.queryId,
      //         response: [] as {
      //           id: string;
      //           ageSegment: string;
      //           ageSegmentId: string;
      //           order: number;
      //           gender: { id: string; name: string }[];
      //         }[],
      //       };

      //       // Group responses by ageBracket.segment and gender
      //       const groupedResponses: Record<
      //         string,
      //         {
      //           id: string;
      //           ageSegment: string;
      //           ageSegmentId: string;
      //           order: number;
      //           gender: { id: string; name: string }[];
      //         }
      //       > = {};

      //       option.Response.forEach((response) => {
      //         const ageSegmentKey = `${response.ageBracket.segment}-${response.ageBracket.id}`;

      //         if (!groupedResponses[ageSegmentKey]) {
      //           groupedResponses[ageSegmentKey] = {
      //             id: response.id,
      //             ageSegment: response.ageBracket.segment,
      //             ageSegmentId: response.ageBracket.id,
      //             order: response.ageBracket.order,
      //             gender: [],
      //           };
      //         }

      //         // Add gender if it's not already in the list
      //         if (
      //           !groupedResponses[ageSegmentKey].gender.some(
      //             (g) => g.id === response.gender.id
      //           )
      //         ) {
      //           groupedResponses[ageSegmentKey].gender.push(response.gender);
      //         }
      //       });

      //       // Push grouped responses into the option responses
      //       newOption.response = Object.values(groupedResponses);

      //       // Add the option to the new query
      //       matchedQuery?.options.push(newOption);
      //     });
      //   }
      // });

      // console.log(newResult);

      console.log('Resuts: ', JSON.stringify(result, null, 2));

      return 'OK';
    },
  },
  Queries: {
    options: async (parent) => {
      return await prisma.option.findMany({
        where: { queryId: parent.id },
        orderBy: { order: 'asc' },
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
        orderBy: { name: 'asc' },
      });
    },
    customOption: async (parent, { zipCode, barangayId, surveyId }) => {
      console.log({ zipCode, barangayId, surveyId });

      const filter: any = {};
      if (barangayId !== 'all') {
        filter.barangaysId = barangayId;
      }
      return await prisma.customOption.findMany({
        where: {
          queriesId: parent.id,
          RespondentResponse: {
            municipalsId: zipCode,
            surveyId: surveyId,
            ...filter,
          },
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

      if (barangayId !== 'all') {
        filters.barangaysId = barangayId;
      }

      if (genderId !== 'all') {
        filters.genderId = genderId;
      }
      const responses = await prisma.response.findMany({
        where: filters,
        select: {
          id: true,
        },
        distinct: ['respondentResponseId', 'optionId'],
      });
      return responses.length;
    },
    ageCountRank: async (parent, { id, ageBracketId, barangayId, genderId }) => {
      let filters: any = {
        surveyId: id,
        ageBracketId: ageBracketId,
        optionId: parent.id,
      };

      if (barangayId !== 'all') {
        filters.barangaysId = barangayId;
      }
      if (genderId !== 'all') {
        filters.genderId = genderId;
      }
      return await prisma.response.count({
        where: filters,
      });
    },
    optionRank: async (parent, { surveyId, ageBracketId, barangayId, genderId }) => {
      let filters: any = {
        surveyId: surveyId,
        ageBracketId: ageBracketId,
        optionId: parent.id,
      };

      if (barangayId !== 'all') {
        filters.barangaysId = barangayId;
      }
      if (genderId !== 'all') {
        filters.genderId = genderId;
      }
      const data = await prisma.response.findMany({
        where: filters,
        select: {
          id: true,
        },
        distinct: ['respondentResponseId', 'optionId'],
      });
      return data.length;
    },
    barangays: async () => {
      return await prisma.barangays.findMany({ where: { municipalId: 4905 } });
    },
    results: async (parent) => {
      const responses = await prisma.respondentResponse.findMany({
        where: {
          Response: {
            some: { optionId: parent.id },
          },
        },
        include: {},
      });
      return 0;
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
    users: async (parent) => {
      if (!parent.usersUid) {
        return null;
      }
      return await prisma.users.findUnique({
        where: {
          uid: parent.usersUid,
        },
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

      if (barangayId !== 'all') {
        filters.barangaysId = barangayId;
      }

      if (genderId !== 'all') {
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
    optionRank: async (parent, { surveyId, zipCode, barangayId, genderId, optionId }) => {
      let filters: any = {
        ageBracketId: parent.id,
        surveyId: surveyId,
        optionId: optionId,
        municipalsId: 4905,
      };
      if (barangayId !== 'all') {
        filters.barangayId = barangayId;
      }
      if (genderId !== 'all') {
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
      if (!parent) {
        return [];
      }
      return await prisma.option.findMany({
        where: { id: parent.optionId as string },
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
      return await prisma.voters.findMany({
        where: { teamId: parent.id, candidatesId: { not: null }, level: parent.level - 1 },
      });
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
    _count: async (parent) => {
      const count = await prisma.voters.count({
        where: {
          teamId: parent.id,
        },
      });
      return { voters: count };
    },
    votersCount: async (parent) => {
      const count = await prisma.voters.count({
        where: {
          teamId: parent.id,
        },
      });
      return count;
    },
    AccountHandleTeam: async (parent) => {
      if (!parent.id) return null;

      return await prisma.accountHandleTeam.findFirst({
        where: {
          teamId: parent.id,
        },
      });
    },
    AccountValidateTeam: async (parent, { id }) => {
      return prisma.accountValidateTeam.findFirst({
        where: {
          teamId: parent.id,
          usersUid: id,
        },
      });
    },
    untrackedCount: async (parent) => {
      const untracked = await prisma.untrackedVoter.count({
        where: {
          teamId: parent.id,
        },
      });
      return untracked;
    },
    stabStatus: async (parent) => {
      const [stabOnecollected, stabTwocollected, released] = await prisma.$transaction([
        prisma.voters.count({
          where: {
            QRcode: {
              some: {
                scannedDateTime: { not: 'N/A' },
                stamp: 1,
              },
            },
            level: 0,
            teamId: parent.id,
          },
        }),
        prisma.voters.count({
          where: {
            QRcode: {
              some: {
                scannedDateTime: { not: 'N/A' },
                stamp: 2,
              },
            },
            level: 0,
            teamId: parent.id,
          },
        }),
        prisma.stabDistribution.count({
          where: {
            teamId: parent.id,
          },
        }),
      ]);
      return {
        stabOnecollected: stabOnecollected,
        stabTwocollected,
        released,
      };
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
    teamList: async (parent) => {
      return await prisma.team.findMany({
        where: {
          TeamLeader: {
            voter: {
              teamId: parent.teamId,
            },
          },
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
    inTeam: async (parent) => {
      const figureHeads = await prisma.teamLeader.findMany({
        where: {
          candidatesId: parent.id,
        },
      });
      const voters = await prisma.voters.count({
        where: {
          candidatesId: parent.id,
          teamId: { not: null },
          level: { not: 1 },
        },
      });

      const voterWithoutTeam = await prisma.voters.count({
        where: {
          candidatesId: parent.id,
          teamId: null,
          level: { not: 1 },
        },
      });

      return {
        figureHeads: figureHeads.length,
        bc: figureHeads.filter((item) => item.level === 3).length,
        pc: figureHeads.filter((item) => item.level === 2).length,
        tl: figureHeads.filter((item) => item.level === 1).length,
        withTeams: voters,
        voterWithoutTeam: voterWithoutTeam,
      };
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
    accountHandleTeam: async (parent) => {
      return await prisma.accountHandleTeam.findMany({
        where: {
          usersUid: parent.uid,
        },
      });
    },
  },
  AccountHandleTeam: {
    team: async (parent) => {
      if (!parent.id) {
        return null;
      }
      return await prisma.team.findFirst({
        where: {
          id: parent.teamId as string,
        },
      });
    },
    account: async (parent) => {
      if (!parent.usersUid) return null;

      return await prisma.users.findUnique({
        where: {
          uid: parent.usersUid,
        },
      });
    },
  },
  Machine: {
    location: async (parent) => {
      if (!parent.barangaysId) {
        return null;
      }
      return await prisma.barangays.findUnique({
        where: {
          id: parent.barangaysId,
        },
      });
    },
    precincts: async (parent) => {
      return await prisma.precents.findMany({
        where: {
          machineId: parent.id,
        },
      });
    },
    regVoters: async (parent) => {
      const precincts = await prisma.precents.findMany({
        where: {
          machineId: parent.id,
        },
        include: {
          _count: {
            select: {
              Voters: true,
            },
          },
        },
      });
      const total =
        precincts.reduce((acc, base) => {
          return acc + base._count.Voters;
        }, 0) || 0;
      return total;
    },
  },
  Precent: {
    _count: async (parent) => {
      return await prisma.voters.count({
        where: {
          precintsId: parent.id,
        },
      });
    },
    voters: async (parent) => {
      return await prisma.voters.findMany({
        where: {
          precintsId: parent.id,
          teamId: { not: null },
          candidatesId: { not: null },
        },
      });
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const main = async () => {
  try {
    await server.start();

    app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(server));

    app.use('/upload', fileRoutes);
    app.use('/upload', image);
    app.use('/precint', precint);
    app.use('/voters', voters);
    app.use('/purok', purok);
    app.use('/export', pdfFile);
    app.use('/auth', auth);
    app.use('/submit', data);
    //test
    app.get('/test', (req: Request, res: Response) => {
      res.status(200).json({ message: 'Hello Wolrd' });
    });

    io.on('connection', (socket) => {
      socket.on('draftedCounter', (data) => {
        console.log('Drafted Counter Data:', data);
      });

      // Listener for updateVoterCounter event
      socket.on('updateVoterCounter', (data) => {
        console.log('Update Voter Counter Data:', data);
      });

      // Listener for disconnect event
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    const port = 3000;

    ioserver.listen(port, async () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
};
main();
