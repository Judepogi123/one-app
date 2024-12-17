import {
  Voters,
  Barangays,
  Municipals,
  TeamLeader,
  Users,
} from "../../prisma/prisma";

export interface RowProps {
  __EMPTY: string;
  __EMPTY_1: string;
  __EMPTY_2: string;
  __EMPTY_3: string;
  __EMPTY_4: string;
  __EMPTY_5: string;
  __EMPTY_6: string;
  __EMPTY_7: string;
  __EMPTY_8: string;
  __EMPTY_9: string;
  __EMPTY_10: string;
  __EMPTY_11: string;
  __EMPTY_12: string;
}

export interface DataProps {
  No?: string;
  "Voter's Name"?: string;
  lastname: string;
  firstname: string;
  __EMPTY?: string;
  __EMPTY_1?: string;
  Gender?: string;
  gender: string;
  Address: string;
  Birthday?: string | number | null;
  DL: string;
  PWD: string;
  IL: string;
  INC: string;
  OR: string;
  SC: string;
  "18-30": string;
  saveStatus: string;
  [key: string]: string | number | null | undefined;
  candidateId?: string;
}

export interface UpdateDataProps {
  firstname: string;
  "Voter's Name"?: string;
  lastname: string;
  DL: string | undefined;
  INC: string | undefined;
  OR: string | undefined;
  [key: string]: string | undefined;
}

export interface GenderProps {
  id: string;
  name: string;
}

export interface AgeBracket {
  id: string;
  segment: string;
}
export interface RespondentResponses {
  id: string;
  age: AgeBracket;
  gender: GenderProps;
}

export interface OptionProps {
  id: string;
  queryId: string;
  title: string;
  desc: string;
  overAllCount?: number;
}
export interface RespondentResponseProps {
  id: string;
  order: number;
  queries: string;
  surveyId: string;
  queryId: string;
  ageBracketId: string;
  genderId: string;
  respondentResponseId: string;
  option: OptionProps[];
}
export interface SelectedOptionProps {
  id: string;
  title: string;
  overAllResponse: number;
  barangays: {
    id: string;
    name: string;
    femaleSize: number;
    maleSize: number;
    optionResponse: number;
  }[];
}

export interface BarangayOptionResponse {
  id: string;
  name: string;
  options: {
    id: string;
    queryId: string;
    title: string | null;
    desc: string | null;
    overAllCount: number;
  }[];
}
export interface RejectListProps {
  id: string;
  firstname: string;
  lastname: string;
  municipal: number;
  barangay: string;
  reason: string;
  teamId: string | null;
  code: number;
  idNumber?: string;
}
export interface RejectListedProps
  extends Pick<
    Voters,
    | "id"
    | "firstname"
    | "lastname"
    | "idNumber"
    | "barangaysId"
    | "municipalsId"
    | "level"
  > {
  reason: string;
  code: number;
}

export interface ValidatedTeams {
  id: string;
  teamLeader?: TeamLeader | null;
  teamLeaderId?: string | null;
  barangay: Barangays;
  barangaysId: string;
  municipal: Municipals;
  municipalsId: number;
  purokId: string;
  validatedTeamMembers: ValidatedTeamMembers[];
  timestamp: Date;
}

// Interface for the ValidatedTeamMembers model
export interface ValidatedTeamMembers {
  idNumber: string;
  votersId?: string | null;
  barangayId: string;
  municipal?: string;
  municipalsId?: number | null;
  purokId: string;
  teamLeader?: TeamLeader | null;
  teamLeaderId: string | null;
  validatedTeamsId: string | null;
  remark: string | null;
}

export interface VoterRecordsProps {
  desc: string;
  questionable: boolean;
  timestamp?: string;
  voter?: Voters | null;
  votersId: string;
  user?: Users | null;
  usersUid?: string;
}
