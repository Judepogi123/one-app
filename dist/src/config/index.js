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
const client_1 = require("@prisma/client");
const schema_1 = require("../schema/schema");
const body_parser_1 = __importDefault(require("body-parser"));
//routes
const files_1 = __importDefault(require("../routes/files"));
const precint_1 = __importDefault(require("../routes/precint"));
const voter_1 = __importDefault(require("../routes/voter"));
const purok_1 = __importDefault(require("../routes/purok"));
const image_1 = __importDefault(require("../routes/image"));
//utils
const data_1 = require("../utils/data");
const graphql_1 = require("graphql");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const ioserver = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(ioserver, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
//
const fileRoutes = (0, files_1.default)(io);
app.use(express_1.default.json({ limit: "10mb" })); // Increase the limit to 10MB
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
const resolvers = {
    Query: {
        users: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.users.findMany();
        }),
        voters: () => __awaiter(void 0, void 0, void 0, function* () { return yield prisma.voters.findMany(); }),
        voter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) { return yield prisma.voters.findUnique({ where: { id } }); }),
        votersCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.voters.count();
        }),
        searchDraftVoter: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { query }) {
            return yield prisma.voters.findMany({
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
            return yield prisma.barangays.findUnique({ where: { id } });
        }),
        barangays: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.barangays.findMany();
        }),
        barangayList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId }) {
            return yield prisma.barangays.findMany({
                where: { municipalId: municipalId },
                orderBy: { name: "asc" },
            });
        }),
        municipals: () => __awaiter(void 0, void 0, void 0, function* () { return yield prisma.municipals.findMany(); }),
        municipal: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { zipCode }) {
            return yield prisma.municipals.findUnique({ where: { id: zipCode } });
        }),
        municipalVoterList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            const data = yield prisma.voters.findMany({
                where: { municipalsId: id },
                include: { barangay: true },
            });
            return data;
        }),
        barangaysCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.barangays.count();
        }),
        barangayVotersList: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId, barangayId }) {
            return yield prisma.voters.findMany({
                where: { municipalsId: municipalId, barangaysId: barangayId },
            });
        }),
        barangayNewVotersDraft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId, barangayId }) {
            return yield prisma.newBatchDraft.findMany({
                where: { municipalId, barangayId },
            });
        }),
        puroks: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipalId, barangayId }) {
            return yield prisma.purok.findMany({
                where: { municipalsId: municipalId, barangaysId: barangayId },
            });
        }),
        purok: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.purok.findFirst({
                where: {
                    id,
                },
            });
        }),
        draftedVoters: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { voter }) {
            return yield prisma.voters.findMany({
                where: {
                    municipalsId: voter.municipalId,
                    barangaysId: voter.barangayId,
                    newBatchDraftId: voter.draftID,
                    saveStatus: "drafted",
                },
            });
        }),
        drafts: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.newBatchDraft.findMany();
        }),
        draft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.newBatchDraft.findUnique({ where: { id } });
        }),
        survey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.survey.findUnique({ where: { id } });
        }),
        getSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { tagID }) {
            const target = yield prisma.survey.findFirst({
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
            return yield prisma.survey.findMany({ orderBy: { timestamp: "asc" } });
        }),
        queries: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.queries.findUnique({ where: { id } });
        }),
        ageList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.ageBracket.findMany({ orderBy: { order: "asc" } });
        }),
        genderList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.gender.findMany();
        }),
        option: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.option.findUnique({ where: { id } });
        }),
        getRespondentResponse: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.respondentResponse.findMany();
        }),
        surveyResponseList: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.surveyResponse.findMany();
        }),
        allSurveyResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { survey }) {
            return yield prisma.surveyResponse.findMany({
                where: { municipalsId: survey.municipalsId, surveyId: survey.surveyId },
                orderBy: { timestamp: "asc" }
            });
        }),
        surveyResponseInfo: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.surveyResponse.findUnique({ where: { id } });
        }),
    },
    Mutation: {
        signUp: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { user }) {
            const hash = yield argon2_1.default.hash(user.password);
            const check = yield prisma.adminUser.findFirst({
                where: { phoneNumber: user.phoneNumber },
            });
            if (check) {
                throw new Error("Phone number already exit.");
            }
            return yield prisma.adminUser.create({
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
            return yield prisma.voters.create({ data: voter });
        }),
        newUser: (_, user) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.users.create({ data: Object.assign({}, user) });
        }),
        createMunicipal: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { municipal }) {
            return yield prisma.municipals.create({
                data: {
                    id: municipal.id,
                    name: municipal.name,
                },
            });
        }),
        createBarangay: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { barangay }) {
            const existed = yield prisma.barangays.findFirst({
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
            return yield prisma.barangays.create({
                data: {
                    municipalId: barangay.municipalId,
                    name: barangay.name,
                },
            });
        }),
        createNewBatchDraft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { barangay }) {
            return yield prisma.newBatchDraft.create({
                data: {
                    municipalId: barangay.municipalId,
                    barangayId: barangay.barangayId,
                },
            });
        }),
        removeDraft: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma.voters.deleteMany({
                where: { newBatchDraftId: id, saveStatus: "drafted" },
            });
            return yield prisma.newBatchDraft.delete({ where: { id } });
        }),
        createPrecent: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { precint }) {
            return yield prisma.precents.create({
                data: {
                    precintNumber: precint.precintNumber,
                    id: precint.id,
                    municipalsId: precint.municipalsId,
                    barangayId: precint.barangaysId,
                },
            });
        }),
        changePurokName: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { purok }) {
            return yield prisma.purok.update({
                where: { id: purok.id },
                data: { purokNumber: purok.value },
            });
        }),
        mergePurok: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { purok }) {
            const newID = purok.id[0];
            const data = yield prisma.purok.update({
                where: { id: newID },
                data: { purokNumber: purok.newName },
            });
            yield prisma.voters.updateMany({
                where: { purokId: newID },
                data: { purokId: newID },
            });
            for (let item of purok.id.slice(1)) {
                yield prisma.voters.updateMany({
                    where: { purokId: item },
                    data: { purokId: newID },
                });
                yield prisma.purok.delete({ where: { id: item } });
            }
            return data;
        }),
        goLiveSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.survey.update({
                where: { id },
                data: { drafted: false },
            });
        }),
        getSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { tagID }) {
            return prisma.survey.findFirst({ where: { tagID, drafted: false } });
        }),
        createSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { survey }) {
            const checkTagID = () => __awaiter(void 0, void 0, void 0, function* () {
                let genID = (0, data_1.handleGenTagID)();
                const tagID = yield prisma.survey.findFirst({
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
            const data = yield prisma.survey.create({
                data: {
                    type: "random",
                    adminUserUid: survey.adminUserUid,
                    tagID: tagID,
                },
            });
            return data;
        }),
        createQuery: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { query }) {
            return yield prisma.queries.create({
                data: {
                    queries: query.queries,
                    surveyId: query.surveyId,
                },
            });
        }),
        createOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { option }) {
            return yield prisma.option.create({
                data: {
                    title: option.title,
                    desc: option.desc,
                    queryId: option.queryId,
                    mediaUrlId: option.mediaUrlId,
                },
            });
        }),
        createAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { age }) {
            return yield prisma.ageBracket.create({ data: { segment: age } });
        }),
        deleteAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.ageBracket.delete({ where: { id } });
        }),
        updateAge: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { age }) {
            return yield prisma.ageBracket.update({
                where: { id: age.id },
                data: { segment: age.value },
            });
        }),
        createGender: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { gender }) {
            return yield prisma.gender.create({ data: { name: gender } });
        }),
        deleteGender: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.gender.delete({ where: { id } });
        }),
        updateGender: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { gender }) {
            return yield prisma.gender.update({
                where: { id: gender.id },
                data: { name: gender.value },
            });
        }),
        deleteOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.option.delete({ where: { id } });
        }),
        deleteOptionMedia: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { option }) {
            yield prisma.option.update({
                where: { id: option.optionID },
                data: { mediaUrlId: null },
            });
            return yield prisma.mediaUrl.delete({ where: { id: option.id } });
        }),
        deleteQuery: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            yield prisma.option.deleteMany({ where: { queryId: id } });
            const query = yield prisma.queries.delete({ where: { id } });
            return query;
        }),
        updateOptionImage: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { image }) {
            return yield prisma.mediaUrl.update({
                where: { id: image.id },
                data: { url: image.url, filename: image.filename, size: image.size },
            });
        }),
        updateOption: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { option }) {
            return yield prisma.option.update({
                where: { id: option.id },
                data: { title: option.title, desc: option.desc },
            });
        }),
        updateSampleSize: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { sample }) {
            return yield prisma.barangays.update({
                where: { id: sample.id },
                data: {
                    sampleRate: sample.sampleRate,
                    sampleSize: sample.sampleSize,
                    population: sample.population,
                },
            });
        }),
        createMedia: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { media }) {
            return prisma.mediaUrl.create({
                data: { filename: media.filename, size: media.size, url: media.url },
            });
        }),
        createOptionWithMedia: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { media, option }) {
            let mediaUrlId = null;
            const createdOption = yield prisma.option.create({
                data: {
                    title: option.title,
                    desc: option.desc,
                    queryId: option.queryId,
                },
            });
            if (media) {
                const createdMedia = yield prisma.mediaUrl.create({
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
            return yield prisma.survey.update({
                where: { id: id },
                data: { status: "Concluded" },
            });
        }),
        deleteSurvey: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield prisma.survey.delete({ where: { id } });
        }),
        createRespondentResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { respondentResponse }) {
            return yield prisma.respondentResponse.create({
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
            return yield prisma.surveyResponse.create({
                data: {
                    id: surveyResponse.id,
                    municipalsId: surveyResponse.municipalsId,
                    barangaysId: surveyResponse.barangaysId,
                    surveyId: surveyResponse.surveyId,
                },
            });
        }),
        addResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { response }) {
            return yield prisma.response.create({
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
        submitResponse: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { respondentResponse, response, surveyResponse }) {
            return yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
                const surveyResponsed = yield prisma.surveyResponse.create({
                    data: {
                        id: surveyResponse.id,
                        municipalsId: surveyResponse.municipalsId,
                        barangaysId: surveyResponse.barangaysId,
                        surveyId: surveyResponse.surveyId,
                    },
                });
                for (const res of respondentResponse) {
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
                // Create Response entries
                for (const res of response) {
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
                return surveyResponsed;
            }));
        }),
        adminLogin: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { user }) {
            const secretToken = process.env.JWT_SECRECT_TOKEN;
            if (!secretToken) {
                throw new Error("JWT secret token is not defined");
            }
            const adminUser = yield prisma.adminUser.findFirst({
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
            return { phoneNumber, lastname, firstname, uid, accessToken };
        }),
    },
    Voter: {
        votersCount: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.voters.count();
        }),
        purok: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return prisma.purok.findUnique({
                where: {
                    id: parent.purokId,
                },
            });
        }),
    },
    Municipal: {
        barangays: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.barangays.findMany({
                where: { municipalId: parent.id },
            });
        }),
        voters: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.voters.findMany({
                where: { municipalsId: parent.id },
            });
        }),
        barangaysCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.barangays.count({
                where: { municipalId: parent.id },
            });
        }),
    },
    Barangay: {
        barangayVotersCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.voters.count({
                where: { municipalsId: parent.municipalId },
            });
        }),
        purokCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.purok.count({ where: { barangaysId: parent.id } });
        }),
        puroks: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.purok.findMany({ where: { barangaysId: parent.id } });
        }),
    },
    Purok: {
        purokDraftedVotersCount: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.voters.count({
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
            return yield prisma.barangays.findUnique({
                where: { id: parent.barangayId },
            });
        }),
        municipal: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (parent.municipalId === null) {
                throw new Error("Municipal ID cannot be null");
            }
            return yield prisma.municipals.findUnique({
                where: { id: parent.municipalId },
            });
        }),
    },
    Survey: {
        admin: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.adminUser.findUnique({
                where: { uid: parent.adminUserUid },
            });
        }),
        queries: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.queries.findMany({ where: { surveyId: parent.id } });
        }),
        images: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.mediaUrl.findMany({ where: { surveyId: parent.id } });
        }),
    },
    Queries: {
        options: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.option.findMany({
                where: { queryId: parent.id },
                orderBy: { order: "asc" },
            });
        }),
    },
    Option: {
        fileUrl: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            if (!parent.id) {
                return null;
            }
            return yield prisma.mediaUrl.findFirst({
                where: { optionId: parent.id },
            });
        }),
    },
    RespondentResponse: {
        age: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.ageBracket.findUnique({
                where: { id: parent.ageBracketId },
            });
        }),
        gender: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.gender.findUnique({ where: { id: parent.genderId } });
        }),
        responses: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.response.findMany({
                where: { respondentResponseId: parent.id },
            });
        }),
    },
    SurveyResponse: {
        barangay: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prisma.barangays.findUnique({
                where: { id: parent.barangaysId },
            });
        }),
        respondentResponses: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return prisma.respondentResponse.findMany({
                where: { surveyResponseId: parent.id },
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
        app.use("/precint", precint_1.default);
        app.use("/voters", voter_1.default);
        app.use("/purok", purok_1.default);
        app.use("/upload", image_1.default);
        //test
        app.get("/test", (req, res) => {
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
        ioserver.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`Server running at http://localhost:${port}`);
        }));
    }
    catch (error) {
        console.error("Error:", error);
    }
});
main();
