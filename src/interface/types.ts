// types.ts
import { GraphQLResolveInfo, GraphQLScalarType } from "graphql";
import {
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
  Response as DataResponse,
} from "@prisma/client";

export type ResolverFn<Parent, Args, Context, Result> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Result> | Result;

export type Resolvers = {
  Query: {
    users: ResolverFn<{}, {}, {}, Users[]>;
    voters: ResolverFn<{}, {}, {}, Voters[]>;
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
    barangayList: ResolverFn<{}, { municipalId: number }, {}, Barangays[] | []>;
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
    //barangayVoters: ResolverFn<Voters,{},{},number>
    //precints: ResolverFn<{}, {}, {}, Precents[] | []>;
  };
  Mutation: {
    createVoter: ResolverFn<{}, Voters, {}, Voters>;
    newUser: ResolverFn<
      {},
      {
        firstname: string;
        lastname: string;
        password: string;
        status: string;
        phoneNumber: string;
        address: string;
      },
      {},
      Users
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
  };
  Voter: {
    votersCount: ResolverFn<{}, {}, {}, number>;
    purok: ResolverFn<
      Voters,
      { purok: { id: number; barangayId: string; municipalId: number } },
      {},
      Purok | null
    >;
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
  };
  Queries: {
    options: ResolverFn<Queries, {}, {}, Option[]>;
  };
  Option: {
    fileUrl: ResolverFn<Option, {}, {}, MediaUrl | null>;
  };
  RespondentResponse: {
    age: ResolverFn<RespondentResponse, {}, {}, AgeBracket | null>;
    gender: ResolverFn<RespondentResponse, {}, {}, Gender | null>;
    responses: ResolverFn<RespondentResponse, {}, {}, DataResponse[]>;
  };
  SurveyResponse: {
    barangay: ResolverFn<SurveyResponse, {}, {}, Barangays | null>;
    respondentResponses: ResolverFn<
      SurveyResponse,
      {},
      {},
      RespondentResponse[]
    >;
  };
};
