import { Voters, Barangays, Municipals, TeamLeader, Users } from '../../prisma/prisma';

export interface BarangayProps {
  name: string;
  id: string;
  number: number;
  barangayVotersCount: number;
  purokCount: number;
  sampleSize: number;
  population: number;
  surveyor: number;
  activeSurveyor: number;
  femaleSize: number;
  maleSize: number;
  supporters: AllSupporters;
  teamStat: TeamStatProps;
  leaders: TeamLeaderProps[];
}

interface AllSupporters {
  figureHeads: number;
  bc: number;
  pc: number;
  tl: number;
  withTeams: number;
  voterWithoutTeam: number;
  orMembers: number;
  deadWithTeam: number;
}

export interface VotersProps {
  id: string;
  lastname: string;
  firstname: string;
  idNumber: string;
  gender?: string;
  barangay: BarangayProps;
  status: number;
  calcAge: number;
  birthYear: string;
  level: number;
  barangaysId: string;
  municipalsId: number;
  precintsId?: string | null;
  saveStatus: string;
  mobileNumber?: string | null;
  houseHoldId?: string | null;
  newBatchDraftId?: string | null;
  pwd?: string | null;
  oor?: string | null;
  inc?: string | null;
  illi?: string | null;
  inPurok?: boolean | null;
  senior?: boolean | null;
  youth?: boolean | null;
  hubId?: string | null;
  qrCode?: string | null;
  candidatesId?: string | null;
  qrCodeNumber: number;
  teamId?: string;
  leader?: TeamLeaderProps;
}

export interface TeamStatProps {
  aboveMax: number;
  belowMax: number;
  equalToMax: number;
  aboveMin: number;
  equalToMin: number;
  belowMin: number;
  threeAndBelow: number;
  noMembers: number;
}

export interface TeamsProps {
  id: string;
  voters: VotersProps[];
  purokId: string;
  barangay: BarangayProps;
  barangaysId: string;
  municipalsId: number;
  hubId?: string | null;
  level: number;
  teamLeaderId: string;
  candidatesId?: string | null;
  teamLeader: TeamLeaderProps | null;
  barangayCoor: TeamLeaderProps | null;
  purokCoors: TeamLeaderProps | null;
  _count: {
    voters: number;
  };
  votersCount: number;
}

export interface TeamLeaderProps {
  id: string;
  voter?: VotersProps | null;
  hubId: string;
  barangay: BarangayProps;
  purokCoorId?: string;
  voterId?: string;
  municipalsId: number;
  barangaysId: string;
  team: TeamsProps[];
  teamId?: string;
  votersId?: string;
  purokId: string;
  handle?: number;
  level: number;
  candidatesId?: string;
  barangayCoor: {
    id: string;
    voter?: VotersProps | null;
  };
  purokCoors: {
    id: string;
    voter?: VotersProps | null;
  };
  teamList: TeamsProps[];
  voters: VotersProps[];
}

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
  '18-30': string;
  saveStatus: string;
  [key: string]: string | number | null | undefined;
  candidateId?: string;
  'PREC.': string | undefined;
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
    'firstname' | 'lastname' | 'idNumber' | 'barangaysId' | 'municipalsId' | 'level'
  > {
  id?: string;
  votersId?: string;
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
  votersId?: string;
  user?: Users | null;
  usersUid?: string;
}
export interface Team {
  id: string;
  purokId: string;
  barangaysId: string;
  municipalsId: number;
  hubId?: string | null;
  level: number;
  teamLeaderId: string;
  candidatesId?: string | null;
  TeamLeader: TeamLeaderProps | null;
  voters: VotersProps[];
}

export interface TeamProps extends Omit<Team, ''> {
  _count: {
    voters: number;
  }[];
}

export interface ResponseWithCustomeData extends Omit<RespondentResponseProps, ''> {
  customeOptions: {
    value: string;
    id: string;
  }[];
}

export interface SurveyResults {
  tagID: string;
  id: string;
  zipCode: number;
  barangay: string;
  queries: {
    id: string;
    queries: string;
    options: {
      id: string | null;
      title: string | null;
      queryId: string | null;
      response: {
        id: string | null;
        ageSegment: string | null;
        ageSegmentId: string | null;
        order: number;
        gender: {
          id: string;
          name: string;
        }[];
      }[];
    }[];
  }[];
}

export interface GroupedVotersToUpdate {
  votersId: string;
  props: {
    id: string;
    props: string;
    type: string;
    value: string;
    votersId: string;
    action: number;
    teamId: string;
  }[];
}

export interface TeamValidationStat {
  teamLeadersCount: number;
  members: number;
  validatedTL: number;
  validatedMembers: number;
  untrackedMembers: number;
  orMembers: number;
  dead: number;
  exclude: number;
}

export interface CalibratedResult {
  voter?: Voters;
  votersId: string;
  level: number; // TypeScript uses 'number' instead of 'Int'
  reason: string; // TypeScript uses 'string' instead of 'String'
  code: number;
  barangay?: Barangays;
  barangaysId: string;
  teamLeader?: any | undefined;
  teamLeaderId: string | null;
  team?: Team;
  teamId: string | null;
  correct: string;
  currentLevel: number;
}
