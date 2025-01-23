"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("../../prisma/prisma");
const schema_1 = require("../schema/schema");
const body_parser_1 = __importDefault(require("body-parser"));
//routes
const files_1 = __importDefault(require("../routes/files"));
const precint_1 = __importDefault(require("../routes/precint"));
const voter_1 = __importDefault(require("../routes/voter"));
const purok_1 = __importDefault(require("../routes/purok"));
const pdfFile_1 = __importDefault(require("../../routes/pdfFile"));
const image_1 = __importDefault(require("../../src/routes/image"));
//utils
const data_1 = require("../utils/data");
const graphql_1 = require("graphql");
const app = (0, express_1.default)();
const ioserver = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(ioserver, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://jml-client-test.netlify.app",
            "https://jml-portal.netlify.app",
            "http://3.80.143.15:5173/",
            "https://one-app-u7hu.onrender.com/",
            "https://one-app-u7hu.onrender.com/graphql"
        ],
        methods: ["GET", "POST"],
    },
});
//routes
const fileRoutes = (0, files_1.default)(io);
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "https://jml-client-test.netlify.app",
        "https://jml-portal.netlify.app",
        "http://3.80.143.15:5173/",
        "https://one-app-u7hu.onrender.com/graphql",
        "https://one-app-u7hu.onrender.com"
    ],
}));
app.use(express_1.default.static(path_1.default.join(__dirname, "react-app/build")));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
const resolvers = {
    Query: {
        users: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.users.findMany();
        }),
        voters: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { skip }) {
            return yield prisma_1.prisma.voters.findMany({
                where: {
                    saveStatus: "listed",
                },
                skip: skip !== null && skip !== void 0 ? skip : 0,
                take: 50,
            });
        }),
        voter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.voters.findUnique({ where: { id } });
        }),
        votersCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.count({
                where: {
                    saveStatus: "listed",
                },
            });
        }),
        searchDraftVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { query }) {
            return yield prisma_1.prisma.voters.findMany({
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
        }),
        barangay: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.barangays.findUnique({ where: { id } });
        }),
        barangays: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findMany();
        }),
        barangayList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode }) {
            console.log(zipCode);
            return yield prisma_1.prisma.barangays.findMany({
                where: { municipalId: zipCode },
                orderBy: { name: "asc" },
            });
        }),
        municipals: () => __awaiter(void 0, void 0, void 0, function* () { return yield prisma_1.prisma.municipals.findMany(); }),
        municipal: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode }) {
            return yield prisma_1.prisma.municipals.findUnique({ where: { id: zipCode } });
        }),
        municipalVoterList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            const data = yield prisma_1.prisma.voters.findMany({
                where: { municipalsId: id },
                include: { barangay: true },
            });
            return data;
        }),
        barangaysCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.count();
        }),
        barangayVotersList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId, barangayId }) {
            return yield prisma_1.prisma.voters.findMany({
                where: { municipalsId: municipalId, barangaysId: barangayId },
            });
        }),
        barangayNewVotersDraft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId, barangayId }) {
            return yield prisma_1.prisma.newBatchDraft.findMany({
                where: { municipalId, barangayId },
            });
        }),
        puroks: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId, barangayId }) {
            return yield prisma_1.prisma.purok.findMany({
                where: { municipalsId: municipalId, barangaysId: barangayId },
            });
        }),
        purok: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.purok.findFirst({
                where: {
                    id,
                },
            });
        }),
        draftedVoters: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { voter }) {
            return yield prisma_1.prisma.voters.findMany({
                where: {
                    municipalsId: voter.municipalId,
                    barangaysId: voter.barangayId,
                    newBatchDraftId: voter.draftID,
                    saveStatus: "drafted",
                },
            });
        }),
        drafts: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.newBatchDraft.findMany();
        }),
        draft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.newBatchDraft.findUnique({ where: { id } });
        }),
        survey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.survey.findUnique({ where: { id } });
        }),
        getSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { tagID }) {
            const target = yield prisma_1.prisma.survey.findFirst({
                where: { tagID: tagID, status: "Ongoing" },
            });
            if (!target) {
                throw new graphql_1.GraphQLError("No active survey found with tag ID", {
                    extensions: { code: "SURVEY_NOT_FOUND" },
                });
            }
            return target;
        }),
        surveyList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.survey.findMany({
                orderBy: { timestamp: "asc" },
            });
        }),
        queries: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.queries.findUnique({ where: { id } });
        }),
        ageList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.ageBracket.findMany({ orderBy: { order: "asc" } });
        }),
        genderList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.gender.findMany();
        }),
        option: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.option.findUnique({ where: { id } });
        }),
        getRespondentResponse: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.respondentResponse.findMany();
        }),
        surveyResponseList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.surveyResponse.findMany();
        }),
        allSurveyResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { survey }) {
            return yield prisma_1.prisma.surveyResponse.findMany({
                where: { municipalsId: survey.municipalsId, surveyId: survey.surveyId },
                orderBy: { timestamp: "asc" },
            });
        }),
        surveyResponseInfo: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.surveyResponse.findUnique({ where: { id } });
        }),
        respondentResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.respondentResponse.findMany();
        }),
        quotas: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.quota.findMany();
        }),
        barangayQuota: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.quota.findMany({ where: { barangaysId: id } });
        }),
        gendersSize: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.genderSize.findMany();
        }),
        responseRespondent: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            // Fetch responses including their related queries
            const responses = yield prisma_1.prisma.response.findMany({
                where: { respondentResponseId: id },
                include: {
                    queries: true, // Assuming `queries` is a relation in your Prisma model
                    option: true, // Assuming `option` is the related options for each response
                },
            });
            // Group the responses by `queryId`
            const groupedByQueries = responses.reduce((grouped, response) => {
                var _a, _b, _c;
                const queryId = response.queries.id;
                if (!grouped[queryId]) {
                    grouped[queryId] = {
                        id: response.id,
                        ageBracketId: response.ageBracketId,
                        genderId: response.genderId,
                        order: response.queries.order,
                        queries: response.queries.queries,
                        surveyId: response.surveyId,
                        queryId: queryId,
                        respondentResponseId: response.respondentResponseId,
                        option: [],
                    };
                }
                // Assuming each response has an `option` relation, push options into the corresponding group
                grouped[queryId].option.push({
                    id: (_a = response.option) === null || _a === void 0 ? void 0 : _a.id,
                    queryId: queryId,
                    title: (_b = response.option) === null || _b === void 0 ? void 0 : _b.title,
                    desc: (_c = response.option) === null || _c === void 0 ? void 0 : _c.desc,
                });
                return grouped;
            }, {});
            // Convert the grouped object into an array
            const flattenedResponses = Object.values(groupedByQueries);
            // Return the result as an array of RespondentResponseProps
            return flattenedResponses;
        }),
        getRespondentResponseById: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.respondentResponse.findUnique({
                where: { id },
            });
        }),
        surveyQueriesList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.queries.findMany({ where: { surveyId: id } });
        }),
        optionCountAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { optionId, ageBracketId }) {
            if (optionId === "all") {
                return 0;
            }
            return yield prisma_1.prisma.response.count({ where: { optionId, ageBracketId } });
        }),
        optionRank: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { surveyId, ageBracketId, zipCode, barangayId, genderId, optionId, queryId, }) {
            let filters = {
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
            return yield prisma_1.prisma.response.count({
                where: filters,
            });
        }),
        optionGenderRank: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { surveyId, ageBracketId, zipCode, barangayId, genderId, optionId, queryId, }) {
            let filters = {
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
            return yield prisma_1.prisma.response.count({
                where: filters,
            });
        }),
        barangayOptionResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode, queryId, surveyId }) {
            const barangayList = yield prisma_1.prisma.barangays.findMany({
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
            const optionsList = yield prisma_1.prisma.option.findMany({
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
            const responseCounts = yield prisma_1.prisma.response.groupBy({
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
            const results = barangayList.map((barangay) => {
                // Find response counts for this barangay
                const optionsWithCounts = optionsList.map((option) => {
                    const countData = responseCounts.find((rc) => rc.barangaysId === barangay.id && rc.optionId === option.id);
                    return {
                        id: option.id,
                        queryId: queryId,
                        title: option.title,
                        desc: option.desc,
                        overAllCount: (countData === null || countData === void 0 ? void 0 : countData._count._all) || 0,
                    };
                });
                return {
                    id: barangay.id,
                    name: barangay.name,
                    options: optionsWithCounts,
                };
            });
            return results;
        }),
        getAllVoters: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { offset, limit, barangayId, zipCode }) {
            let filter = { saveStatus: "listed" }; // use Prisma's typing if possible
            if (zipCode !== "all") {
                filter.municipalsId = parseInt(zipCode, 10);
            }
            if (barangayId !== "all") {
                filter.barangaysId = barangayId;
            }
            return yield prisma_1.prisma.voters.findMany({
                take: limit,
                skip: offset,
                orderBy: {
                    lastname: "asc",
                },
                where: filter,
            });
        }),
        searchVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { query, skip, take }) {
            return yield prisma_1.prisma.voters.findMany({
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
        }),
        getSelectedVoters: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { list }) {
            const data = yield prisma_1.prisma.voters.findMany({
                where: {
                    id: { in: list },
                },
            });
            return data;
        }),
        getRankOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { optionId }) {
            // Step 1: Group the responses by `barangaysId`
            const topBarangays = yield prisma_1.prisma.response.groupBy({
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
            const barangayDetails = yield prisma_1.prisma.barangays.findMany({
                where: {
                    id: { in: barangayIds },
                },
            });
            const result = topBarangays.map((barangay) => (Object.assign(Object.assign({}, barangay), { barangay: barangayDetails.find((detail) => detail.id === barangay.barangaysId) || null })));
            return JSON.stringify(result);
        }),
        getAllPurokCoor: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.purokCoor.findMany();
        }),
        getAllTeamLeader: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { skip }) {
            return yield prisma_1.prisma.teamLeader.findMany({
                skip: skip !== null && skip !== void 0 ? skip : 0,
                take: 20,
            });
        }),
        getVotersList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { level, take, skip, query, zipCode, barangayId, purokId, pwd, illi, inc, oor, dead, youth, senior, gender, }) {
            const filter = { saveStatus: "listed" };
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
            if (level !== "all") {
                filter.level = parseInt(level, 10);
            }
            if (query) {
                filter.OR = [
                    { lastname: { contains: query, mode: "insensitive" } },
                    { firstname: { contains: query, mode: "insensitive" } },
                    { idNumber: { contains: query, mode: "insensitive" } },
                ];
            }
            const result = yield prisma_1.prisma.voters.findMany({
                where: filter,
                skip: skip !== null && skip !== void 0 ? skip : 0,
                take,
                orderBy: {
                    idNumber: "asc",
                },
            });
            const count = yield prisma_1.prisma.voters.count({ where: filter });
            console.log("Filter: ", filter);
            console.log("Result: ", result);
            return { voters: result, results: count };
        }),
        getPurokList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.purok.findMany({
                where: {
                    barangaysId: id,
                },
            });
        }),
        teamList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode, barangayId, purokId, level, query, skip, candidate, withIssues, }) {
            const filter = {};
            let select = {
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
            const levelList = [
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
            const teamLevel = levelList.find((x) => x.name === level);
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
            const teams = yield prisma_1.prisma.team.findMany({
                where: filter,
                skip: skip !== null && skip !== void 0 ? skip : 0,
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
        }),
        candidates: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.candidates.findMany();
        }),
        team: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.team.findUnique({
                where: {
                    id,
                },
            });
        }),
        getAllTL: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.teamLeader.findMany();
        }),
        validationList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.validation.findMany({
                where: {
                    barangaysId: id,
                },
            });
        }),
        teams: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { skip }) {
            return yield prisma_1.prisma.team.findMany({
                take: 50,
                skip: skip !== null && skip !== void 0 ? skip : 0,
            });
        }),
        teamRecord: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { query, skip, municipal, barangay }) {
            let filter = {};
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
            return yield prisma_1.prisma.validatedTeams.findMany({
                where: filter,
                skip: skip !== null && skip !== void 0 ? skip : 0,
                orderBy: {
                    timestamp: "desc",
                },
            });
        }),
        getTeamRecord: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.validatedTeams.findUnique({
                where: { id },
            });
        }),
        userList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.users.findMany();
        }),
        userQRCodeList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.userQRCode.findMany();
        }),
        purokList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.purok.findMany();
        }),
        voterRecords: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { skip }) {
            return yield prisma_1.prisma.voterRecords.findMany({
                skip: skip !== null && skip !== void 0 ? skip : 0,
                take: 50
            });
        }),
        printOptionResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { surveyId, queryId, zipCode }) {
            const response = yield prisma_1.prisma.queries.findMany();
            return response;
        }),
        candidate: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.candidates.findUnique({
                where: { id },
            });
        }),
        duplicateteamMembers: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { skip }) {
            return yield prisma_1.prisma.duplicateteamMembers.findMany({
                skip: skip !== null && skip !== void 0 ? skip : 0,
                take: 50,
            });
        }),
        delistedVotes: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { skip }) {
            return yield prisma_1.prisma.delistedVoter.findMany({
                skip: skip !== null && skip !== void 0 ? skip : 0,
                take: 50,
            });
        }),
    },
    Mutation: {
        signUp: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { user }) {
            const hash = yield argon2_1.default.hash(user.password);
            const check = yield prisma_1.prisma.adminUser.findFirst({
                where: { phoneNumber: user.phoneNumber },
            });
            if (check) {
                throw new Error("Phone number already exit.");
            }
            return yield prisma_1.prisma.adminUser.create({
                data: {
                    phoneNumber: user.phoneNumber,
                    password: hash,
                    lastname: user.lastname,
                    firstname: user.firstname,
                    address: user.address,
                },
            });
        }),
        createVoter: (_, voter) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.create({ data: voter });
        }),
        newUser: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { user }) {
            const { username, password, privilege, purpose, role } = user;
            const checked = yield prisma_1.prisma.users.findFirst({ where: { username } });
            if (checked) {
                throw new graphql_1.GraphQLError("Username already exists");
            }
            yield prisma_1.prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
                // Create user
                const createdUser = yield prisma.users.create({
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
                const generatedCode = yield qrcode_1.default.toDataURL(createdUser.uid);
                // Create QR code and update user
                const qrCode = yield prisma.userQRCode.create({
                    data: { qrCode: generatedCode },
                });
                // Update the user with the QR code ID
                yield prisma.users.update({
                    where: { uid: createdUser.uid },
                    data: { userQRCodeId: qrCode.id },
                });
                console.log({ createdUser });
            }));
            return "OK";
        }),
        createMunicipal: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipal }) {
            return yield prisma_1.prisma.municipals.create({
                data: {
                    id: municipal.id,
                    name: municipal.name,
                },
            });
        }),
        createBarangay: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { barangay }) {
            const existed = yield prisma_1.prisma.barangays.findFirst({
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
            return yield prisma_1.prisma.barangays.create({
                data: {
                    municipalId: barangay.municipalId,
                    name: barangay.name,
                },
            });
        }),
        createNewBatchDraft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { barangay }) {
            return yield prisma_1.prisma.newBatchDraft.create({
                data: {
                    municipalId: barangay.municipalId,
                    barangayId: barangay.barangayId,
                },
            });
        }),
        removeDraft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.voters.deleteMany({
                where: { newBatchDraftId: id, saveStatus: "drafted" },
            });
            return yield prisma_1.prisma.newBatchDraft.delete({ where: { id } });
        }),
        createPrecent: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { precint }) {
            return yield prisma_1.prisma.precents.create({
                data: {
                    precintNumber: precint.precintNumber,
                    id: precint.id,
                    municipalsId: precint.municipalsId,
                    barangayId: precint.barangaysId,
                },
            });
        }),
        changePurokName: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { purok }) {
            return yield prisma_1.prisma.purok.update({
                where: { id: purok.id },
                data: { purokNumber: purok.value },
            });
        }),
        mergePurok: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { purok }) {
            const newID = purok.id[0];
            const data = yield prisma_1.prisma.purok.update({
                where: { id: newID },
                data: { purokNumber: purok.newName },
            });
            yield prisma_1.prisma.voters.updateMany({
                where: { purokId: newID },
                data: { purokId: newID },
            });
            for (let item of purok.id.slice(1)) {
                yield prisma_1.prisma.voters.updateMany({
                    where: { purokId: item },
                    data: { purokId: newID },
                });
                yield prisma_1.prisma.purok.delete({ where: { id: item } });
            }
            return data;
        }),
        goLiveSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.survey.update({
                where: { id },
                data: { drafted: false },
            });
        }),
        getSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { tagID }) {
            return prisma_1.prisma.survey.findFirst({ where: { tagID, drafted: false } });
        }),
        createSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { survey }) {
            console.log({ survey });
            const checkTagID = () => __awaiter(void 0, void 0, void 0, function* () {
                let genID = (0, data_1.handleGenTagID)();
                const tagID = yield prisma_1.prisma.survey.findFirst({
                    where: { tagID: genID.toString() },
                });
                if (tagID) {
                    return checkTagID();
                }
                else {
                    return genID.toString();
                }
            });
            const tagID = yield checkTagID();
            const data = yield prisma_1.prisma.survey.create({
                data: {
                    type: "random",
                    adminUserUid: survey.adminUserUid,
                    tagID: tagID,
                },
            });
            return data;
        }),
        createQuery: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { query }) {
            console.log("New Query: ", query);
            return yield prisma_1.prisma.queries.create({
                data: {
                    queries: query.queries,
                    surveyId: query.surveyId,
                    type: query.type,
                    onTop: query.onTop,
                    style: query.style,
                    withCustomOption: query.withCustomOption,
                },
            });
        }),
        createOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { option }) {
            return yield prisma_1.prisma.option.create({
                data: {
                    title: option.title,
                    desc: option.desc,
                    queryId: option.queryId,
                    mediaUrlId: option.mediaUrlId,
                },
            });
        }),
        createAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { age }) {
            return yield prisma_1.prisma.ageBracket.create({ data: { segment: age } });
        }),
        deleteAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.ageBracket.delete({ where: { id } });
        }),
        updateAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { age }) {
            return yield prisma_1.prisma.ageBracket.update({
                where: { id: age.id },
                data: { segment: age.value },
            });
        }),
        createGender: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { gender }) {
            return yield prisma_1.prisma.gender.create({ data: { name: gender } });
        }),
        deleteGender: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.gender.delete({ where: { id } });
        }),
        updateGender: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { gender }) {
            return yield prisma_1.prisma.gender.update({
                where: { id: gender.id },
                data: { name: gender.value },
            });
        }),
        deleteOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.option.delete({ where: { id } });
        }),
        deleteOptionMedia: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { option }) {
            yield prisma_1.prisma.option.update({
                where: { id: option.optionID },
                data: { mediaUrlId: null },
            });
            return yield prisma_1.prisma.mediaUrl.delete({ where: { id: option.id } });
        }),
        deleteQuery: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.option.deleteMany({ where: { queryId: id } });
            const query = yield prisma_1.prisma.queries.delete({ where: { id } });
            return query;
        }),
        updateOptionImage: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { image }) {
            return yield prisma_1.prisma.mediaUrl.update({
                where: { id: image.id },
                data: { url: image.url, filename: image.filename, size: image.size },
            });
        }),
        updateOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { option }) {
            return yield prisma_1.prisma.option.update({
                where: { id: option.id },
                data: { title: option.title, desc: option.desc },
            });
        }),
        updateSampleSize: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { sample }) {
            return yield prisma_1.prisma.barangays.update({
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
        }),
        createMedia: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { media }) {
            return prisma_1.prisma.mediaUrl.create({
                data: { filename: media.filename, size: media.size, url: media.url },
            });
        }),
        createOptionWithMedia: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { media, option }) {
            console.log({ option });
            let mediaUrlId = null;
            const createdOption = yield prisma_1.prisma.option.create({
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
                const createdMedia = yield prisma_1.prisma.mediaUrl.create({
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
        }),
        surveyConclude: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.survey.update({
                where: { id: id },
                data: { status: "Concluded" },
            });
        }),
        deleteSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.survey.delete({ where: { id } });
        }),
        createRespondentResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { respondentResponse }) {
            return yield prisma_1.prisma.respondentResponse.create({
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
        }),
        addSurveyResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { surveyResponse }) {
            return yield prisma_1.prisma.surveyResponse.create({
                data: {
                    id: surveyResponse.id,
                    municipalsId: surveyResponse.municipalsId,
                    barangaysId: surveyResponse.barangaysId,
                    surveyId: surveyResponse.surveyId,
                },
            });
        }),
        addResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { response }) {
            return yield prisma_1.prisma.response.create({
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
        }),
        harvestResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { response, surveyResponse, respondentResponse, customOptions }) {
            console.log({
                response,
                respondentResponse,
            });
            for (let item of surveyResponse) {
                try {
                    yield prisma_1.prisma.surveyResponse.create({
                        data: {
                            id: item.id,
                            municipalsId: item.municipalsId,
                            barangaysId: item.barangaysId,
                            surveyId: item.surveyId,
                            usersUid: item.accountID,
                        },
                    });
                }
                catch (error) {
                    continue;
                }
            }
            for (let item of respondentResponse) {
                try {
                    yield prisma_1.prisma.respondentResponse.create({
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
                }
                catch (error) {
                    continue;
                }
            }
            for (let item of response) {
                try {
                    yield prisma_1.prisma.response.create({
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
                }
                catch (error) {
                    continue;
                }
            }
            if (customOptions.length) {
                for (let item of customOptions) {
                    try {
                        yield prisma_1.prisma.customOption.createMany({
                            data: {
                                id: item.id,
                                value: item.value,
                                queriesId: item.queriesId,
                                respondentResponseId: item.respondentResponseId,
                            },
                        });
                    }
                    catch (error) {
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
            return "OK";
        }),
        submitResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { respondentResponse, response, surveyResponse }) {
            return yield prisma_1.prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
                const checkSurvey = yield prisma.survey.findUnique({
                    where: { id: surveyResponse.surveyId },
                });
                if ((checkSurvey === null || checkSurvey === void 0 ? void 0 : checkSurvey.status) !== "Ongoing") {
                    throw new graphql_1.GraphQLError("The survey is currently closed or paused.");
                }
                const surveyResponsed = yield prisma.surveyResponse.create({
                    data: {
                        id: surveyResponse.id,
                        municipalsId: surveyResponse.municipalsId,
                        barangaysId: surveyResponse.barangaysId,
                        surveyId: surveyResponse.surveyId,
                    },
                });
                for (const res of respondentResponse) {
                    const existingRespondent = yield prisma.respondentResponse.findUnique({
                        where: { id: res.id },
                    });
                    if (!existingRespondent) {
                        yield prisma.respondentResponse.create({
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
                    const existingResponse = yield prisma.response.findUnique({
                        where: { id: res.id }, // Assuming 'id' is unique for each response
                    });
                    if (!existingResponse) {
                        yield prisma.response.create({
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
            }));
        }),
        updateSurveyor: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            const checked = yield prisma_1.prisma.barangays.findUnique({
                where: { id },
            });
            if (checked && checked.activeSurveyor === checked.surveyor) {
                throw new graphql_1.GraphQLError(`${checked.name} surveyor limit reached.`);
            }
            return yield prisma_1.prisma.barangays.update({
                where: { id },
                data: { activeSurveyor: (checked === null || checked === void 0 ? void 0 : checked.activeSurveyor) + 1 },
            });
        }),
        resetSurveyor: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.barangays.updateMany({
                where: { municipalId: id },
                data: { surveyor: 0, activeSurveyor: 0 },
            });
            return yield prisma_1.prisma.barangays.findMany({
                where: { municipalId: id },
            });
        }),
        resetBarangayQuota: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.quota.deleteMany({ where: { barangaysId: id } });
            return yield prisma_1.prisma.quota.findMany({ where: { barangaysId: id } });
        }),
        resetActiveSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.barangays.update({
                where: { id },
                data: { activeSurveyor: 0 },
            });
        }),
        removeQuota: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.quota.delete({ where: { id } });
        }),
        adminLogin: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { user }) {
            const secretToken = process.env.JWT_SECRECT_TOKEN;
            if (!secretToken) {
                throw new Error("JWT secret token is not defined");
            }
            const adminUser = yield prisma_1.prisma.adminUser.findFirst({
                where: { phoneNumber: user.phoneNumber },
            });
            if (!adminUser) {
                throw new graphql_1.GraphQLError("Phone number not found!", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            const isPasswordValid = yield argon2_1.default.verify(adminUser.password, user.password);
            if (!isPasswordValid) {
                throw new graphql_1.GraphQLError("Incorrect password", {
                    extensions: { code: "UNAUTHORIZED" },
                });
            }
            const accessToken = jsonwebtoken_1.default.sign({ user: adminUser.phoneNumber }, secretToken, { expiresIn: "8h" });
            const { phoneNumber, lastname, firstname, uid } = adminUser;
            yield prisma_1.prisma.$disconnect();
            return { phoneNumber, lastname, firstname, uid, accessToken };
        }),
        createQuota: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { quota, gender }) {
            const quotaData = yield prisma_1.prisma.quota.create({
                data: {
                    ageBracketId: quota.ageBracketId,
                    barangaysId: quota.barangayId,
                },
            });
            yield prisma_1.prisma.genderSize.create({
                data: {
                    genderId: gender.genderId,
                    size: gender.size,
                    quotaId: quotaData.id,
                },
            });
            return quotaData;
        }),
        createGenderQuota: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { quota }) {
            const checked = yield prisma_1.prisma.genderSize.findFirst({
                where: {
                    quotaId: quota.quotaId,
                    genderId: quota.genderId,
                },
            });
            if (checked) {
                throw new graphql_1.GraphQLError("Gender already existed in this quota", {
                    extensions: { code: "EXISTED" },
                });
            }
            return yield prisma_1.prisma.genderSize.create({
                data: {
                    genderId: quota.genderId,
                    size: quota.size,
                    quotaId: quota.quotaId,
                },
            });
        }),
        removeGenderQuota: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.genderSize.delete({
                where: { id },
            });
        }),
        removeQuery: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.queries.delete({ where: { id } });
        }),
        removeBarangay: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.barangays.delete({
                where: { id },
            });
        }),
        updateQuery: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, value }) {
            return yield prisma_1.prisma.queries.update({
                where: { id },
                data: { queries: value },
            });
        }),
        updateQueryType: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, type }) {
            return yield prisma_1.prisma.queries.update({
                where: { id },
                data: { type: type },
            });
        }),
        updateOptionTop: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, value }) {
            return yield prisma_1.prisma.option.update({
                where: { id },
                data: { onTop: value },
            });
        }),
        resetSurveyResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, zipCode }) {
            const result = yield prisma_1.prisma.surveyResponse.deleteMany({
                where: { surveyId: id, municipalsId: zipCode },
            });
            return result;
        }),
        removeResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.respondentResponse.delete({ where: { id } });
        }),
        changeQueryOnTop: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, value }) {
            return yield prisma_1.prisma.queries.update({
                where: { id },
                data: { onTop: value },
            });
        }),
        updateQueryAccess: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            const query = yield prisma_1.prisma.queries.findUnique({ where: { id } });
            return yield prisma_1.prisma.queries.update({
                where: {
                    id,
                },
                data: {
                    access: (query === null || query === void 0 ? void 0 : query.access) === "regular" ? "admin" : "regular",
                },
            });
        }),
        optionForAll: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, value }) {
            return yield prisma_1.prisma.option.update({
                where: { id },
                data: { forAll: value },
            });
        }),
        discardDraftedVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.voters.deleteMany({
                where: {
                    newBatchDraftId: id,
                },
            });
            return "OK";
        }),
        saveDraftedVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { batchId }) {
            const updatedBatch = yield prisma_1.prisma.newBatchDraft.update({
                where: {
                    id: batchId,
                },
                data: {
                    drafted: false,
                },
            });
            yield prisma_1.prisma.voters.updateMany({
                where: {
                    newBatchDraftId: batchId,
                },
                data: {
                    saveStatus: "listed",
                },
            });
            return updatedBatch;
        }),
        removeVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.voters.delete({
                where: {
                    id,
                },
            });
            return "OK";
        }),
        removeMultiVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { list }) {
            for (let item of list) {
                try {
                    yield prisma_1.prisma.voters.delete({
                        where: {
                            id: item,
                        },
                    });
                }
                catch (error) {
                    console.log(error);
                    continue;
                }
            }
            return "OK";
        }),
        setVoterLevel: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, level, code }) {
            console.log(id, level, code);
            const voter = yield prisma_1.prisma.voters.findUnique({
                where: {
                    id,
                },
            });
            const candidate = yield prisma_1.prisma.candidates.findFirst({
                where: {
                    code: {
                        equals: code.trim(),
                        mode: "insensitive",
                    },
                },
            });
            if (!candidate) {
                throw new graphql_1.GraphQLError("Code not found", {
                    extensions: {
                        code: "UNFOUND",
                    },
                });
            }
            if (!voter) {
                throw new graphql_1.GraphQLError("Couldn't update, voter not found", {
                    extensions: { code: 500 },
                });
            }
            if (voter.level === 3) {
                throw new graphql_1.GraphQLError("Already enlisted as Barangay Coor.", {
                    extensions: { code: 500 },
                });
            }
            const leadr = yield prisma_1.prisma.teamLeader.create({
                data: {
                    hubId: "none",
                    votersId: id,
                    municipalsId: voter.municipalsId,
                    barangaysId: voter.barangaysId,
                    candidatesId: candidate.id,
                    purokId: voter.purokId,
                    level,
                },
            });
            const team = yield prisma_1.prisma.team.create({
                data: {
                    teamLeaderId: leadr.id,
                    candidatesId: candidate.id,
                    purokId: voter.purokId,
                    municipalsId: voter.municipalsId,
                    barangaysId: voter.barangaysId,
                    level: level,
                },
            });
            yield prisma_1.prisma.teamLeader.update({
                where: { id: leadr.id },
                data: {
                    teamId: team.id,
                },
            });
            yield prisma_1.prisma.voters.update({
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
        }),
        addTeam: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { headId, teamIdList, level }) {
            const rejectList = [];
            const headerData = yield prisma_1.prisma.voters.findUnique({
                where: {
                    id: headId,
                },
            });
            if (!headerData) {
                throw new graphql_1.GraphQLError("Head person unfound.", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            if (headerData.level !== level + 1) {
                throw new graphql_1.GraphQLError("Head person unqualified.", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            const votersData = yield prisma_1.prisma.voters.findMany({
                where: {
                    id: { in: teamIdList.map((member) => member.id) },
                },
            });
            const teamVoterCount = yield prisma_1.prisma.team.findFirst({
                where: { teamLeaderId: headId },
                select: {
                    _count: { select: { voters: true } },
                    id: true,
                },
            });
            if (level === 0 && (teamVoterCount === null || teamVoterCount === void 0 ? void 0 : teamVoterCount._count.voters) >= 10) {
                throw new graphql_1.GraphQLError("Limit reached", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            const purokCoorTeam = yield prisma_1.prisma.purokCoor.findFirst({
                where: { votersId: headId },
                select: {
                    _count: { select: { TeamLeader: true } },
                    id: true,
                },
            });
            if (level === 1 && (purokCoorTeam === null || purokCoorTeam === void 0 ? void 0 : purokCoorTeam._count.TeamLeader) >= 10) {
                throw new graphql_1.GraphQLError("Limit reached", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            yield Promise.all(teamIdList.map((member) => __awaiter(void 0, void 0, void 0, function* () {
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
                    const teamLeader = yield prisma_1.prisma.teamLeader.findFirst({
                        where: {
                            voterId: headId,
                        },
                    });
                    if (!teamLeader) {
                        throw new graphql_1.GraphQLError("Team Leader not found");
                    }
                    const team = yield prisma_1.prisma.team.findFirst({
                        where: {
                            teamLeaderId: teamLeader.id,
                        },
                    });
                    if (!team) {
                        throw new graphql_1.GraphQLError("No team found with selected leader");
                    }
                    yield prisma_1.prisma.voters.update({
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
                    const teamLeader = yield prisma_1.prisma.teamLeader.create({
                        data: {
                            votersId: member.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            handle: 10,
                            hubId: "Unknown",
                            level: 1,
                            candidatesId: headerData.candidatesId,
                        },
                    });
                    const team = yield prisma_1.prisma.team.create({
                        data: {
                            teamLeaderId: teamLeader.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            candidatesId: headerData.candidatesId,
                            level: 1,
                        },
                    });
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: teamLeader.id },
                        data: { teamId: team.id },
                    });
                    yield prisma_1.prisma.voters.update({
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
                    const teamLeader = yield prisma_1.prisma.teamLeader.create({
                        data: {
                            votersId: member.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            handle: 10,
                            hubId: "Unknown",
                            level,
                        },
                    });
                    if (!teamLeader)
                        return;
                    console.log("Team leader creared: ", teamLeader);
                    const team = yield prisma_1.prisma.team.create({
                        data: {
                            teamLeaderId: teamLeader.id,
                            municipalsId: teamLeader.municipalsId,
                            barangaysId: teamLeader.barangaysId,
                            purokId: teamLeader.purokId,
                            candidatesId: headerData.candidatesId,
                            level,
                        },
                    });
                    console.log("Team Created: ", team);
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: teamLeader.id },
                        data: { teamId: team.id },
                    });
                    yield prisma_1.prisma.voters.update({
                        where: { id: voter.id },
                        data: {
                            level,
                            teamId: team.id,
                            candidatesId: headerData.candidatesId,
                        },
                    });
                    return;
                }
            })));
            return JSON.stringify(rejectList);
        }),
        addMember: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { headId, teamIdList, level, teamId }) {
            const rejectList = [];
            const headerData = yield prisma_1.prisma.voters.findUnique({
                where: {
                    id: headId,
                },
            });
            if (!headerData) {
                throw new graphql_1.GraphQLError("Head person unfound.", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            if (headerData.level !== level + 1) {
                throw new graphql_1.GraphQLError("Head person unqualified.", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            const votersData = yield prisma_1.prisma.voters.findMany({
                where: {
                    id: { in: teamIdList.map((member) => member.id) },
                },
            });
            const teamVoterCount = yield prisma_1.prisma.team.findFirst({
                where: { teamLeaderId: headId },
                select: {
                    _count: { select: { voters: true } },
                    id: true,
                },
            });
            if (level === 0 && (teamVoterCount === null || teamVoterCount === void 0 ? void 0 : teamVoterCount._count.voters) >= 10) {
                throw new graphql_1.GraphQLError("Limit reached", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            const purokCoorTeam = yield prisma_1.prisma.purokCoor.findFirst({
                where: { votersId: headId },
                select: {
                    _count: { select: { TeamLeader: true } },
                    id: true,
                },
            });
            if (level === 1 && (purokCoorTeam === null || purokCoorTeam === void 0 ? void 0 : purokCoorTeam._count.TeamLeader) >= 10) {
                throw new graphql_1.GraphQLError("Limit reached", {
                    extensions: { code: "REQUEST_ERROR" },
                });
            }
            yield Promise.all(teamIdList.map((member) => __awaiter(void 0, void 0, void 0, function* () {
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
                    const team = yield prisma_1.prisma.team.findFirst({
                        where: {
                            id: teamId,
                        },
                    });
                    if (!team) {
                        throw new graphql_1.GraphQLError("No team found with selected leader");
                    }
                    yield prisma_1.prisma.voters.update({
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
                    const teamLeader = yield prisma_1.prisma.teamLeader.create({
                        data: {
                            votersId: member.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            handle: 10,
                            hubId: "Unknown",
                            level: 1,
                            candidatesId: headerData.candidatesId,
                        },
                    });
                    const team = yield prisma_1.prisma.team.create({
                        data: {
                            teamLeaderId: teamLeader.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            candidatesId: headerData.candidatesId,
                            level: 1,
                        },
                    });
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: teamLeader.id },
                        data: { teamId: team.id },
                    });
                    yield prisma_1.prisma.voters.update({
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
                    const teamLeader = yield prisma_1.prisma.teamLeader.create({
                        data: {
                            votersId: member.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            handle: 10,
                            hubId: "Unknown",
                            level,
                            teamId,
                        },
                    });
                    if (!teamLeader)
                        return;
                    const team = yield prisma_1.prisma.team.create({
                        data: {
                            teamLeaderId: teamLeader.id,
                            municipalsId: voter.municipalsId,
                            barangaysId: voter.barangaysId,
                            purokId: voter.purokId,
                            candidatesId: headerData.candidatesId,
                            level: 2,
                        },
                    });
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: teamLeader.id },
                        data: { teamId: team.id },
                    });
                    yield prisma_1.prisma.voters.update({
                        where: { id: voter.id },
                        data: {
                            level,
                            teamId: teamId,
                            candidatesId: headerData.candidatesId,
                        },
                    });
                    return;
                }
            })));
            return JSON.stringify(rejectList);
        }),
        removeVotersArea: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode, barangayId, purokId }) {
            if (purokId && purokId !== "all") {
                yield prisma_1.prisma.voters.deleteMany({
                    where: {
                        purokId,
                    },
                });
            }
            else if (barangayId && barangayId !== "all") {
                yield prisma_1.prisma.voters.deleteMany({
                    where: {
                        barangaysId: barangayId,
                    },
                });
            }
            else if (zipCode && zipCode !== "all") {
                yield prisma_1.prisma.voters.deleteMany({
                    where: {
                        municipalsId: parseInt(zipCode, 10),
                    },
                });
            }
            else {
                yield prisma_1.prisma.voters.deleteMany();
            }
            return "OK";
        }),
        genderBundleQrCode: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { idList }) {
            const rejectList = [];
            for (let item of idList) {
                try {
                    const voter = yield prisma_1.prisma.voters.findUnique({ where: { id: item } });
                    if ((voter === null || voter === void 0 ? void 0 : voter.qrCode) !== "None") {
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
                    const generatedCode = yield qrcode_1.default.toDataURL(item);
                    const stampOne = yield prisma_1.prisma.qRcode.create({
                        data: {
                            qrCode: generatedCode,
                            votersId: item,
                            stamp: 1,
                        },
                    });
                    yield prisma_1.prisma.qRcode.create({
                        data: {
                            qrCode: generatedCode,
                            votersId: item,
                            stamp: 2,
                            number: stampOne.number,
                        },
                    });
                }
                catch (error) {
                    continue;
                }
            }
            return JSON.stringify(rejectList);
        }),
        generatedTeamQRCode: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { teamId }) {
            const team = yield prisma_1.prisma.team.findUnique({
                where: {
                    id: teamId,
                },
            });
            if (!team) {
                throw new graphql_1.GraphQLError("Couldn't find team");
            }
            const teamMembers = yield prisma_1.prisma.voters.findMany({
                where: {
                    teamId,
                },
            });
            if (teamMembers.length === 0) {
                throw new graphql_1.GraphQLError("NO team members were found");
            }
            for (const voter of teamMembers) {
                try {
                    if (voter.qrCodeNumber) {
                        continue;
                    }
                    const generatedCode = yield qrcode_1.default.toDataURL(voter.id);
                    if (!generatedCode) {
                        continue;
                    }
                    const stampOne = yield prisma_1.prisma.qRcode.create({
                        data: {
                            qrCode: generatedCode,
                            votersId: voter.id,
                            stamp: 1,
                        },
                    });
                    yield prisma_1.prisma.qRcode.create({
                        data: {
                            qrCode: generatedCode,
                            votersId: voter.id,
                            stamp: 2,
                            number: stampOne.number,
                        },
                    });
                    yield prisma_1.prisma.voters.update({
                        where: { id: voter.id },
                        data: {
                            qrCode: generatedCode,
                            qrCodeNumber: stampOne.number,
                        },
                    });
                }
                catch (error) {
                    console.log(error);
                    continue;
                }
            }
            return "OK";
        }),
        removeQRcode: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.voters.updateMany({
                where: {
                    id: { in: id.map((item) => item) },
                },
                data: {
                    qrCode: "None",
                    qrCodeNumber: 0,
                },
            });
            yield prisma_1.prisma.qRcode.deleteMany({
                where: {
                    votersId: { in: id.map((item) => item) },
                },
            });
            return "OK";
        }),
        createPostion: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { title }) {
            const position = yield prisma_1.prisma.position.findFirst({
                where: {
                    title,
                },
            });
            if (position && position.title.toLowerCase() === title.toLowerCase()) {
                throw new graphql_1.GraphQLError("Position already exist.");
            }
            yield prisma_1.prisma.position.create({
                data: {
                    title,
                },
            });
            return "OK";
        }),
        addNewCandidate: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { firstname, lastname, code, colorCode }) {
            const candidate = yield prisma_1.prisma.candidates.findFirst({
                where: {
                    lastname,
                    firstname,
                },
            });
            if (candidate) {
                if (candidate.code === code) {
                    throw new graphql_1.GraphQLError("Candidate code already used", {
                        extensions: { code: "CODE_EXIST" },
                    });
                }
                if (candidate.colorCode === colorCode) {
                    throw new graphql_1.GraphQLError("Candidate color code already used", {
                        extensions: { code: "COLOR_CODE_EXIST" },
                    });
                }
                throw new graphql_1.GraphQLError("Candidate already exists", {
                    extensions: { code: "EXISTED_NAME" },
                });
            }
            yield prisma_1.prisma.candidates.create({
                data: {
                    firstname,
                    lastname,
                    code,
                    candidateBatchId: "none",
                    colorCode,
                },
            });
            return "OK";
        }),
        updateLeader: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { teamId, id, level, method }) {
            if (method === 0) {
                yield prisma_1.prisma.team.update({
                    where: {
                        id: teamId,
                        teamLeaderId: id,
                    },
                    data: {
                        teamLeaderId: undefined,
                    },
                });
                yield prisma_1.prisma.teamLeader.delete({
                    where: {
                        id,
                    },
                });
            }
            if (method === 1) {
            }
            return "OK";
        }),
        changeLeader: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id, teamId, level }) {
            const data = yield prisma_1.prisma.voters.findUnique({
                where: { id },
            });
            if (!data) {
                throw new graphql_1.GraphQLError("Voter not found", {
                    extensions: { code: "VOTER_NOT_FOUND" },
                });
            }
            const team = yield prisma_1.prisma.team.findUnique({
                where: {
                    id: teamId,
                },
            });
            if (!team) {
                throw new graphql_1.GraphQLError("Team not found");
            }
            const teamLeader = yield prisma_1.prisma.teamLeader.create({
                data: {
                    votersId: data.id,
                    municipalsId: data.municipalsId,
                    barangaysId: data.barangaysId,
                    purokId: data.purokId,
                    handle: 10,
                    hubId: "Unknown",
                    level: 1,
                    candidatesId: team.candidatesId,
                },
            });
            const newteam = yield prisma_1.prisma.team.update({
                where: { id: teamId },
                data: {
                    teamLeaderId: teamLeader.id,
                },
            });
            yield prisma_1.prisma.voters.update({
                where: {
                    id,
                },
                data: {
                    teamId: newteam.id,
                    candidatesId: team.candidatesId,
                },
            });
            return "OK";
        }),
        deleteTeams: () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.prisma.qRcode.deleteMany();
            yield prisma_1.prisma.team.deleteMany();
            return "OK";
        }),
        assignBarangayIDnumber: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode }) {
            const barangays = yield prisma_1.prisma.barangays.findMany({
                where: {
                    municipalId: zipCode,
                },
                orderBy: {
                    name: "asc",
                },
            });
            const updates = barangays.map((barangay, index) => {
                return prisma_1.prisma.barangays.update({
                    where: {
                        id: barangay.id,
                    },
                    data: {
                        number: index + 1,
                    },
                });
            });
            yield Promise.all(updates);
            return "OK";
        }),
        assignTeam: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { team }) {
            const resultList = [];
            const members = [
                ...team.members,
                team.barangayCoorId,
                team.purokCoorId,
                team.teamLeaderId,
            ];
            const barangay = yield prisma_1.prisma.barangays.findFirst({
                where: {
                    number: parseInt(team.barangayId, 10),
                },
            });
            if (!barangay) {
                throw new graphql_1.GraphQLError("Barangay not found");
            }
            const supporting = yield prisma_1.prisma.candidates.findFirst({
                where: {
                    code: { contains: "jml", mode: "insensitive" },
                },
            });
            const handleLeaderData = (idNumber, level) => {
                return membersList.find((item) => item.idNumber === idNumber);
            };
            const membersList = yield prisma_1.prisma.voters.findMany({
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
            const handleLeaderInfo = (id, level, teamId, purokId, voterId) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Params: ", { id, level, teamId, purokId });
                console.log("Supporting: ", supporting === null || supporting === void 0 ? void 0 : supporting.code);
                const leader = yield prisma_1.prisma.teamLeader.findFirst({
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
                    const teamData = yield prisma_1.prisma.team.create({
                        data: {
                            municipalsId: team.zipCode,
                            barangaysId: barangay.id,
                            purokId: purokId ? purokId : barangayCoor === null || barangayCoor === void 0 ? void 0 : barangayCoor.purokId,
                            level,
                        },
                    });
                    const leaderMetaData = yield prisma_1.prisma.teamLeader.create({
                        data: {
                            votersId: voterId,
                            municipalsId: team.zipCode,
                            barangaysId: barangay.id,
                            purokId: purokId ? purokId : barangayCoor === null || barangayCoor === void 0 ? void 0 : barangayCoor.purokId,
                            handle: 0,
                            hubId: "Unknown",
                            level,
                            candidatesId: supporting === null || supporting === void 0 ? void 0 : supporting.id,
                            teamId: teamData.id,
                        },
                    });
                    console.log("Created Leader: ", leaderMetaData);
                    yield prisma_1.prisma.team.update({
                        where: {
                            id: teamData.id,
                        },
                        data: {
                            teamLeaderId: leaderMetaData.id,
                        },
                    });
                    console.log("Created Team: ", teamData);
                    const updatedVoter = yield prisma_1.prisma.voters.update({
                        where: {
                            id: voterId,
                        },
                        data: {
                            teamId,
                            level,
                            candidatesId: supporting === null || supporting === void 0 ? void 0 : supporting.id,
                        },
                    });
                    console.log("Updated Voter: ", updatedVoter);
                }
                return leader;
            });
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
            const barangayCoorData = yield handleLeaderInfo(team.barangayCoorId, 3, undefined, barangayCoor === null || barangayCoor === void 0 ? void 0 : barangayCoor.purokId, barangayCoor === null || barangayCoor === void 0 ? void 0 : barangayCoor.id);
            const purokCoorData = yield handleLeaderInfo(team.purokCoorId, 2, barangayCoorData === null || barangayCoorData === void 0 ? void 0 : barangayCoorData.teamId, purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.purokId, purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.id);
            const teamLeaderData = yield handleLeaderInfo(team.teamLeaderId, 1, purokCoorData === null || purokCoorData === void 0 ? void 0 : purokCoorData.teamId, purokCoorData === null || purokCoorData === void 0 ? void 0 : purokCoorData.purokId, teamLeader === null || teamLeader === void 0 ? void 0 : teamLeader.id);
            const temp = yield prisma_1.prisma.validatedTeams.create({
                data: {
                    purokId: purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.purokId,
                    barangaysId: barangay.id,
                    municipalsId: team.zipCode,
                    teamLeaderId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.id,
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
                            reason: `May katayuan na (${(0, data_1.handleLevel)(member.level)})`,
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
                    yield prisma_1.prisma.voters.update({
                        where: { id: member.id },
                        data: {
                            teamId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.teamId,
                            candidatesId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.candidatesId,
                            level: 0,
                        },
                    });
                }
                catch (error) {
                    console.error(error);
                    continue;
                }
            }
            const teamMembers = resultList.map((item) => {
                var _a;
                return {
                    idNumber: item.idNumber,
                    votersId: item.id,
                    barangayId: item.barangaysId,
                    municipalsId: item.municipalsId,
                    purokId: (_a = teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.purokId) !== null && _a !== void 0 ? _a : purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.purokId,
                    teamLeaderId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.id,
                    validatedTeamsId: temp.id,
                    remark: item.reason,
                };
            });
            yield prisma_1.prisma.validatedTeamMembers.createMany({
                data: teamMembers,
                skipDuplicates: true,
            });
            return JSON.stringify(teamMembers);
        }),
        composeTeam: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { team }) {
            console.log({ team });
            let successCount = 0;
            const resultList = [];
            const members = [
                team.barangayCoorId,
                team.purokCoorId,
                team.teamLeaderId,
            ];
            const barangay = yield prisma_1.prisma.barangays.findFirst({
                where: {
                    number: parseInt(team.barangayId, 10),
                    municipalId: team.zipCode,
                },
            });
            if (!barangay) {
                throw new graphql_1.GraphQLError(`Could not find Barangay`);
            }
            const supporting = yield prisma_1.prisma.candidates.findFirst({
                where: {
                    code: { contains: "jml", mode: "insensitive" },
                },
            });
            const membersData = yield prisma_1.prisma.voters.findMany({
                where: {
                    idNumber: { in: members },
                    municipalsId: team.zipCode,
                    barangay: {
                        number: parseInt(team.barangayId, 10),
                    },
                },
            });
            const handleGetInitInfo = (id) => {
                return membersData.find((item) => item.idNumber === id);
            };
            const barangayCoor = handleGetInitInfo(team.barangayCoorId);
            const purokCoor = handleGetInitInfo(team.purokCoorId);
            const teamLeader = handleGetInitInfo(team.teamLeaderId);
            const handleGetLeaderData = (id, level, voterId, purokId, teamId, headIdOne, headIdTwo) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const leader = yield prisma_1.prisma.teamLeader.findFirst({
                        where: {
                            voter: {
                                idNumber: id,
                            },
                            municipalsId: team.zipCode,
                            barangaysId: barangay.id,
                        },
                    });
                    if (leader) {
                        return Object.assign(Object.assign({}, leader), { teamId: leader.teamId });
                    }
                    const newLeader = yield prisma_1.prisma.teamLeader.create({
                        data: {
                            votersId: voterId,
                            municipalsId: team.zipCode,
                            barangaysId: barangay.id,
                            teamId: null,
                            candidatesId: supporting === null || supporting === void 0 ? void 0 : supporting.id,
                            level,
                            hubId: "unknown",
                            handle: 0,
                            purokId: purokId,
                            barangayCoorId: level === 2 || level === 1 ? headIdOne : null,
                            purokCoorsId: level === 1 ? headIdTwo : null,
                        },
                    });
                    const newTeam = yield prisma_1.prisma.team.create({
                        data: {
                            barangaysId: barangay.id,
                            municipalsId: team.zipCode,
                            teamLeaderId: newLeader.id,
                            candidatesId: supporting === null || supporting === void 0 ? void 0 : supporting.id,
                            hubId: null,
                            level,
                        },
                    });
                    yield prisma_1.prisma.teamLeader.update({
                        where: { id: newLeader.id },
                        data: {
                            teamId: newTeam.id,
                        },
                    });
                    yield prisma_1.prisma.voters.update({
                        where: {
                            id: voterId,
                        },
                        data: {
                            teamId: teamId,
                            level,
                            candidatesId: supporting === null || supporting === void 0 ? void 0 : supporting.id,
                        },
                    });
                    return Object.assign(Object.assign({}, newLeader), { teamId: newTeam.id });
                }
                catch (error) {
                    console.error("Something went wrong:", error);
                    return null;
                }
            });
            const barangayCoorData = yield handleGetLeaderData(team.barangayCoorId, 3, barangayCoor === null || barangayCoor === void 0 ? void 0 : barangayCoor.id, barangayCoor === null || barangayCoor === void 0 ? void 0 : barangayCoor.purokId, undefined, undefined);
            const purokCoorData = yield handleGetLeaderData(team.purokCoorId, 2, purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.id, purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.purokId, barangayCoorData === null || barangayCoorData === void 0 ? void 0 : barangayCoorData.teamId, barangayCoorData === null || barangayCoorData === void 0 ? void 0 : barangayCoorData.id);
            const teamLeaderData = yield handleGetLeaderData(team.teamLeaderId, 1, teamLeader === null || teamLeader === void 0 ? void 0 : teamLeader.id, teamLeader === null || teamLeader === void 0 ? void 0 : teamLeader.purokId, purokCoorData === null || purokCoorData === void 0 ? void 0 : purokCoorData.teamId, barangayCoorData === null || barangayCoorData === void 0 ? void 0 : barangayCoorData.id, purokCoorData === null || purokCoorData === void 0 ? void 0 : purokCoorData.id);
            const temp = yield prisma_1.prisma.validatedTeams.create({
                data: {
                    purokId: purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.purokId,
                    barangaysId: barangay.id,
                    municipalsId: team.zipCode,
                    teamLeaderId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.id,
                },
            });
            const processedVoters = new Set();
            const alreadyInTeam = [];
            for (const member of team.members) {
                try {
                    const voter = yield prisma_1.prisma.voters.findFirst({
                        where: {
                            idNumber: member,
                            municipalsId: team.zipCode,
                            barangay: {
                                number: parseInt(team.barangayId, 10),
                            },
                        },
                    });
                    let votersTeam = null;
                    if (voter === null || voter === void 0 ? void 0 : voter.teamId) {
                        votersTeam = yield prisma_1.prisma.team.findFirst({
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
                                id: undefined,
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
                    // if (voter.level > 0) {
                    //   if (!processedVoters.has(voter.id)) {
                    //     resultList.push({
                    //       id: voter.id,
                    //       firstname: voter.firstname,
                    //       lastname: voter.lastname,
                    //       municipalsId: voter.municipalsId,
                    //       barangaysId: voter.barangaysId,
                    //       reason: `May katayuan na (${handleLevel(voter.level)})`,
                    //       level: voter.level,
                    //       idNumber: voter.idNumber,
                    //       code: 1,
                    //     });
                    //     processedVoters.add(voter.id);
                    //   }
                    // }
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
                            alreadyInTeam.push(voter);
                            processedVoters.add(voter.id);
                            continue;
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
                    yield prisma_1.prisma.voters.update({
                        where: { id: voter.id },
                        data: {
                            teamId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.teamId,
                            candidatesId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.candidatesId,
                            level: 0,
                        },
                    });
                }
                catch (error) {
                    console.error(error);
                    continue;
                }
            }
            const teamMembers = resultList.map((item) => {
                var _a;
                return {
                    idNumber: item.idNumber,
                    votersId: item.id,
                    barangayId: item.barangaysId,
                    municipalsId: item.municipalsId,
                    purokId: (_a = teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.purokId) !== null && _a !== void 0 ? _a : purokCoor === null || purokCoor === void 0 ? void 0 : purokCoor.purokId,
                    teamLeaderId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.id,
                    validatedTeamsId: temp.id,
                    remark: item.reason,
                };
            });
            const records = resultList
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
            yield prisma_1.prisma.$transaction([
                prisma_1.prisma.voterRecords.createMany({
                    data: records,
                }),
                prisma_1.prisma.validatedTeams.update({
                    where: {
                        id: temp.id,
                    },
                    data: {
                        issues: totalIssues,
                    },
                }),
                prisma_1.prisma.validatedTeamMembers.createMany({
                    data: teamMembers,
                    skipDuplicates: true,
                }),
                prisma_1.prisma.duplicateteamMembers.createMany({
                    data: alreadyInTeam.map((item) => ({
                        votersId: item.id,
                        teamId: item.teamId,
                        foundTeamId: teamLeaderData === null || teamLeaderData === void 0 ? void 0 : teamLeaderData.teamId,
                        municipalsId: item.municipalsId,
                        barangaysId: item.barangaysId,
                    })),
                }),
            ]);
            yield prisma_1.prisma.$disconnect();
            return JSON.stringify(teamMembers);
        }),
        clearTeamRecords: () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.prisma.validatedTeams.deleteMany();
            return "OK";
        }),
        multiSelectVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { teamId, members, method }) {
            const team = yield prisma_1.prisma.team.findUnique({
                where: {
                    id: teamId,
                },
            });
            console.log("team: ", team && team.level);
            if (method) {
                yield prisma_1.prisma.voters.updateMany({
                    where: { id: { in: members } },
                    data: { teamId: teamId, candidatesId: team === null || team === void 0 ? void 0 : team.candidatesId, level: 0 },
                });
                return "OK";
            }
            yield prisma_1.prisma.voters.updateMany({
                where: { id: { in: members } },
                data: { teamId: null, candidatesId: null, level: 0 },
            });
            // Delete related TeamLeader records first
            const deletedLeaders = yield prisma_1.prisma.teamLeader.deleteMany({
                where: {
                    votersId: { in: members },
                },
            });
            console.log("Deleted Leaders: ", deletedLeaders);
            // Delete team records
            const deletedTeams = yield prisma_1.prisma.team.deleteMany({
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
        }),
        removeTeam: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.voters.updateMany({
                where: {
                    teamId: id,
                },
                data: {
                    teamId: null,
                    candidatesId: null,
                    level: 0,
                },
            });
            yield prisma_1.prisma.teamLeader.deleteMany({
                where: {
                    teamId: id,
                },
            });
            yield prisma_1.prisma.team.delete({
                where: {
                    id,
                },
            });
            return "OK";
        }),
        removeAllTeams: () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.prisma.team.deleteMany();
            return "OK";
        }),
        createCustomOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma_1.prisma.customOption.create({
                data: {
                    value: "0",
                    queriesId: id,
                },
            });
            return "OK";
        }),
        resetTeamList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode, barangayId }) {
            console.log({ zipCode, barangayId });
            const filter = {};
            if (zipCode) {
                filter.municipalsId = parseInt(zipCode, 10);
            }
            if (barangayId) {
                filter.barangay = {
                    number: parseInt(barangayId, 10),
                };
            }
            yield prisma_1.prisma.$transaction([
                prisma_1.prisma.voters.updateMany({
                    where: Object.assign({ teamId: { not: null } }, filter),
                    data: {
                        teamId: null,
                        candidatesId: null,
                        level: 0,
                    },
                }),
                prisma_1.prisma.team.deleteMany({
                    where: filter,
                }),
                prisma_1.prisma.teamLeader.deleteMany({
                    where: Object.assign({}, filter),
                }),
                prisma_1.prisma.voterRecords.deleteMany({
                    where: {
                        voter: filter,
                    },
                }),
            ]);
            return "OK";
        }),
        teamMerger: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { firstId, secondId }) {
            console.log({ firstId, secondId });
            const [first, second, teamSecond] = yield prisma_1.prisma.$transaction([
                prisma_1.prisma.teamLeader.findUnique({
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
                prisma_1.prisma.teamLeader.findUnique({
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
                prisma_1.prisma.team.findFirst({
                    where: { teamLeaderId: secondId },
                }),
            ]);
            if (!first || !second || !teamSecond) {
                throw new graphql_1.GraphQLError("Could not find any team leader or associated team");
            }
            console.log({ first, second, teamSecond });
            // Update voters and reassign them to the first team
            yield prisma_1.prisma.$transaction([
                // Reassign voters of the second team to the first team
                prisma_1.prisma.voters.updateMany({
                    where: {
                        teamId: teamSecond.id, // Voters associated with the second team
                    },
                    data: {
                        teamId: first.teamId, // Reassign to the first team
                    },
                }),
                // Update the second team to now belong to the first team leader
                prisma_1.prisma.team.update({
                    where: {
                        id: teamSecond.id,
                    },
                    data: {
                        teamLeaderId: firstId,
                    },
                }),
                // Delete the second team leader
                prisma_1.prisma.teamLeader.delete({
                    where: {
                        id: secondId,
                    },
                }),
            ]);
            return "OK";
        }),
    },
    Voter: {
        votersCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.count();
        }),
        purok: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return prisma_1.prisma.purok.findUnique({
                where: {
                    id: parent.purokId,
                },
            });
        }),
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findUnique({
                where: {
                    id: parent.barangaysId,
                },
            });
        }),
        municipal: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.municipals.findUnique({
                where: {
                    id: parent.municipalsId,
                },
            });
        }),
        qrCodes: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.qRcode.findMany({
                where: {
                    votersId: parent.id,
                },
            });
        }),
        leader: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.teamLeader.findFirst({
                where: { votersId: parent.id },
            });
        }),
        record: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voterRecords.findMany({
                where: {
                    votersId: parent.id,
                },
            });
        }),
    },
    Municipal: {
        barangays: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findMany({
                where: { municipalId: parent.id },
            });
        }),
        voters: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.findMany({
                where: { municipalsId: parent.id },
            });
        }),
        barangaysCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.count({
                where: { municipalId: parent.id },
            });
        }),
    },
    Barangay: {
        barangayVotersCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.count({
                where: {
                    municipalsId: parent.municipalId,
                    barangaysId: parent.id,
                    saveStatus: "listed",
                },
            });
        }),
        purokCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.purok.count({ where: { barangaysId: parent.id } });
        }),
        puroks: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.purok.findMany({ where: { barangaysId: parent.id } });
        }),
        surveyResponse: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { survey }) {
            return yield prisma_1.prisma.surveyResponse.findMany({
                where: { municipalsId: survey.municipalsId, surveyId: survey.surveyId },
            });
        }),
        surveyRespondentResponse: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { survey }) {
            return yield prisma_1.prisma.respondentResponse.findMany({
                where: {
                    municipalsId: survey.municipalsId,
                    surveyId: survey.surveyId,
                    barangaysId: parent.id,
                },
            });
        }),
        RespondentResponse: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id, zipCode }) {
            return yield prisma_1.prisma.respondentResponse.count({
                where: {
                    barangaysId: parent.id,
                    surveyId: id,
                    municipalsId: zipCode,
                },
            });
        }),
        quota: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.quota.findMany({
                where: { barangaysId: parent.id },
            });
        }),
        quotas: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.quota.findFirst({
                where: { barangaysId: parent.id },
            });
        }),
        optionResponse: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id, surveyId }) {
            return yield prisma_1.prisma.response.count({
                where: {
                    barangaysId: parent.id,
                    surveyId: surveyId,
                    optionId: id,
                },
            });
        }),
        selectedQuery: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id }) {
            return yield prisma_1.prisma.option.findMany({
                where: {
                    queryId: id,
                },
            });
        }),
        validationList: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.validation.findMany({
                where: {
                    barangaysId: parent.id,
                },
                orderBy: {
                    timestamp: "desc",
                },
            });
        }),
        supporters: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id }) {
            const figureHeads = yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    barangaysId: parent.id,
                    candidatesId: id,
                },
            });
            const voters = yield prisma_1.prisma.voters.count({
                where: {
                    barangaysId: parent.id,
                    candidatesId: id,
                    teamId: { not: null },
                    level: { not: 1 },
                },
            });
            const voterWithoutTeam = yield prisma_1.prisma.voters.count({
                where: {
                    barangaysId: parent.id,
                    candidatesId: id,
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
        }),
        teamStat: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const team = yield prisma_1.prisma.team.findMany({
                where: {
                    barangaysId: parent.id, // Filter by barangay ID
                },
                include: {
                    _count: {
                        select: {
                            voters: true,
                        },
                    },
                },
            });
            return {
                aboveMax: team.filter((item) => item._count.voters > 10).length,
                belowMax: team.filter((item) => item._count.voters < 10 && item._count.voters > 5).length,
                equalToMax: team.filter((item) => item._count.voters === 10).length,
                aboveMin: team.filter((item) => item._count.voters > 5).length,
                equalToMin: team.filter((item) => item._count.voters === 5).length,
                belowMin: team.filter((item) => item._count.voters === 4).length,
                threeAndBelow: team.filter((item) => item._count.voters <= 3).length,
            };
        }),
        leaders: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { skip, candidateId }) {
            return yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    barangaysId: parent.id,
                    level: 2,
                    candidatesId: candidateId,
                },
            });
        }),
    },
    Purok: {
        purokDraftedVotersCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.count({
                where: {
                    municipalsId: parent.municipalsId,
                    barangaysId: parent.barangaysId,
                    newBatchDraftId: parent.draftID,
                    purokId: parent.id,
                    saveStatus: "drafted",
                },
            });
        }),
    },
    NewBatchDraft: {
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findUnique({
                where: { id: parent.barangayId },
            });
        }),
        municipal: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.municipalId === null) {
                throw new Error("Municipal ID cannot be null");
            }
            return yield prisma_1.prisma.municipals.findUnique({
                where: { id: parent.municipalId },
            });
        }),
    },
    Survey: {
        admin: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.adminUser.findUnique({
                where: { uid: parent.adminUserUid },
            });
        }),
        queries: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.queries.findMany({ where: { surveyId: parent.id } });
        }),
        images: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.mediaUrl.findMany({ where: { surveyId: parent.id } });
        }),
        responseCount: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { zipCode }) {
            return yield prisma_1.prisma.respondentResponse.count({
                where: { municipalsId: zipCode, surveyId: parent.id },
            });
        }),
        ageCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.ageBracket.findMany();
        }),
        result: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield prisma_1.prisma.queries.findMany({
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
            let surveyResults = {
                tagID: "",
                id: "",
                zipCode: 0,
                barangay: "",
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
            console.log("Resuts: ", JSON.stringify(result, null, 2));
            return "OK";
        }),
    },
    Queries: {
        options: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.option.findMany({
                where: { queryId: parent.id },
                orderBy: { order: "asc" },
            });
        }),
        respondentOption: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id }) {
            return yield prisma_1.prisma.response.findMany({
                where: {
                    queryId: parent.id,
                    respondentResponseId: id,
                },
            });
        }),
        barangayList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode }) {
            console.log(zipCode);
            return yield prisma_1.prisma.barangays.findMany({
                where: { municipalId: zipCode },
                orderBy: { name: "asc" },
            });
        }),
        customOption: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { zipCode, barangayId, surveyId }) {
            console.log({ zipCode, barangayId, surveyId });
            const filter = {};
            if (barangayId !== "all") {
                filter.barangaysId = barangayId;
            }
            return yield prisma_1.prisma.customOption.findMany({
                where: {
                    queriesId: parent.id,
                    RespondentResponse: Object.assign({ municipalsId: zipCode, surveyId: surveyId }, filter),
                },
            });
        }),
    },
    Option: {
        fileUrl: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.id) {
                return null;
            }
            return yield prisma_1.prisma.mediaUrl.findFirst({
                where: { optionId: parent.id },
            });
        }),
        overAllResponse: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id, zipCode, barangayId, genderId }) {
            let filters = {
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
            const responses = yield prisma_1.prisma.response.count({
                where: filters,
            });
            return responses;
        }),
        ageCountRank: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id, ageBracketId, barangayId, genderId }) {
            let filters = {
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
            return yield prisma_1.prisma.response.count({
                where: filters,
            });
        }),
        optionRank: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { surveyId, ageBracketId, barangayId, genderId }) {
            let filters = {
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
            return yield prisma_1.prisma.response.count({
                where: filters,
            });
        }),
        barangays: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findMany({ where: { municipalId: 4905 } });
        }),
        results: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const responses = yield prisma_1.prisma.respondentResponse.findMany({
                where: {
                    Response: {
                        some: { optionId: parent.id },
                    },
                },
                include: {},
            });
            return 0;
        }),
    },
    RespondentResponse: {
        age: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.ageBracket.findUnique({
                where: { id: parent.ageBracketId },
            });
        }),
        gender: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.gender.findUnique({ where: { id: parent.genderId } });
        }),
        responses: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.response.findMany({
                where: { respondentResponseId: parent.id },
            });
        }),
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findFirst({
                where: { id: parent.barangaysId },
            });
        }),
    },
    SurveyResponse: {
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findUnique({
                where: { id: parent.barangaysId },
            });
        }),
        respondentResponses: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return prisma_1.prisma.respondentResponse.findMany({
                where: { surveyResponseId: parent.id },
            });
        }),
        users: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.usersUid) {
                return null;
            }
            return yield prisma_1.prisma.users.findUnique({
                where: {
                    uid: parent.usersUid,
                },
            });
        }),
    },
    Quota: {
        age: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.ageBracket.findUnique({
                where: { id: parent.ageBracketId },
            });
        }),
        gendersSize: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.genderSize.findMany({
                where: { quotaId: parent.id },
            });
        }),
    },
    AgeBracket: {
        quota: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id }) {
            return yield prisma_1.prisma.quota.findMany({
                where: { ageBracketId: parent.id, barangaysId: id },
            });
        }),
        surveyAgeCount: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { id, zipCode, barangayId, genderId }) {
            const filters = {
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
            const responses = yield prisma_1.prisma.respondentResponse.count({
                where: filters,
            });
            return responses;
        }),
        optionAgeCount: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { surveyId }) {
            return yield prisma_1.prisma.queries.findMany({
                where: {
                    onTop: true,
                    surveyId: surveyId,
                },
            });
        }),
        overAllAgeRanking: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma_1.prisma.queries.findMany({
                where: {
                    surveyId: id,
                },
            });
        }),
        optionRank: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { surveyId, zipCode, barangayId, genderId, optionId }) {
            let filters = {
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
            return yield prisma_1.prisma.response.count({
                where: filters,
            });
        }),
    },
    GenderSize: {
        gender: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.gender.findFirst({
                where: { id: parent.genderId },
            });
        }),
    },
    Response: {
        option: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent) {
                return [];
            }
            return yield prisma_1.prisma.option.findMany({
                where: { id: parent.optionId },
            });
        }),
        queries: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.queries.findUnique({ where: { id: parent.queryId } });
        }),
    },
    ResponseRespondent: {
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findUnique({
                where: { id: parent.barangaysId },
            });
        }),
    },
    Team: {
        voters: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.findMany({ where: { teamId: parent.id } });
        }),
        teamLeader: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.teamLeaderId === null) {
                return null;
            }
            return yield prisma_1.prisma.teamLeader.findUnique({
                where: { id: parent.teamLeaderId },
            });
        }),
        candidate: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.candidatesId === null) {
                return null;
            }
            return yield prisma_1.prisma.candidates.findFirst({
                where: { id: parent.candidatesId },
            });
        }),
        purok: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.purokId === null) {
                return null;
            }
            return yield prisma_1.prisma.purok.findUnique({
                where: { id: parent.purokId },
            });
        }),
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.barangays.findUnique({
                where: {
                    id: parent.barangaysId,
                },
            });
        }),
        municipal: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.municipals.findUnique({
                where: {
                    id: parent.municipalsId,
                },
            });
        }),
        _count: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield prisma_1.prisma.voters.count({
                where: {
                    teamId: parent.id,
                },
            });
            return { voters: count }; // Return an object with the 'voters' field
        }),
        votersCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield prisma_1.prisma.voters.count({
                where: {
                    teamId: parent.id,
                },
            });
            return count;
        }),
    },
    TeamLeader: {
        voter: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.votersId === null) {
                return null;
            }
            return yield prisma_1.prisma.voters.findFirst({
                where: { id: parent.votersId },
            });
        }),
        barangayCoor: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.barangayCoorId === null) {
                return null;
            }
            return yield prisma_1.prisma.teamLeader.findFirst({
                where: {
                    id: parent.barangayCoorId,
                },
            });
        }),
        purokCoors: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.purokCoorsId === null) {
                return null;
            }
            return yield prisma_1.prisma.teamLeader.findFirst({
                where: {
                    id: parent.purokCoorsId,
                },
            });
        }),
        teamList: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.team.findMany({
                where: {
                    TeamLeader: {
                        voter: {
                            teamId: parent.teamId,
                        },
                    },
                },
            });
        }),
    },
    Candidates: {
        supporters: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.voters.count({
                where: { candidatesId: parent.id },
            });
        }),
        inTeam: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const figureHeads = yield prisma_1.prisma.teamLeader.findMany({
                where: {
                    candidatesId: parent.id,
                },
            });
            const voters = yield prisma_1.prisma.voters.count({
                where: {
                    candidatesId: parent.id,
                    teamId: { not: null },
                    level: { not: 1 },
                },
            });
            const voterWithoutTeam = yield prisma_1.prisma.voters.count({
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
        }),
    },
    ValidatedTeams: {
        teamLeader: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.teamLeaderId)
                return null;
            return yield prisma_1.prisma.teamLeader.findUnique({
                where: {
                    id: parent.teamLeaderId,
                },
            });
        }),
        municipal: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.municipalsId)
                return null;
            return yield prisma_1.prisma.municipals.findUnique({
                where: {
                    id: parent.municipalsId,
                },
            });
        }),
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.barangaysId)
                return null;
            return yield prisma_1.prisma.barangays.findUnique({
                where: {
                    id: parent.barangaysId,
                },
            });
        }),
        purok: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.purokId)
                return null;
            return prisma_1.prisma.purok.findUnique({
                where: {
                    id: parent.purokId,
                },
            });
        }),
        validatedTeamMembers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma_1.prisma.validatedTeamMembers.findMany({
                where: {
                    validatedTeamsId: parent.id,
                },
            });
        }),
    },
    ValidatedTeamMembers: {
        voter: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.votersId)
                return null;
            return yield prisma_1.prisma.voters.findUnique({
                where: {
                    id: parent.votersId,
                },
            });
        }),
    },
    Users: {
        qrCode: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.userQRCodeId)
                return null;
            return yield prisma_1.prisma.userQRCode.findUnique({
                where: { id: parent.userQRCodeId },
            });
        }),
    },
};
const server = new server_1.ApolloServer({ typeDefs: schema_1.typeDefs, resolvers });
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield server.start();
        app.use("/graphql", (0, cors_1.default)(), express_1.default.json(), (0, express4_1.expressMiddleware)(server));
        app.use("/upload", fileRoutes);
        app.use("/upload", image_1.default);
        app.use("/precint", precint_1.default);
        app.use("/voters", voter_1.default);
        app.use("/purok", purok_1.default);
        app.use("/export", pdfFile_1.default);
        //test
        app.get("/test", (req, res) => {
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
        ioserver.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`Server running at http://localhost:${port}`);
        }));
    }
    catch (error) {
        console.error("Error:", error);
        yield prisma_1.prisma.$disconnect();
    }
});
main();
