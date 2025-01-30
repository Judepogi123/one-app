"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftedSchemaList = exports.DraftedSchema = exports.votersSchema = exports.usersSchema = exports.userSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.userSchema = zod_1.default.object({
    uid: zod_1.default.string().uuid(),
    firstname: zod_1.default.string(),
    lastname: zod_1.default.string(),
    password: zod_1.default.string(),
    status: zod_1.default.string(),
});
exports.usersSchema = zod_1.default.array(exports.userSchema);
exports.votersSchema = zod_1.default.object({
    lastname: zod_1.default.string(),
    firstname: zod_1.default.string(),
    purok: zod_1.default.string(),
    barangaysId: zod_1.default.string(),
    municipalsId: zod_1.default.number(),
    precentsId: zod_1.default.string(),
    status: zod_1.default.number(),
    ageRange: zod_1.default.string(),
    batchYearId: zod_1.default.number(),
    level: zod_1.default.number(),
});
exports.DraftedSchema = zod_1.default.object({
    No: zod_1.default.string(),
    Address: zod_1.default.string(),
    "Voter's Name": zod_1.default.string(),
    lastname: zod_1.default.string(),
    firstname: zod_1.default.string(),
    __EMPTY: zod_1.default.string(),
    DL: zod_1.default.string(),
    PWD: zod_1.default.string(),
    IL: zod_1.default.string(),
    INC: zod_1.default.string(),
    OR: zod_1.default.string(),
});
exports.DraftedSchemaList = zod_1.default.array(exports.DraftedSchema);
