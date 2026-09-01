require("dotenv").config();

const fs = require("fs");
const https = require("https");
const crypto = require("crypto");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const filePath = "test.jpg";

if (!fs.existsSync(filePath)) {
  console.error("❌ test.jpg not found");
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000);

const signatureString = `timestamp=${timestamp}${apiSecret}`;
const signature = crypto
  .createHash("sha1")
  .update(signatureString)
  .digest("hex");

const boundary = "----AGRIGHARBOUNDARY";

const file = fs.readFileSync(filePath);
const filename = "test.jpg";

const bodyParts = [];

function addField(name, value) {
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
      `${value}\r\n`
    )
  );
}

addField("api_key", apiKey);
addField("timestamp", timestamp);
addField("signature", signature);

bodyParts.push(
  Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`
  )
);

bodyParts.push(file);

bodyParts.push(
  Buffer.from(`\r\n--${boundary}--\r\n`)
);

const body = Buffer.concat(bodyParts);

const options = {
  hostname: "api.cloudinary.com",
  path: `/v1_1/${cloudName}/image/upload`,
  method: "POST",
  headers: {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  },
};

console.log("Uploading directly to Cloudinary...");
console.log("Cloud name:", cloudName);
console.log("API key:", apiKey.slice(0, 4) + "****");

const req = https.request(options, (res) => {
  let responseBody = "";

  res.on("data", (chunk) => {
    responseBody += chunk;
  });

  res.on("end", () => {
    console.log("\nHTTP STATUS:", res.statusCode);

    console.log("\nX-Cld-Error:");
    console.log(res.headers["x-cld-error"] || "Not present");

    console.log("\nResponse body:");
    console.log(responseBody);
  });
});

req.on("error", (error) => {
  console.error("❌ Request error:", error);
});

req.write(body);
req.end();