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
  username: String!
  password: String!
  purpose: Int!
  privilege: [Int!]
  status: Int!
  role: Int!
  timstamp: String!
  surveyResponses: [SurveyResponse!]!
  deviceLogs: [DeviceLogs!]!
  userQRCodeId: String
  qrCode: UserQRCode
}

  type UserQRCode {
    id: ID!
    qrCode: String
    Users: Users
  }
  type Voter {
    id: ID!
    tagID: String!
    idNumber: String!
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
    precentsId: ID
    calcAge: Int!
    birthYear: String
    batchYearId: Int!
    saveStatus: String!
    mobileNumber: String!
    houseHold: HouseHold!
    houseHoldId: String
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
    senior: Boolean
    gender: String!
    youth: Boolean
    hubId: String
    hub: Hub
    teamLeaderId: String
    qrCode: String
    qrCodes: [QRcode!]
    qrCodeNumber: Int
    candidatesId: String
    teamId: String
    leader: TeamLeader
    validated: ValidatedTeamMembers
    record: [VoterRecord!]
  }

  type VoterRecord {
  id: ID
  desc: String
  questionable: Boolean
  timestamp: String
  voter: Voter
  votersId: String
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
    number: Int
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
    femaleSize: Int
      maleSize:Int
      surveyor:Int
      activeSurveyor:Int
    surveyResponse(survey: AllSurveyResponseInput!):[SurveyResponse!]!
    surveyRespondentResponse(survey: AllSurveyResponseInput!): [RespondentResponse!]!
    RespondentResponse(id: String!,zipCode: Int!): Int
    quota: [Quota!]
    quotas(id: ID!): [Quota!]
    optionResponse(id: String!,surveyId: String!): Int!
    selectedQuery(id: String!): [Option!]
    options(queryId: String!): [Option!]
    validationList:[Validation!]
    supporters(id: String): AllSupporters!
    teamStat: AllTeamStatus!
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
    drafted: Boolean
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

type Hub {
  id: ID!
  info: String!
  barangay: Barangay!
  barangaysId: String!
  municipal: Municipal! 
  municipalsId: Int!
  teamLeader: TeamLeader!
  teamLeaderId: String!
  voters: [Voter!]!
}

type TeamLeader {
  id: ID!
  voter: Voter
  votersId: String
  hubId: String!
  hub: [Hub!]!
  municipal: Municipal!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
  purokCoor: PurokCoor
  purokCoorId: String
  purok: Purok!
  purokId: String!
  team: [Team!]!
  teamId: String
  handle: Int
  level: Int!
  candidate: Candidates
  candidatesId: String
  validatedTeams: [ValidatedTeams!]!
  validatedTeamMembers: [ValidatedTeamMembers!]!
  barangayCoorId: String
  barangayCoor: TeamLeader
  barangayCoorFor: [TeamLeader!]!
  purokCoorsId: String
  purokCoors: TeamLeader
  purokCoorFor: [TeamLeader!]!
  teamLeaderId: String
  teamLeader: TeamLeader
  teamLeaderFor: [TeamLeader!]!
}


type Team {
  id: ID!
  teamLeader: TeamLeader
  teamLeaderId: String
  voters: [Voter!]
  votersId: String 
  purok: Purok
  purokId: String
  barangay: Barangay
  barangaysId: String!
  municipal: Municipal!
  municipalsId: Int!
  votersCount: Int
  candidate: Candidates
  candidatesId: String
  level: Int!
  _count: VoterRecordsCount
}

type VoterRecordsCount {
  voters: Int
}

type ValdiatedTeams {
  id: String!
  teamLeaderId: String!

}

  type Query {
    users: [Users!]!
    user(uid: ID!): Users
    voters(skip: Int): [Voter!]!
    voter(id: String!): Voter
    searchDraftVoter(query: SearchDraftQueryInput!): [Voter]!
    searchVoter(query: String!,skip: Int!,take: Int): [Voter!]
    votersCount: Int!
    municipals: [Municipal!]!
    municipal(id: Int!): Municipal
    municipalVoterList(id: Int!): [Voter!]!
    barangays: [Barangay]
    barangay(id: ID!): Barangay
    barangayList(zipCode: Int!, candidateId: String): [Barangay!]
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
    purokList: [Purok!]
    voterRecords(skip: Int): [VoterRecords!]
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
    respondentResponse(id: String!):[RespondentResponse!]!
    surveyResponseList: [SurveyResponse!]!
    allSurveyResponse(survey: AllSurveyResponseInput!): [SurveyResponse!]!
    surveyResponseInfo(id:String!): SurveyResponse!
    surveyResult(survey: AllSurveyResponseInput!): [SurveyResponse]!
    gendersSize: [GenderSize!]
    quotas: [Quota!]!
    barangayQuota(id: String!):[Quota!]
    queries(id: String!): Queries!
    surveyQueriesList(id: String):[Queries!]
    responseRespondent(id: String!): [ResponseRespondent!]
    getSurveyAgeResult(survey: AllSurveyResult): Survey!
    getRespondentResponseById(id: String!): RespondentResponse
    optionCountAge(optionId: String!, ageBracketId: String!): Int
    optionRank(surveyId: String!,zipCode: Int!, barangayId: String!,genderId: String!, optionId: String!, queryId: String!,ageBracketId: String!): Int
    optionGenderRank(surveyId: String!,zipCode: Int!, barangayId: String!,genderId: String!, optionId: String!, queryId: String!,ageBracketId: String!): Int
    barangayOptionResponse(zipCode: Int!, queryId: String!, surveyId: String!):[Barangay!]
    printOptionResponse(zipCode: Int!, queryId: String!, surveyId: String): Queries!
    getAllVoters(offset: Int!, limit: Int!, barangayId: String!, zipCode: String!): [Voter!]
    getSelectedVoters(list: [String!]): [Voter!]
    getRankOption(optionId: String!): String!
    getAllPurokCoor: [PurokCoor!]
    getAllTeamLeader(skip: Int): [TeamLeader!]
    getVotersList(level: String!, take: Int, skip: Int, zipCode: String, barangayId: String,purokId: String, query: String, pwd: String, illi: String,inc: String,oor: String,dead: String,youth: String,senior: String,gender: String): VotersList
    getPurokList(id: String!): [Purok!]
    teamList(zipCode: String!, barangayId: String!, purokId: String!, level: String!,query: String!, skip: Int!, candidate: String, withIssues: Boolean): [Team!]
    candidates: [Candidates!]
    candidate(id: String!):Candidates
    team(id: String!): Team
    getAllTL: [TeamLeader!]
    teams(skip: Int):[Team!]
    validationList(id: ID!):[Validation!]
    option(id: String!):Option!
    teamRecord(query: String!, barangay: String!, municipal: String!, skip: Int!): [ValidatedTeams!]
    getTeamRecord(id: String!): ValidatedTeams
    userList: [Users!]
    userQRCodeList: [UserQRCode!]
    duplicateteamMembers(skip: Int): [DuplicateteamMembers!]
    delistedVotes(skip: Int): [DelistedVoter!]
  }

  type Validation {
  id: ID!
  timestamp: String!
  municipal: Municipal!
  percent: Float!
  totalVoters: Int!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
}

type ValidatedTeams {
  id: ID!
  teamLeader: TeamLeader
  teamLeaderId: String
  barangay: Barangay
  barangaysId: String!
  municipal: Municipal
  municipalsId: Int!
  purokId: String!
  purok: Purok
  validatedTeamMembers: [ValidatedTeamMembers!]
  timestamp: String!
  issues: Int
}

type ValidatedTeamMembers {
  id: ID!
  idNumber: String!
  voter: Voter
  votersId: String
  barangay: Barangay
  barangayId: String!
  municipal: Municipal
  municipalsId: Int
  purok: Purok
  purokId: String!
  teamLeader: TeamLeader
  teamLeaderId: String
  validatedTeams: ValidatedTeams
  validatedTeamsId: String
  remark: String
}

  type VotersList {
    voters: [Voter!]
    results: Int!
  }

  type PurokCoor {
  id: ID!
  voter: Voter!
  votersId: String!
  municipal: Municipal!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
  teamLeaders: [TeamLeader!]!
  barangayCoor: BarangayCoor!
  barangayCoorId: String!
}

type BarangayCoor {
  id: ID!
  voter: Voter!
  votersId: String!
  purokCoors: [PurokCoor!]!
  municipal: Municipal!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
}


  type Mutation {
    createUser(user: NewUserInput): Users!
    newUser(user: NewUserInput!): String!
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
    updateQuota(quota: QuotaUpdate!): Quota!
    createQuota(quota: NewQuotaInput!, gender: NewGenderInput!): Quota
    createGenderQuota(quota: GenderQuotaInput): GenderSize
    removeGenderQuota(id: String!): GenderSize
    updateSurveyor(id: String!): Barangay
    updateGenderQuota(gender: NewGenderInput!): Quota
    resetBarangayQuota(id: String!): [Quota!]
    resetSurveyor(id: Int!): [Barangay!]
    resetActiveSurvey(id: String!): Barangay!
    removeQuota(id: String!): Quota!
    removeQuery(id: String!): Queries!
    removeBarangay(id: String!): Barangay!
    updateQuery(id: String!, value: String!): Queries!
    updateQueryType(id: String!,type: String!): Queries!
    resetSurveyResponse(id: String!, zipCode: Int!): BatchPayload
    updateOptionTop(id: String!,value: Boolean!):Option
    removeResponse(id: String!): RespondentResponse!
    changeQueryOnTop(id: String!,value: Boolean!): Queries!
    updateQueryAccess(id: String!): Queries!
    optionForAll(id: String!,value: Boolean!): Option!
    signUp(user: SignUpInput!): AdminUser!
    discardDraftedVoter(id: String): String!
    saveDraftedVoter(batchId: String!): NewBatchDraft!
    removeVoter(id: String!): String!
    adminLogin(user:AdminLoginInput!): AuthUser!
    removeMultiVoter(list: [String!]): String!
    addTeam(headId: String!,teamIdList: [VoterInput!], level: Int!): String!
    addMember(headId: String!,teamIdList: [VoterInput!], level: Int!, teamId: String!): String!
    removeVotersArea(zipCode: String!, barangayId: String!, purokId: String!): String!
    deleteTeams: String
    genderBundleQrCode(idList: [String!]): String!
    generatedTeamQRCode(teamId: String!): String!
    removeQRcode(id: [String!]):String!
    createPostion(title: String!): String!
    addNewCandidate(firstname: String!, lastname: String!, code: String!,colorCode: String): String!
    updateLeader(id: String!, level: Int!, teamId: String!, method: Int!): String!
    setVoterLevel(level: Int!, id: String!,code: String!): String!
    changeLeader(id: String!, teamId: String!, level: Int!): String!
    assignBarangayIDnumber(zipCode: Int!): String!
    assignTeam(team: NewTeamInput!): String!
    composeTeam(team: NewTeamInput!): String!
    clearTeamRecords: String!
    removeValidateTeamleader: String!
    multiSelectVoter(teamId: String!, members: [String!],method: Int!):String!
    removeTeam(id: String!):String!
    removeAllTeams: String!
    createAccount(account: NewAccountInput!): String!
    createCustomOption(id: String!): String!
    resetTeamList(zipCode: String!, barangayId: String!): String!
    harvestResponse(surveyResponse: [NewSurveyResponseInput!]!,respondentResponse:[NewRespondentResponseInput!]!, response:[NewResponseInput!]!, customOptions: [NewCustomOptionsInput!]): String!
  }

  type VoterRecords {
  id: ID!
  desc: String!
  questionable: Boolean!
  timestamp: String! 
  voter: Voter     
  votersId: String      
  user: Users       
  usersUid: String    
}

  type Candidates {
  id: ID!
  lastname: String!
  firstname: String!
  code: String
  desc: String
  image: MediaUrl
  colorCode: String
  supporters: Int!
  candidateBatchId: String!
  BarangayCoor: [BarangayCoor!]!
  PurokCoor: [PurokCoor!]
  TeamLeader: [TeamLeader!]
  Team: [Team!],
  inTeam: AllSupporters
}

type AllSupporters {
  figureHeads: Int
  bc: Int
  pc: Int
  tl: Int
  withTeams: Int
  voterWithoutTeam: Int
}

type AllTeamStatus {
  aboveMax: Int
  belowMax: Int
  equalToMax: Int
  aboveMin: Int
  equalToMin: Int
  belowMin: Int
  threeAndBelow: Int
}

  type QRcode {
  id: ID!
  number: Int!
  qrCode: String!
  timestamp: String!
  voter: Voter!
  votersId: String!
  stamp: Int!
  scannedDateTime: String
}

  type AgeBracket{
    id: String!
    segment: String!
    order: Int!
    quota(id: ID!): [Quota!]
    surveyAgeCount(id: String!,zipCode: Int!, barangayId: String!,genderId: String!): Int!
    optionAgeCount(surveyId: String!):[Queries!]
    overAllAgeRanking(id: String!): [Queries!]
    optionRank(surveyId: String!,zipCode: Int!, barangayId: String!,genderId: String!, optionId: String!): Int
  }

  type Gender{
    id: String!
    name: String!
  }

  type GenderSize {
  id: ID!
  gender: Gender!
  genderId: String!
  size: Int!
  quotaId: String
}

  type Quota {
  id: ID!
  survey: Survey!
  surveyId: ID!
  barangay: Barangay!
  barangaysId: ID!
  sampleSize: Int!
  population: Int!
  gender: Gender

  gendersSize: [GenderSize!]
  size: Int!
  age: AgeBracket!
  ageBracketId: String!
}

  type Survey {
  id: ID!
  tagID: String!
  name: String
  timestamp: String!
  type: String!
  queries: [Queries!]
  drafted: Boolean!
  status: String!
  admin: AdminUser!
  adminUserUid: String!
  deviceLogs: [DeviceLogs!]
  images: [MediaUrl!]!
  responseCount( zipCode: Int!): Int
  ageCount: [AgeBracket!]
  result: String
}

type Queries {
  id: ID!
  order: Int
  queries: String!
  survey: Survey!
  surveyId: String!
  type: String!
  style: Int!
  access: String
  componentType: String!
  response: [Response!]!
  options: [Option!]
  respondentOption(id: String!): [Response!]
  onTop: Boolean!
  barangayList(zipCode: Int!): [Barangay!]
  customOption(zipCode: Int!, surveyId: String!, barangayId: String!): [CustomOption]
  withCustomOption: Boolean
}

type CustomOption {
  id: String!
  value: String!
  queriesId: String!
  queryResponse_id: String!
  survey_id: String!
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
  onExit: Boolean
  onTop: Boolean!
  order: Int!
  forAll: Boolean!
  inlcuded: Boolean!
  overAllResponse(id: String,zipCode: Int!, barangayId: String!,genderId: String!): Int!
  overAllCount: Int
  ageCountRank(id: String,ageBracketId: String,barangayId: String!,genderId: String!): Int!
  optionRank(surveyId: String!,zipCode: Int!, barangayId: String!,genderId: String!, optionId: String!): Int
  barangays:[Barangay!]
  customizable: Boolean
  results: Int
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
  surveyResponse: [SurveyResponse!]!
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
  optionResponse(optionId: String!): Int!
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
  option: [Option!]
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

type RespondentOption {
  id: ID!
  queryId: ID!
  title: String!
  desc: String!
}

type ResponseRespondent {
  id: ID!
  order: Int!
  queries: String!
  surveyId: ID!
  queryId: ID!
  ageBracket: AgeBracket!
  ageBracketId: String!
  gender: Gender!
  genderId: String!
  barangaysId: String!
  barangay: Barangay!
  respondentResponseId: ID!
  option: [RespondentOption!]!
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

type BarangayOptionResponse {
  id: String!
  name: String!
  options: [Option!]!
}

type BatchPayload {
  count: Int!
}

input NewAccountInput {
  role: String!
  username: String!
  password: String!
  purpose: String!
  adminPassword: String
}

input NewTeamInput{
  zipCode:Int!
  barangayCoorId: String!
  purokCoorId: String!
  barangayId:String!
  teamLeaderId: String!
  members: [String!]
}

input VoterInput {
    id: ID!
    lastname: String!
    firstname: String!
    status: Int!
    level: Int!
    barangaysId: String!
    municipalsId: Int!
    purokId: String!
  }

input BarangayInput {
  id: ID!
  name: String
  zipCode: Int
  # Add other fields you need for output
}

input QuotaUpdate {
  value: Int!
  id: String!
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
    password: String!
    username: String!
    purpose: Int!
    role: Int!
    status: Int!
    privilege: [Int!]
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
    type: String!
    onTop: Boolean!
    style: Int!
    withCustomOption: Boolean
  }

  input NewOptionInput {
    title: String!
    desc: String!
    queryId: String!
    onExit: Boolean!
    onTop: Boolean!
    customizable: Boolean
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
  accountID: String!
}

input NewRespondentResponseInput {
  id: ID!
  municipalsId: Int!
  barangaysId: String!
  surveyId: String!
  genderId: String!
  ageBracketId: String!
  surveyResponseId: String!
  accountID: String!
  valid: Boolean
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
  optionId: String
  queryId: String!
}


input NewCustomOptionsInput {
  id: ID!
  value: String!
  queriesId: String!
  respondentResponseId: String!
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
    femaleSize: Int!
    maleSize: Int!
    surveyor: Int
    activeSurveyor: Int
  }

  input SignUpInput {
    phoneNumber: String!
    password: String
    lastname: String!
    firstname: String!
    address: String!
  }

  input QuotaInput {
    id: String!
  }

  input NewQuotaInput {
    barangayId: String!
    ageBracketId: String!
  }

  input NewGenderInput {
    size: Int!
    genderId: String!
  }

  input GenderQuotaInput {
    quotaId: String!
    genderId: String!
    size: Int!
  }

  input AllSurveyResponseInput {
    municipalsId: Int!
    surveyId: String!
  }

  input AllSurveyResult {
    municipalsId: Int!
    surveyId: String!
    barangayId: String!
  }

  input AdminLoginInput {
    phoneNumber: String!
    password: String!
  }

  scalar Upload

  type DuplicateteamMembers {
  id: ID!
  voter: Voter
  votersId: String
  team: Team
  teamFounIn: Team
  timstamp: String
  teamId: String
  foundTeamId: String
  barangay: Barangay!
  barangaysId: String!
  municpal: Municipal!
  municipalsId: Int!
}

type DelistedVoter {
  id: ID!
  voter: Voter
  votersId: String
  timstamp: String
  municipal: Municipal!
  municipalsId: Int!
  barangay: Barangay!
  barangaysId: String!
  validated: DelistedVoterValidated
  delistedVoterValidatedId: String
}

type DelistedVoterValidated {
  id: ID!
  voter: Voter!
  votersId: String!
  timstamp: String
  validated: Boolean
  DelistedVoter: [DelistedVoter!]!
}

type UntrackedVoter {
  id: ID!
  note: String
  voter: Voter
  votersId: String
  team: Team
  timstamp: String
  teamId: String
  user: Users
  usersUid: String
  barangay: Barangay
  barangaysId: String
  municpal: Municipal
  municipalsId: Int
}

type Appointments {
  id: ID!
  appointment: String
  activity: Int
  timestamp: String
  voter: Voter
  team: Team
  teamId: String
  barangay: Barangay!
  barangaysId: String!
  municipal: Municipal!
  municipalsId: Int!
  purok: Purok
  user: Users
  usersUid: String
  purokId: String
  data: String
  votersId: String
}

type ValidationTimeInput {
  id: ID!
  minutes: Int
  name: String
  action: Int
  barangay: Barangay
  municipal: Municipal
  team: Team
  user: Users
  usersUid: String
  teamId: String
  barangaysId: String
  municipalsId: Int
}

type ValidationNotes {
  id: ID!
  action: String
  timestamp: String
  title: String
  desc: String
  contact: String
  user: Users
  usersUid: String
}

`;
