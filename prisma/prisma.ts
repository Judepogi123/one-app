// prisma.ts
import {
  PrismaClient,
  Candidates,
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
  Quota,
  GenderSize,
  PurokCoor,
  TeamLeader,
  QRcode,
  Team,
  Validation,
  Voters,
  Position,
  Prisma
} from "@prisma/client";

const prisma = new PrismaClient({
    log: ['info'],
  })

export {
  prisma,
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
  Position,
  Prisma
};