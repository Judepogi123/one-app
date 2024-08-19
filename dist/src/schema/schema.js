"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `#graphql
 type AdminUser {
  uid: String!
  lastname: String!
  firstname: String!
  address: String!
  phoneNumber: String!
  email: String!
  password: String!
  surveys: [Survey!]!
  deviceLogs: [DeviceLogs!]!
}

type AuthUser {
  phoneNumber: String!
  lastname: String!
  firstname: String!
  accessToken: String!
  uid: String!
}

type Users {
  uid: String!
  firstname: String!
  lastname: String!
  email: String!
  password: String!
  surveyResponses: [SurveyResponse!]!
  deviceLogs: [DeviceLogs!]!
}
  type Voter {
    id: ID!
    tagID: String!
    lastname: String!
    firstname: String!
    barangay: Barangay!
    municipal: Municipal!
    precent: Precent!
    status: Int!
    ageRange: String!
    year: Int!
    level: Int!
    barangaysId: ID!
    municipalsId: Int!
    precentsId: ID!
    calcAge: Int!
    birthYear: String!
    batchYearId: Int!
    saveStatus: String!
    mobileNumber: String!
    houseHold: HouseHold!
    houseHoldId: String!
    newBatchDraft: NewBatchDraft!
    newBatchDraftId: String!
    purok: Purok!
    purokId: String!
    votersCount: Int!
    pwd: String!
    oor: String!
    inc: String!
    illi: String!
    inPurok: Boolean!
  }

  type Municipal {
    id: Int!
    name: String!
    barangays: [Barangay!]!
    voters: [Voter!]!
    precents: [Precent!]!
    newBatchDrafts: [NewBatchDraft!]!
    puroks: [Purok!]!
    houseHolds: [HouseHold!]!
    barangaysCount: Int!
  }

  type Barangay {
    id: ID!
    name: String!
    municipal: Municipal!
    municipalId: Int!
    voters: [Voter!]!
    precents: [Precent!]!
    newBatchDrafts: [NewBatchDraft!]!
    puroks: [Purok!]!
    houseHolds: [HouseHold!]!
    barangayVotersCount: Int!
    purokCount: Int!
  }

  type Precent {
    id: ID!
    barangay: Barangay!
    barangayId: ID!
    municipal: Municipal!
    municipalsId: Int!
    voters: [Voter!]!
    purok: Purok!
    purokId: Int!
  }

  type BatchYear {
    id: Int!
    year: Int!
    voters: [Voter!]!
  }

  type NewBatchDraft {
    id: ID!
    title: String!
    municipal: Municipal
    municipalId: Int
    barangay: Barangay!
    barangayId: ID!
    timestamp: String!
    voters: [Voter!]!
  }

  type HouseHold {
    id: ID!
    houseHoldNumber: String!
    barangay: Barangay!
    barangayId: ID!
    municipal: Municipal!
    municipalsId: Int!
    voters: [Voter!]!
    purok: Purok!
    purokId: Int!
  }

  type Purok {
    id: String!
    purokNumber: String!
    barangay: Barangay!
    barangaysId: ID!
    municipal: Municipal!
    municipalsId: Int!
    houseHolds: [HouseHold!]!
    voters: [Voter!]!
    precents: [Precent!]!
    purokDraftedVotersCount: Int!
    draftID: String!
  }

  type Query {
    users: [Users!]!
    user(uid: ID!): Users
    voters: [Voter!]!
    voter(id: ID!): Voter
    searchDraftVoter(query: SearchDraftQueryInput!): [Voter]!
    votersCount: Int!
    municipals: [Municipal!]!
    municipal(id: Int!): Municipal
    municipalVoterList(id: Int!): [Voter!]!
    barangays: [Barangay!]!
    barangay(id: ID!): Barangay
    barangayList(municipalId: Int!): [Barangay!]
    precents: [Precent!]!
    precent(id: ID!): Precent
    puroks(barangay: NewPurokInput): [Purok]!
    batchYears: [BatchYear!]!
    batchYear(id: Int!): BatchYear
    newBatchDrafts: [NewBatchDraft!]!
    barangayNewVotersDraft(barangay: NewBatchDraftInput!): [NewBatchDraft]!
    barangaysCount: Int!
    barangayVotersCount: Int!
    purokCount: Int!
    purok(id: String!): Purok!
    barangayVotersList(barangayList: NewPurokInput!): [Voter]!
    draftedVoters(voter: DraftedVoters!): [Voter]!
    drafts: [NewBatchDraft!]!
    draft(id: String!): NewBatchDraft!
    survey(id: String!): Survey!
    surveyList: [Survey]!
    queries(id: String!): Queries!
    option(id: String!):Option!
  }

  type Mutation {
    createUser(user: NewUserInput): Users!
    newUser(user: NewUserInput): Users!
    createVoter(voter: NewVoterInput): Voter
    createMunicipal(municipal: NewMunicipalInput!): Municipal!
    createBarangay(barangay: NewBarangayInput!): Barangay!
    createPrecent(precint: NewPrecintInput!): Precent!
    createBatchYear(year: Int!): BatchYear!
    createNewBatchDraft(
      barangay: NewBatchDraftInput!
    ): NewBatchDraft!
    uploadExcelFile(file: Upload!): String
    removeDraft(id: String!): NewBatchDraft!
    changePurokName(purok: ChangePurokNameInput!): Purok!
    mergePurok(purok:MergePurokInput!): Purok!
    createSurvey(survey:NewSurveyInput!): Survey!
    createQuery(query: NewQueryInput!): Queries
    createOption(option: NewOptionInput!): Option!
    createMedia(medio: NewMediaInput!): MediaUrl!
    createOptionWithMedia(option: NewOptionInput!, media: NewMediaInput): Option!
    deleteQuery(id: String!): Queries!
    deleteOption(id: String!): Option!
    deleteOptionMedia(option: OptionMedia!): MediaUrl!
    updateOptionImage(image: NewOptionImageInput!): MediaUrl!
    updateOption(option: UpdateOption!): Option!
    getSurvey(tagID: String!): Survey!
    goLiveSurvey(id: String!): Survey!
    signUp(user: SignUpInput!): AdminUser!
    adminLogin(user:AdminLoginInput!): AuthUser!
  }

  type Survey {
  id: ID!
  tagID: String!
  timestamp: String!
  type: String!
  queries: [Queries!]
  drafted: Boolean!
  status: String!
  admin: AdminUser!
  adminUserUid: String!
  deviceLogs: [DeviceLogs!]
}

