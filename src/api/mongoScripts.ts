export const CONNECTION_TEST_SUCCESSFUL_MESSAGE = "MONGO_CONNECTION_TEST_OK";
export const HTTP_SUCCESSFUL_MESSAGE = "MONGO_EXPRESS_HTTP_OK";

// Exercise the read operations used by Mongo Express at startup and on its home page.
// A ping alone can succeed without authenticating to MongoDB.
export const CONNECTION_TEST_SCRIPT = `
const { MongoClient } = require("mongodb");
let client;
const timeout = setTimeout(() => {
  console.error("The connection test timed out after 15 seconds.");
  process.exit(1);
}, 15000);
(async () => {
  try {
    client = new MongoClient(process.env.ME_CONFIG_MONGODB_URL, {
      ssl: process.env.ME_CONFIG_MONGODB_SSL === "true",
      sslValidate: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    await client.connect();
    if (process.env.ME_CONFIG_MONGODB_ENABLE_ADMIN === "true") {
      const admin = client.db().admin();
      const { databases } = await admin.listDatabases();
      for (const { name } of databases) {
        await client.db(name).listCollections().toArray();
      }
      await admin.serverStatus();
    } else {
      await client.db().listCollections().toArray();
    }
    console.log("${CONNECTION_TEST_SUCCESSFUL_MESSAGE}");
  } catch (error) {
    console.error(error.message || String(error));
    process.exitCode = 1;
  } finally {
    await client?.close();
    clearTimeout(timeout);
  }
})();
`;

// Check the actual home page: /status and the listening log do not exercise its database calls.
// Run inside the container so the check does not depend on browser CORS permissions.
export const HTTP_CHECK_SCRIPT = `
const http = require("http");
const timeout = setTimeout(() => {
  console.error("Mongo Express did not respond to its home-page request within 5 seconds.");
  process.exit(1);
}, 5000);
const request = http.get("http://127.0.0.1:8081/", (response) => {
  let bytes = 0;
  response.on("data", (chunk) => { bytes += chunk.length; });
  response.on("end", () => {
    clearTimeout(timeout);
    if (response.statusCode === 200 && bytes > 0) {
      console.log("${HTTP_SUCCESSFUL_MESSAGE}");
    } else {
      console.error("Mongo Express returned HTTP " + response.statusCode + " with " + bytes + " bytes.");
      process.exitCode = 1;
    }
  });
});
request.on("error", (error) => {
  clearTimeout(timeout);
  console.error("Mongo Express home page could not be loaded: " + error.message);
  process.exitCode = 1;
});
`;
