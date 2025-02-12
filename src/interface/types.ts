// types.ts
import { GraphQLResolveInfo } from "graphql";
import {
  Candidates,
  Voters,
  Users,
  Municipals,
  Barangays,
  Precents,
  Purok,
  NewBatchDraft,
  Survey,
  AdminUser,
  Queries,
  Option,
  MediaUrl,
  AgeBracket,
  Gender,
  SurveyResponse,
  RespondentResponse,
  DataResponse,
  Quota,
  GenderSize,
  PurokCoor,
  TeamLeader,
  QRcode,
  Team,
  Validation,
  ValidatedTeams,
  UserQRCode,
  CustomOption,
  VoterRecords,
  DelistedVoter,
  DuplicateteamMembers,
  AccountHandleTeam,
  AccountValidateTeam,
  ValdilatedMembers,
  UntrackedVoter
} from "../../prisma/prisma";
import {
  BarangayOptionResponse,
  RespondentResponseProps,
  TeamProps,
  TeamValidationStat,
  ValidatedTeamMembers
} from "./data";

export type ResolverFn<Parent, Args, Context, Result> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Result> | Result;

export type Resolvers = {
  Query: {
    users: ResolverFn<{}, {}, {}, Users[]>;
    voters: ResolverFn<{}, { skip: number; zipCode: number }, {}, Voters[]>;
    voter: ResolverFn<{}, { id: string }, {}, Voters | null>;
    searchDraftVoter: ResolverFn<
      {},
      {
        query: {
          params: string;
          saveStatus: string;
          municipalsId: number;
          barangaysId: string;
          draftID: string;
        };
      },
      {},
      Voters[]
    >;
    votersCount: ResolverFn<{}, {}, {}, number>;
    barangays: ResolverFn<{}, {}, {}, Barangays[]>;
    barangay: ResolverFn<{}, { id: string }, {}, Barangays | null>;
    municipal: ResolverFn<{}, { zipCode: number }, {}, Municipals | null>;
    municipals: ResolverFn<{}, {}, {}, Municipals[]>;
    municipalVoterList: ResolverFn<
      {},
      {
        id: number;
      },
      {},
      Voters[]
    >;
    barangaysCount: ResolverFn<{}, {}, {}, number>;
    barangayList: ResolverFn<{}, { zipCode: number }, {}, Barangays[] | []>;
    puroks: ResolverFn<
      {},
      { municipalId: number; barangayId: string },
      {},
      Purok[]
    >;
    purok: ResolverFn<{}, { id: string }, {}, Purok | null>;
    barangayVotersList: ResolverFn<
      {},
      { municipalId: number; barangayId: string },
      {},
      Voters[] | []
    >;
    barangayNewVotersDraft: ResolverFn<
      {},
      { municipalId: number; barangayId: string },
      {},
      NewBatchDraft[]
    >;
    draftedVoters: ResolverFn<
      {},
      { voter: { municipalId: number; barangayId: string; draftID: string } },
      {},
      Voters[]
    >;
    drafts: ResolverFn<{}, {}, {}, NewBatchDraft[]>;
    draft: ResolverFn<{}, { id: string }, {}, NewBatchDraft | null>;
    survey: ResolverFn<{}, { id: string }, {}, Survey | null>;
    surveyList: ResolverFn<{}, {}, {}, Survey[]>;
    getSurvey: ResolverFn<{}, { tagID: string }, {}, Survey>;
    ageList: ResolverFn<{}, {}, {}, AgeBracket[]>;
    genderList: ResolverFn<{}, {}, {}, Gender[]>;
    queries: ResolverFn<{}, { id: string }, {}, Queries | null>;
    option: ResolverFn<{}, { id: string }, {}, Option | null>;
    getRespondentResponse: ResolverFn<{}, {}, {}, RespondentResponse[]>;
    respondentResponse: ResolverFn<
      {},
      { id: string },
      {},
      RespondentResponse[]
    >;
    surveyResponseList: ResolverFn<{}, {}, {}, SurveyResponse[]>;
    allSurveyResponse: ResolverFn<
      {},
      { survey: { municipalsId: number; surveyId: string } },
      {},
      SurveyResponse[]
    >;
    surveyResponseInfo: ResolverFn<
      {},
      { id: string },
      {},
      SurveyResponse | null
    >;
    quotas: ResolverFn<{}, {}, {}, Quota[]>;
    barangayQuota: ResolverFn<{}, { id: string }, {}, Quota[]>;
    gendersSize: ResolverFn<{}, {}, {}, GenderSize[]>;
    responseRespondent: ResolverFn<
      {},
      { id: string },
      {},
      RespondentResponseProps[]
    >;
    getRespondentResponseById: ResolverFn<
      {},
      { id: string },
      {},
      RespondentResponse | null
    >;
    surveyQueriesList: ResolverFn<{}, { id: string }, {}, Queries[]>;
    optionCountAge: ResolverFn<
      {},
      { optionId: string; ageBracketId: string },
      {},
      number
    >;
    optionRank: ResolverFn<
      {},
      {
        surveyId: string;
        zipCode: number;
        barangayId: string;
        ageBracketId: string;
        genderId: string;
        optionId: string;
        queryId: string;
      },
      {},
      number
    >;
    optionGenderRank: ResolverFn<
      {},
      {
        surveyId: string;
        zipCode: number;
        barangayId: string;
        ageBracketId: string;
        genderId: string;
        optionId: string;
        queryId: string;
      },
      {},
      number
    >;
    barangayOptionResponse: ResolverFn<
      {},
      { zipCode: number; queryId: string; surveyId: string },
      {},
      BarangayOptionResponse[]
    >;
    getAllVoters: ResolverFn<
      {},
      { offset: number; limit: number; barangayId: string; zipCode: string },
      {},
      Voters[]
    >;
    searchVoter: ResolverFn<
      {},
      { query: string; skip: number; take: number, zipCode: number },
      {},
      Voters[]
    >;
    getSelectedVoters: ResolverFn<{}, { list: string[] }, {}, Voters[]>;
    getRankOption: ResolverFn<{}, { optionId: string }, {}, string>;
    getAllPurokCoor: ResolverFn<{}, {}, {}, PurokCoor[]>;
    getAllTeamLeader: ResolverFn<
      {},
      { skip: number; zipCode: number },
      {},
      TeamLeader[]
    >;
    getVotersList: ResolverFn<
      {},
      {
        level: string;
        take: number;
        skip: number;
        zipCode: string;
        barangayId: string;
        query: string;
        purokId: string;
        pwd: string;
        illi: string;
        inc: string;
        oor: string;
        dead: string;
        youth: string;
        senior: string;
        gender: string;
        withoutTeam: string, 
        mode: string
      },
      {},
      { voters: Voters[]; results: number }
    >;
    getPurokList: ResolverFn<{}, { id: string }, {}, Purok[]>;
    teamList: ResolverFn<
      {},
      {
        zipCode: string;
        barangayId: string;
        purokId: string;
        level: string;
        query: string;
        skip: number;
        candidate: string;
        withIssues: boolean;
      },
      {},
      Team[]
    >;
    candidates: ResolverFn<{}, {zipCode: string}, {}, Candidates[]>;
    team: ResolverFn<{}, { id: string }, {}, Team | null>;
    validationList: ResolverFn<{}, { id: string }, {}, Validation[]>;
    getAllTL: ResolverFn<{}, {}, {}, TeamLeader[]>;
    teams: ResolverFn<{}, { skip: number }, {}, Team[]>;
    teamRecord: ResolverFn<
      {},
      { query: string; barangay: string; municipal: string; skip: number },
      {},
      ValidatedTeams[]
    >;
    getTeamRecord: ResolverFn<{}, { id: string }, {}, ValidatedTeams | null>;
    userList: ResolverFn<{}, {zipCode: number}, {}, Users[]>;
    userQRCodeList: ResolverFn<{}, {}, {}, UserQRCode[]>;
    purokList: ResolverFn<{}, { zipCode: number }, {}, Purok[]>;
    voterRecords: ResolverFn<
      {},
      { skip: number; zipCode: number },
      {},
      VoterRecords[]
    >;
    printOptionResponse: ResolverFn<
      {},
      { zipCode: number; queryId: string; surveyId: string },
      {},
      Queries[]
    >;
    candidate: ResolverFn<{}, { id: string }, {}, Candidates | null>;
    duplicateteamMembers: ResolverFn<
      {},
      { skip: number; zipCode: number },
      {},
      DuplicateteamMembers[]
    >;
    delistedVotes: ResolverFn<
      {},
      { skip: number; zipCode: number },
      {},
      DelistedVoter[]
    >;
    accountTeamHandle: ResolverFn<
      {},
      { id: string; skip: number },
      {},
      AccountHandleTeam[]
    >;
    user: ResolverFn<{}, { id: string; skip: number }, {}, Users | null>;
    getAssignedTeams: ResolverFn<
      {},
      {
        userId: string;
        zipCode: number;
        barangaysId: number;
        from: number;
        take: number;
        min: number;
        max: number;
      },
      {},
      AccountHandleTeam[]
    >;
    teamLeaderTeamHandle:  ResolverFn<{},{level: number, zipCode: string, barangay: string, skip:number},{}, TeamLeader[]>
    accountHandleTeamList: ResolverFn<{},{},{}, AccountHandleTeam[]>
  };
  Mutation: {
    createVoter: ResolverFn<{}, Voters, {}, Voters>;
    newUser: ResolverFn<
      {},
      {
        user: {
          password: string;
          status: number;
          username: string;
          purpose: number;
          role: number;
          privilege: number[];
          encryptPassword: boolean
          forMunicipal: string
        };
      },
      {},
      string
    >;
    createMunicipal: ResolverFn<
      {},
      {
        municipal: { id: number; name: string };
      },
      {},
      Municipals
    >;
    createBarangay: ResolverFn<
      {},
      { barangay: { name: string; municipalId: number } },
      {},
      Barangays | null
    >;
    createNewBatchDraft: ResolverFn<
      {},
      { barangay: { municipalId: number; barangayId: string } },
      {},
      NewBatchDraft
    >;
    createPrecent: ResolverFn<
      {},
      {
        precint: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          precintNumber: string;
        };
      },
      {},
      Precents
    >;
    removeDraft: ResolverFn<{}, { id: string }, {}, NewBatchDraft>;
    changePurokName: ResolverFn<
      {},
      { purok: { id: string; value: string } },
      {},
      Purok
    >;
    mergePurok: ResolverFn<
      {},
      { purok: { id: string[]; newName: string | undefined } },
      {},
      Purok
    >;
    createSurvey: ResolverFn<
      {},
      { survey: { adminUserUid: string } },
      {},
      Survey
    >;
    createQuery: ResolverFn<
      {},
      {
        query: {
          queries: string;
          surveyId: string;
          type: string;
          onTop: boolean;
          style: number;
          withCustomOption: boolean;
        };
      },
      {},
      Queries
    >;
    createOption: ResolverFn<
      {},
      {
        option: {
          title: string;
          desc: string;
          queryId: string;
          mediaUrlId: string;
        };
      },
      {},
      Option
    >;
    createMedia: ResolverFn<
      {},
      { media: { filename: string; url: string; size: string } },
      {},
      MediaUrl
    >;
    createOptionWithMedia: ResolverFn<
      {},
      {
        media: {
          filename: string;
          url: string;
          size: string;
          surveyId: string;
          optionId: string;
        };
        option: {
          title: string;
          desc: string;
          queryId: string;
          onExit: boolean;
          onTop: boolean;
          customizable: boolean;
        };
      },
      {},
      Option
    >;
    createAge: ResolverFn<{}, { age: string }, {}, AgeBracket>;
    deleteAge: ResolverFn<{}, { id: string }, {}, AgeBracket>;
    updateAge: ResolverFn<
      {},
      { age: { id: string; value: string } },
      {},
      AgeBracket
    >;
    createGender: ResolverFn<{}, { gender: string }, {}, Gender>;
    deleteGender: ResolverFn<{}, { id: string }, {}, Gender>;
    updateGender: ResolverFn<
      {},
      { gender: { id: string; value: string } },
      {},
      Gender
    >;
    deleteOption: ResolverFn<{}, { id: string }, {}, Option>;
    deleteOptionMedia: ResolverFn<
      {},
      { option: { id: string; optionID: string } },
      {},
      MediaUrl
    >;
    getSurvey: ResolverFn<{}, { tagID: string }, {}, Survey | null>;
    deleteQuery: ResolverFn<{}, { id: string }, {}, Queries>;
    updateOptionImage: ResolverFn<
      {},
      { image: { id: string; url: string; filename: string; size: string } },
      {},
      MediaUrl
    >;
    updateOption: ResolverFn<
      {},
      { option: { id: string; title: string; desc: string } },
      {},
      Option
    >;
    updateSampleSize: ResolverFn<
      {},
      {
        sample: {
          id: string;
          sampleSize: number;
          sampleRate: number;
          population: number;
          femaleSize: number;
          maleSize: number;
          surveyor: number;
          activeSurveyor: number;
        };
      },
      {},
      Barangays
    >;
    goLiveSurvey: ResolverFn<{}, { id: string }, {}, Survey>;
    surveyConclude: ResolverFn<{}, { id: string }, {}, Survey>;
    deleteSurvey: ResolverFn<{}, { id: string }, {}, Survey>;
    signUp: ResolverFn<
      {},
      {
        user: {
          phoneNumber: string;
          password: string;
          lastname: string;
          firstname: string;
          address: string;
        };
      },
      {},
      AdminUser
    >;
    addSurveyResponse: ResolverFn<
      {},
      {
        surveyResponse: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
        };
      },
      {},
      SurveyResponse
    >;
    createRespondentResponse: ResolverFn<
      {},
      {
        respondentResponse: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          genderId: string;
          ageBracketId: string;
          surveyResponseId: string;
        };
      },
      {},
      RespondentResponse
    >;
    addResponse: ResolverFn<
      {},
      {
        response: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          genderId: string;
          ageBracketId: string;
          surveyResponseId: string;
          respondentResponseId: string;
          optionId: string;
          queryId: string;
        };
      },
      {},
      DataResponse
    >;
    harvestResponse: ResolverFn<
      {},
      {
        surveyResponse: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          accountID: string;
        }[];
        respondentResponse: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          genderId: string;
          ageBracketId: string;
          surveyResponseId: string;
          accountID: string;
          valid: boolean;
        }[];
        response: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          genderId: string;
          ageBracketId: string;
          surveyResponseId: string;
          optionId: string;
          queryId: string;
          respondentResponseId: string;
        }[];
        customOptions: {
          id: string;
          value: string;
          queriesId: string;
          respondentResponseId: string;
        }[];
      },
      {},
      string
    >;
    submitResponse: ResolverFn<
      {},
      {
        surveyResponse: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
        };
        respondentResponse: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          genderId: string;
          ageBracketId: string;
          surveyResponseId: string;
        }[];
        response: {
          id: string;
          municipalsId: number;
          barangaysId: string;
          surveyId: string;
          genderId: string;
          ageBracketId: string;
          surveyResponseId: string;
          optionId: string;
          queryId: string;
          respondentResponseId: string;
        }[];
      },
      {},
      SurveyResponse
    >;
    createQuota: ResolverFn<
      {},
      {
        quota: { barangayId: string; ageBracketId: string };
        gender: { size: number; genderId: string };
      },
      {},
      Quota
    >;
    createGenderQuota: ResolverFn<
      {},
      { quota: { quotaId: string; genderId: string; size: number } },
      {},
      GenderSize
    >;
    removeGenderQuota: ResolverFn<{}, { id: string }, {}, GenderSize>;
    updateSurveyor: ResolverFn<{}, { id: string }, {}, Barangays>;
    resetSurveyor: ResolverFn<{}, { id: number }, {}, Barangays[]>;
    resetBarangayQuota: ResolverFn<{}, { id: string }, {}, Quota[]>;
    resetActiveSurvey: ResolverFn<{}, { id: string }, {}, Barangays>;
    removeQuota: ResolverFn<{}, { id: string }, {}, Quota>;
    removeQuery: ResolverFn<{}, { id: string }, {}, Queries>;
    updateQuery: ResolverFn<{}, { id: string; value: string }, {}, Queries>;
    removeBarangay: ResolverFn<{}, { id: string }, {}, Barangays>;
    adminLogin: ResolverFn<
      {},
      { user: { phoneNumber: string; password: string } },
      {},
      {
        phoneNumber: string;
        uid: string;
        accessToken: string;
        lastname: string;
        firstname: string;
      }
    >;
    userLogin: ResolverFn<{},{user:{username: string, password: string}},{}, {
      username: string,
      role: number,
      uid: string;
      accessToken: string
    }>;
    updateQueryType: ResolverFn<{}, { id: string; type: string }, {}, Queries>;
    updateOptionTop: ResolverFn<{}, { id: string; value: boolean }, {}, Option>;
    resetSurveyResponse: ResolverFn<
      {},
      { id: string; zipCode: number },
      {},
      Promise<{ count: number }>
    >;
    removeResponse: ResolverFn<{}, { id: string }, {}, RespondentResponse>;
    updateQueryAccess: ResolverFn<{}, { id: string }, {}, Queries>;
    optionForAll: ResolverFn<{}, { id: string; value: boolean }, {}, Option>;
    changeQueryOnTop: ResolverFn<
      {},
      { id: string; value: boolean },
      {},
      Queries
    >;
    discardDraftedVoter: ResolverFn<{}, { id: string }, {}, string>;
    saveDraftedVoter: ResolverFn<{}, { batchId: string }, {}, NewBatchDraft>;
    removeVoter: ResolverFn<{}, { id: string }, {}, string>;
    removeMultiVoter: ResolverFn<{}, { list: string[] }, {}, string>;
    setVoterLevel: ResolverFn<
      {},
      { level: number; id: string; code: string },
      {},
      string
    >;
    addTeam: ResolverFn<
      {},
      { headId: string; teamIdList: Voters[]; level: number },
      {},
      string
    >;
    addMember: ResolverFn<
      {},
      { headId: string; teamIdList: Voters[]; level: number; teamId: string },
      {},
      string
    >;
    removeVotersArea: ResolverFn<
      {},
      { zipCode: string; barangayId: string; purokId: string },
      {},
      string
    >;
    genderBundleQrCode: ResolverFn<{}, { idList: string[] }, {}, string>;
    generatedTeamQRCode: ResolverFn<{}, { teamId: string }, {}, string>;
    removeQRcode: ResolverFn<{}, { id: string[] }, {}, string>;
    createPostion: ResolverFn<{}, { title: string }, {}, string>;
    updateLeader: ResolverFn<
      {},
      { id: string; level: number; teamId: string; method: number },
      {},
      string
    >;
    addNewCandidate: ResolverFn<
      {},
      { firstname: string; lastname: string; code: string; colorCode: string },
      {},
      string
    >;
    changeLeader: ResolverFn<
      {},
      { id: string; teamId: string; level: number },
      {},
      string
    >;
    deleteTeams: ResolverFn<{}, {}, {}, string>;
    assignBarangayIDnumber: ResolverFn<{}, { zipCode: number }, {}, string>;
    assignTeam: ResolverFn<
      {},
      {
        team: {
          zipCode: number;
          barangayCoorId: string;
          purokCoorId: string;
          barangayId: string;
          teamLeaderId: string;
          members: string[];
        };
      },
      {},
      string
    >;
    composeTeam: ResolverFn<
      {},
      {
        team: {
          zipCode: number;
          barangayCoorId: string;
          purokCoorId: string;
          barangayId: string;
          teamLeaderId: string;
          members: string[];
        };
        code: string
      },
      {},
      string
    >;
    clearTeamRecords: ResolverFn<{}, {}, {}, string>;
    multiSelectVoter: ResolverFn<
      {},
      { teamId: string; members: string[]; method: number },
      {},
      string
    >;
    removeTeam: ResolverFn<{}, { id: string }, {}, string>;
    removeAllTeams: ResolverFn<{}, {}, {}, string>;
    createCustomOption: ResolverFn<{}, { id: string }, {}, string>;
    resetTeamList: ResolverFn<
      {},
      { zipCode: string; barangayId: string },
      {},
      string
    >;
    teamMerger: ResolverFn<
      {},
      { firstId: string; secondId: string },
      {},
      string
    >;
    //removeValidateTeamleader: ResolverFn<{}, {}, {}, string>;
    validationUpdate: ResolverFn<
      {},
      {
        validatedDelisted: {
          id: string;
          votersId: string;
        }[];
        votersToUpdate: {
          id: string;
          props: string;
          type: string;
          value: string;
          votersId: string;
          action: number;
          teamId: string;
        }[];
        votersToTransfer: {
          id: string;
          votersId: string;
          teamId: string;
          fromteamId: string;
          toTeamId: string;
          level: number;
        }[];
        untrackedList: {
          id: string;
          votersId: string;
          team_Id: string;
          municipalsId: string;
          barangaysId: string;
          purokId: string;
          timestamp: string;
          account_id: string
        }[];
        validateDuplicate: {
          id: string;
          duplicateteamMemberId: string;
          votersId: string;
          account_id: string;
        }[];
        recordToDelete: {
          id: string;
          recordId: string;
          voter_id: string;
          team_id: string;
        }[];
        newVoterRecord: {
          id: string;
          voter_id: string;
          desc: string;
          questionable: number;
          account_id: string;
          type: number
        }[];
        appoinments: {
          id: string;
          activity: number;
          appointment: string;
          team_Id: string;
          votersId: string;
          municipalsId: string;
          barangaysId: string;
          purokId: string;
          date: string;
        }[];
        toSplit: {
          id: string;
          teamId?: string;
          pos?: number;
          votersId?: string;
          level?: number;
          timestamp?: string;
        }[];
        validatedPerson: {
          id: string;
          votersId?: string;
          timestamp?: string;
        }[];
        validatedTeams: {
          id: string;
          teamId?: string;
          municipalsId?: string;
          barangaysId?: string;
          accountId?: string;
          timestamp?: string;
        }[];
        accountTeamHoldings: {
          id: string;
          accountId?: string;
          teamId?: string;
          municipalsId?: string;
          barangaysId?: string;
        }[];
        teamToMerge: {
          id: string;
          teamIdToJoin?: string;
          teamIdToMerge?: string;
          accountId?: string;
          municipalsId?: string;
          barangaysId?: string;
        }[];
        teamExcluded: {
          id: string;
          teamId?: string;
          votersId?: string;
          municipalsId?: string;
          barangaysId?: string;
          purokId?: string;
          accountId?: string;
          timestamp?: string;
        }[];
      },
      {},
      string
    >;
    resetAccountTeamhandle: ResolverFn<{},{},{}, string>
    assignedTeamsOnAccount: ResolverFn<
      {},
      {
        userId: string;
        zipCode: number;
        barangaysId: number;
        from: number;
        take: number;
        min: number;
        max: number;
      },
      {},
      string
    >;
    deleteAssignTeam: ResolverFn<{},{id: string},{}, string>
    selectedTeamAssign: ResolverFn<{},{ids: string[],userId: string},{}, string>
    creatCandidateBatch: ResolverFn<{},{zipCode: number},{}, string>;
    markTeamVerified: ResolverFn<{},{teamId: string,accountID: string},{},string>
    markMemberVerified: ResolverFn<{},{memberId: string[],accountID: string},{},string>
    updateTeamMemberProps: ResolverFn<{},{memberId: string[], props: string},{}, string>
    memberExclude: ResolverFn<{},{membersId: string[]},{}, string>;
    swapVoters: ResolverFn<{},{levelToSwap: number, levelToBeSwapped: number, voterOneId: string, voterTwoId: string},{}, string>
    markUntracked: ResolverFn<{},{ memberId: string[]},{}, string>
  };
  Voter: {
    votersCount: ResolverFn<{}, {}, {}, number>;
    purok: ResolverFn<
      Voters,
      { purok: { id: number; barangayId: string; municipalId: number } },
      {},
      Purok | null
    >;
    barangay: ResolverFn<Voters, {}, {}, Barangays | null>;
    municipal: ResolverFn<Voters, {}, {}, Municipals | null>;
    qrCodes: ResolverFn<Voters, {}, {}, QRcode[]>;
    leader: ResolverFn<Voters, {}, {}, TeamLeader | null>;
    record: ResolverFn<Voters, {}, {}, VoterRecords[]>;
    ValdilatedMember: ResolverFn<Voters, {},{}, ValdilatedMembers | null>;
    untracked: ResolverFn<Voters, {}, {}, UntrackedVoter | null>
  };
  Municipal: {
    barangays: ResolverFn<Municipals, {}, {}, Barangays[]>;
    voters: ResolverFn<Municipals, {}, {}, Voters[]>;
    barangaysCount: ResolverFn<Municipals, {}, {}, number>;
  };
  Barangay: {
    barangayVotersCount: ResolverFn<Barangays, {}, {}, number>;
    purokCount: ResolverFn<Barangays, {}, {}, number>;
    puroks: ResolverFn<Barangays, {}, {}, Purok[]>;
    surveyResponse: ResolverFn<
      Barangays,
      { survey: { municipalsId: number; surveyId: string } },
      {},
      SurveyResponse[]
    >;
    surveyRespondentResponse: ResolverFn<
      Barangays,
      { survey: { municipalsId: number; surveyId: string } },
      {},
      RespondentResponse[]
    >;
    RespondentResponse: ResolverFn<
      Barangays,
      { id: string; zipCode: number },
      {},
      number
    >;
    quota: ResolverFn<Barangays, {}, {}, Quota[]>;
    quotas: ResolverFn<Barangays, { id: string }, {}, Quota | null>;
    optionResponse: ResolverFn<
      Barangays,
      { id: string; surveyId: string },
      {},
      number
    >;
    selectedQuery: ResolverFn<Barangays, { id: string }, {}, Option[]>;
    validationList: ResolverFn<Barangays, {}, {}, Validation[]>;
    supporters: ResolverFn<
      Barangays,
      { id: string },
      {},
      {
        figureHeads: number;
        bc: number;
        pc: number;
        tl: number;
        withTeams: number;
        voterWithoutTeam: number;
      }
    >;
    teamStat: ResolverFn<
      Barangays,
      {},
      {},
      {
        aboveMax: number;
        belowMax: number;
        equalToMax: number;
        aboveMin: number;
        equalToMin: number;
        belowMin: number;
        threeAndBelow: number;
      }
    >;
    leaders: ResolverFn<
      Barangays,
      { skip: number; candidateId: string },
      {},
      TeamLeader[]
    >;
    barangayDelistedVoter: ResolverFn<Barangays, {}, {}, number>;
    teams: ResolverFn<Barangays, {level: number | undefined}, {}, Team[]>
    teamValidationStat: ResolverFn<Barangays,{},{}, TeamValidationStat>
  };
  Purok: {
    purokDraftedVotersCount: ResolverFn<Purok, {}, {}, number>;
  };
  NewBatchDraft: {
    barangay: ResolverFn<NewBatchDraft, {}, {}, Barangays | null>;
    municipal: ResolverFn<NewBatchDraft, {}, {}, Municipals | null>;
  };
  Survey: {
    admin: ResolverFn<
      {
        id: string;
        tagID: string;
        timestamp: Date;
        type: string;
        drafted: boolean;
        status: string;
        adminUserUid: string;
      },
      {},
      {},
      AdminUser | null
    >;
    queries: ResolverFn<Survey, {}, {}, Queries[]>;
    images: ResolverFn<Survey, {}, {}, MediaUrl[]>;
    responseCount: ResolverFn<Survey, { zipCode: number }, {}, number>;
    ageCount: ResolverFn<Survey, {}, {}, AgeBracket[]>;
    result: ResolverFn<Survey, {}, {}, string>;
  };
  Queries: {
    options: ResolverFn<Queries, {}, {}, Option[]>;
    respondentOption: ResolverFn<Queries, { id: string }, {}, DataResponse[]>;
    barangayList: ResolverFn<
      {},
      { zipCode: number; candidateId: string },
      {},
      Barangays[]
    >;
    customOption: ResolverFn<
      Queries,
      { zipCode: number; surveyId: string; barangayId: string },
      {},
      CustomOption[]
    >;
  };
  Option: {
    fileUrl: ResolverFn<Option, {}, {}, MediaUrl | null>;
    overAllResponse: ResolverFn<
      Option,
      { id: string; zipCode: number; barangayId: string; genderId: string },
      {},
      number
    >;
    ageCountRank: ResolverFn<
      Option,
      {
        id: string;
        ageBracketId: string;
        barangayId: string;
        genderId: string;
      },
      {},
      number
    >;
    optionRank: ResolverFn<
      Option,
      {
        surveyId: string;
        zipCode: number;
        barangayId: string;
        ageBracketId: string;
        genderId: string;
        optionId: string;
      },
      {},
      number
    >;
    barangays: ResolverFn<{}, {}, {}, Barangays[]>;
    results: ResolverFn<Option, {}, {}, number>;
  };
  RespondentResponse: {
    age: ResolverFn<RespondentResponse, {}, {}, AgeBracket | null>;
    gender: ResolverFn<RespondentResponse, {}, {}, Gender | null>;
    responses: ResolverFn<RespondentResponse, {}, {}, DataResponse[]>;
    barangay: ResolverFn<RespondentResponse, {}, {}, Barangays | null>;
  };
  SurveyResponse: {
    barangay: ResolverFn<SurveyResponse, {}, {}, Barangays | null>;
    respondentResponses: ResolverFn<
      SurveyResponse,
      {},
      {},
      RespondentResponse[]
    >;
    users: ResolverFn<SurveyResponse, {}, {}, Users | null>;
  };
  Quota: {
    age: ResolverFn<Quota, {}, {}, AgeBracket | null>;
    gendersSize: ResolverFn<Quota, {}, {}, GenderSize[]>;
  };
  AgeBracket: {
    quota: ResolverFn<AgeBracket, { id: string }, {}, Quota[]>;
    surveyAgeCount: ResolverFn<
      AgeBracket,
      { id: string; zipCode: number; barangayId: string; genderId: string },
      {},
      number
    >;
    optionAgeCount: ResolverFn<AgeBracket, { surveyId: string }, {}, Queries[]>;
    overAllAgeRanking: ResolverFn<{}, { id: string }, {}, Queries[]>;
    optionRank: ResolverFn<
      AgeBracket,
      {
        surveyId: string;
        zipCode: number;
        barangayId: string;
        genderId: string;
        optionId: string;
      },
      {},
      number
    >;
  };
  GenderSize: {
    gender: ResolverFn<GenderSize, {}, {}, Gender | null>;
  };
  Response: {
    option: ResolverFn<DataResponse, {}, {}, Option[]>;
    queries: ResolverFn<DataResponse, {}, {}, Queries | null>;
  };
  ResponseRespondent: {
    barangay: ResolverFn<
      RespondentResponse,
      { id: string },
      {},
      Barangays | null
    >;
  };
  Team: {
    voters: ResolverFn<Team, {}, {}, Voters[]>;
    teamLeader: ResolverFn<Team, {}, {}, TeamLeader | null>;
    candidate: ResolverFn<Team, {}, {}, Candidates | null>;
    purok: ResolverFn<Team, {}, {}, Purok | null>;
    barangay: ResolverFn<Team, {}, {}, Barangays | null>;
    municipal: ResolverFn<Team, {}, {}, Municipals | null>;
    _count: ResolverFn<Team, {}, {}, { voters: number }>;
    votersCount: ResolverFn<Team, {}, {}, number>;
    AccountHandleTeam: ResolverFn<Team, {},{}, AccountHandleTeam | null>;
    AccountValidateTeam: ResolverFn<Team, {id: string},{}, AccountValidateTeam | null>;
    untrackedCount: ResolverFn<Team, {},{}, number>
  };
  TeamLeader: {
    voter: ResolverFn<TeamLeader, {}, {}, Voters | null>;
    barangayCoor: ResolverFn<TeamLeader, {}, {}, TeamLeader | null>;
    purokCoors: ResolverFn<TeamLeader, {}, {}, TeamLeader | null>;
    teamList: ResolverFn<TeamLeader, {}, {}, Team[]>;
  };
  Candidates: {
    supporters: ResolverFn<Candidates, {}, {}, number>;
    inTeam: ResolverFn<
      Candidates,
      {},
      {},
      {
        figureHeads: number;
        bc: number;
        pc: number;
        tl: number;
        withTeams: number;
        voterWithoutTeam: number;
      }
    >;
  };
  ValidatedTeams: {
    teamLeader: ResolverFn<ValidatedTeams, {}, {}, TeamLeader | null>;
    municipal: ResolverFn<ValidatedTeams, {}, {}, Municipals | null>;
    barangay: ResolverFn<ValidatedTeams, {}, {}, Barangays | null>;
    purok: ResolverFn<ValidatedTeams, {}, {}, Purok | null>;
    validatedTeamMembers: ResolverFn<
      ValidatedTeams,
      {},
      {},
      ValidatedTeamMembers[]
    >;
  };
  ValidatedTeamMembers: {
    voter: ResolverFn<ValidatedTeamMembers, {}, {}, Voters | null>;
  };
  Users: {
    qrCode: ResolverFn<Users, {}, {}, UserQRCode | null>;
    accountHandleTeam: ResolverFn<Users, {}, {}, AccountHandleTeam[]>;
  };
  AccountHandleTeam: {
    team: ResolverFn<AccountHandleTeam, {}, {}, Team | null>;
    account: ResolverFn<AccountHandleTeam, {}, {}, Users | null>;

  }
};
