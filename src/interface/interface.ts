import z from "zod";

export const userSchema = z.object({
  uid: z.string().uuid(),
  firstname: z.string(),
  lastname: z.string(),
  password: z.string(),
  status: z.string(),
});

export const usersSchema = z.array(userSchema);

export const votersSchema = z.object({
  lastname: z.string(),
  firstname: z.string(),
  purok: z.string(),
  barangaysId: z.string(),
  municipalsId: z.number(),
  precentsId: z.string(),
  status: z.number(),
  ageRange: z.string(),
  batchYearId: z.number(),
  level: z.number(),
});

export const DraftedSchema = z.object({
  No: z.string(),
  Address: z.string(),
  "Voter's Name": z.string(),
  lastname: z.string(),
  firstname: z.string(),
  __EMPTY: z.string(),
  DL: z.string(),
  PWD: z.string(),
  IL: z.string(),
  INC: z.string(),
  OR: z.string(),
});

export const DraftedSchemaList = z.array(DraftedSchema)
