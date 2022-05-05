require("dotenv").config();
const clientBaseUrl = process.env.CLIENTBASEURL || "http://127.0.0.1";

module.exports = { clientBaseUrl };
