"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
router.post("/user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.body.username;
    const password = req.body.password;
    console.log({ user, password });
    try {
        if (!user || !password) {
            res.status(200).json({
                error: 0,
                message: "Invalid username or password",
            });
            return;
        }
        const secretToken = process.env.JWT_SECRECT_TOKEN;
        if (!secretToken) {
            throw new Error("JWT secret token is not defined");
        }
        const userData = yield prisma_1.prisma.users.findFirst({
            where: {
                username: user
            },
        });
        if (!userData) {
            res.status(200).json({
                error: 1,
                message: "User not found",
            });
            return;
        }
        if (userData.role !== 2) {
            return res.status(200).json({
                error: 2,
                message: "Unauthorized Account",
            });
        }
        if (userData.status === 0) {
            return res.status(200).json({
                error: 3,
                message: "Account Suspended",
            });
            return;
        }
        const isPasswordValid = yield argon2_1.default.verify(userData.password, password);
        if (!isPasswordValid) {
            return res.status(200).json({
                error: 4,
                message: "Incorrect password",
            });
        }
        const accessToken = jsonwebtoken_1.default.sign({ user: userData.username }, secretToken, {
            expiresIn: "8h",
        });
        const { username, role, uid, forMunicipal } = userData;
        console.log({ username, role, uid, forMunicipal });
        res.status(200).json({ username, role, uid, accessToken, forMunicipal });
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}));
exports.default = router;
