const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY
    ? `${process.env.CLOUDINARY_API_KEY.slice(0, 4)}****`
    : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET
    ? "LOADED"
    : "MISSING",
});

module.exports = cloudinary;