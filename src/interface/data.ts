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
  Address: string;
  "B-day"?: string;
  DL: string;
  PWD: string;
  IL: string;
  INC: string;
  OR: string;
  saveStatus: string;
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
  desc: string
}
export interface RespondentResponseProps {
  id: string;
  order: number;
  queries: string;
  surveyId: string;
  queryId: string;
  ageBracketId: string;
  genderId: string
  respondentResponseId: string;
  option: OptionProps[];
}
export interface SelectedOptionProps {
  id: string;
  title: string;
overAllResponse:number
  barangays: {
    id: string;
    name: string;
    femaleSize: number;
    maleSize: number;
    optionResponse: number;
  }[];
}