import { v2 as cloudinary } from "cloudinary";

const key = process.env.CLOUDINARY_KEY;
const secret = process.env.CLOUDINARY_SECRET;
const name = process.env.CLOUDINARY_NAME;
cloudinary.config({
cloud_name: name,
  secure: true,
  api_key: key,
  api_secret: secret,
});

export default cloudinary
