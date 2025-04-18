"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = exports.prisma = void 0;
// prisma.ts
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_1.Prisma; } });
const prisma = new client_1.PrismaClient({
    log: ['info'],
});
exports.prisma = prisma;
