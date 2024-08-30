export const typeDefs = `#graphql
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
  address: String!
  email: String!
  password: String!
  phoneNumber: String!
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
    population: Int!
    sampleRate: Int!
    sampleSize: Int!
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
    barangays: [Barangay]
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
    ageList: [AgeBracket]
    genderList: [Gender]
    getSurvey(tagID: String!): Survey!
    getRespondentResponse: [RespondentResponse!]!
    surveyResponseList: [SurveyResponse!]!
    allSurveyResponse(survey: AllSurveyResponseInput!): [SurveyResponse!]!
    surveyResponseInfo(id:String!): SurveyResponse!
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
    updateSampleSize(sample: UpdateSampleInput!): Barangay!
    getSurvey(tagID: String!): Survey!
    goLiveSurvey(id: String!): Survey!
    createAge(age: String!): AgeBracket!
    createGender(gender: String!): Gender!
    deleteAge(id: String!): AgeBracket!
    deleteGender(id: String!): Gender!
    updateAge(age: UpdateAge!): AgeBracket!
    updateGender(gender: UpdateGender!): Gender!
    surveyConclude(id: String): Survey!
    deleteSurvey(id: String!): Survey!
    submitResponse(surveyResponse: NewSurveyResponseInput!,respondentResponse:[NewRespondentResponseInput!]!, response:[NewResponseInput!]!): SurveyResponse!
    addSurveyResponse(surveyResponse: NewSurveyResponseInput!): RespondentResponse!
    createRespondentResponse(respondentResponse:NewRespondentResponseInput!): RespondentResponse!
    addResponse(response:NewResponseInput!): Response!
    signUp(user: SignUpInput!): AdminUser!
    adminLogin(user:AdminLoginInput!): AuthUser!
  }

  type AgeBracket{
    id: String!
    segment: String!
    order: Int!
  }

  type Gender{
    id: String!
    name: String!
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
  images: [MediaUrl!]!
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
  surveyId: String
  optionId: String
}

type SurveyResponse {
  id: ID!
  timestamp: String!
  municipal: Municipal!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
  survey: Survey!
  surveyId: String!
  users: Users
  usersUid: String
  respondentResponses: [RespondentResponse!]!
  responses: [Response!]!
}

type RespondentResponse {
  id: ID!
  age: AgeBracket!
  ageBracketId: String!
  gender: Gender!
  genderId: String!
  municipal: Municipal!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
  survey: Survey!
  surveyId: String!
  responses: [Response!]!
  surveyResponse: SurveyResponse!
  surveyResponseId: String!
}

type Response {
  id: ID!
  survey: Survey!
  queries: Queries!
  queryId: String!
  barangay: Barangay!
  barangaysId: String!
  municipal: Municipal!
  municipalsId: Int!
  option: Option!
  optionId: String!
  ageBracket: AgeBracket!
  ageBracketId: String!
  gender: Gender!
  genderId: String!
  surveyResponse: SurveyResponse!
  surveyResponseId: String!
  respondentResponse: RespondentResponse!
  respondentResponseId: String!
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
  
  input NewAdminInput{
    lastname: String!
    firstname: String!
    phoneNumber: String!
    password: String!
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
    adminUserUid: String!
  }

  input NewQueryInput {
    queries: String!
    surveyId: String!
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
    surveyId: String!
  }
  input OptionMedia{
    id: String!
    optionID: String!
  }

  input UpdateAge{
    id: String!
    value: String!
  }

  input UpdateGender{
    id: String!
    value: String!
  }

  input NewOptionImageInput{
    id: String!
    url:String!
    filename: String!
    size: String!
  }

  input NewSurveyResponseInput {
  id: ID!
  municipalsId: Int!
  barangaysId: String!
  surveyId: String!
}

input NewRespondentResponseInput {
  id: ID!
  municipalsId: Int!
  barangaysId: String!
  surveyId: String!
  genderId: String!
  ageBracketId: String!
  surveyResponseId: String!
}

input NewResponseInput {
  id: ID!
  municipalsId: Int!
  barangaysId: String!
  surveyId: String!
  genderId: String!
  ageBracketId: String!
  surveyResponseId: String!
  respondentResponseId: String!
  optionId: String!
  queryId: String!
}

  input UpdateOption{
    id: String!
    title: String
    desc: String
  }

  input UpdateSampleInput{
    id: String!
    sampleSize: Int!
    sampleRate: Int!
    population: Int!
  }

  input SignUpInput {
    phoneNumber: String!
    password: String
    lastname: String!
    firstname: String!
    address: String!
  }

  input AllSurveyResponseInput {
    municipalsId: Int!
    surveyId: String!
  }

  input AdminLoginInput {
    phoneNumber: String!
    password: String!
  }

  scalar Upload
`;
