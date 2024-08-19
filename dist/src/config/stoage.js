"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const key = process.env.CLOUDINARY_KEY;
const secret = process.env.CLOUDINARY_SECRET;
const name = process.env.CLOUDINARY_NAME;
cloudinary_1.v2.config({
    cloud_name: name,
    secure: true,
    api_key: key,
    api_secret: secret,
});
exports.default = cloudinary_1.v2;