type Queries {
  id: ID!
  queries: String!
  survey: Survey!
  surveyId: String!
  type: String!
  componentType: String!
  response: [Response!]!
  options: [Option!]
}

type Option {
  id: ID!
  title: String
  desc: String
  fileUrl: MediaUrl
  mediaUrlId: String
  queries: [Queries]!
  queryId: String!
  responses: [OptionResponse!]!
  order: Int!
}

type MediaUrl {
  id: ID!
  url: String!
  filename: String
  size: String!
  options: [Option!]!
}

type SurveyResponse {
  id: ID!
  timestamp: String!
  response: [Response!]!
  submittedBy: Users!
  municipalsId: Int!
  barangaysId: String!
}

type Response {
  id: ID!
  queries: Query!
  queryId: String!
  surveyResponseId: String!
  voter: Voter
  votersId: String
  barangaysId: String!
  municipalsI: String!
  options: [OptionResponse!]!
}

type OptionResponse {
  id: ID!
  option: Option!
  optionId: String!
  response: Response!
  responseId: String!
}

type DeviceLogs {
  id: ID!
  release: String!
  return: String!
  usersUid: String!
  condition: String!
  adminUserUid: String!
  survey: Survey!
  surveyId: String!
}

  input NewVoterInput {
    tagID: String!
    lastname: String!
    firstname: String!
    barangaysId: ID!
    municipalsId: Int!
    precentsId: ID!
    ageRange: String!
    batchYearId: Int!
    level: Int!
    status: Int!
    saveStatus: String!
    mobileNumber: String!
    houseHoldId: String!
    newBatchDraftId: String!
    purokId: Int!
  }

  input NewUserInput {
    firstname: String!
    lastname: String!
    password: String!
    status: String!
  }

  input NewMunicipalInput {
    id: Int!
    name: String!
  }

  input NewBarangayInput {
    name: String!
    municipalId: Int!
  }

  input NewPurokInput {
    municipalId: Int!
    barangayId: String!
  }

  input NewBatchDraftInput {
    municipalId: Int!
    barangayId: ID!
  }
  input NewPrecintInput {
    barangaysId: String!
    municipalsId: Int!
    id: ID!
    precintNumber: String!
  }

  input PurokInput{
    barangaysId: ID!
    municipalsId: Int!
    id: ID!
    purokNumber: String!
  }

  input DraftedVoters{
    municipalsId: Int!
    barangaysId: String!
    draftID: String!
  }

  input SearchDraftQueryInput {
    params: String!
    saveStatus: String!
    municipalsId: Int!
    barangaysId: String!
    draftID: String!
  }

  input ChangePurokNameInput{
    id: ID!
    value: String!
  }
  input MergePurokInput{
    id: [String!]!
    newName: String
  }

  input NewSurveyInput {
    type: String!
    adminUserUid: String!
  }

  input NewQueryInput {
    queries: String!
    surveyId: String!
     type: String!
  }

  input NewOptionInput {
    title: String!
    desc: String!
    queryId: String!
  }
  input NewMediaInput{
    filename: String!
    url: String!
    size: String!
  }
  input OptionMedia{
    id: String!
    optionID: String!
  }

  input NewOptionImageInput{
    id: String!
    url:String!
    filename: String!
    size: String!
  }

  input UpdateOption{
    id: String!
    title: String
    desc: String
  }

  input SignUpInput {
    phoneNumber: String!
    password: String
    lastname: String!
    firstname: String!
    address: String!
  }

  input AdminLoginInput {
    phoneNumber: String!
    password: String!
  }

  scalar Upload
`;
