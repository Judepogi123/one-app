-- AlterTable
CREATE SEQUENCE municipals_id_seq;
ALTER TABLE "Municipals" ALTER COLUMN "id" SET DEFAULT nextval('municipals_id_seq');
ALTER SEQUENCE municipals_id_seq OWNED BY "Municipals"."id";
