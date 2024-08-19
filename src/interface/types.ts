// types.ts
import { GraphQLResolveInfo, GraphQLScalarType } from "graphql";
import { FileUpload } from "graphql-upload-ts";
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
} from "@prisma/client";

export type ResolverFn<Parent, Args, Context, Result> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Result> | Result;

export type Resolvers = {
  Query: {
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
    
    queries: ResolverFn<{}, { id: string }, {}, Queries | null>;
    option: ResolverFn<{}, { id: string }, {}, Option | null>;
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
      { survey: { type: string; adminUserUid: string } },
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
        media: { filename: string; url: string; size: string };
        option: {
          title: string;
          desc: string;
          queryId: string;
        };
      },
      {},
      Option
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
    goLiveSurvey: ResolverFn<{}, { id: string }, {}, Survey>;
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
  };
  Queries: {
    options: ResolverFn<Queries, {}, {}, Option[]>;
  };
  Option: {
    fileUrl: ResolverFn<Option, {}, {}, MediaUrl | null>;
  };
};
