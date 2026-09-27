require("dotenv").config();
const express = require("express");
const path = require("path");

const whatsappRoutes = require("./whatsappRoutes");
const callbackRoutes = require("./callbackRoutes");
const adminRoutes = require("./adminRoutes");

const REQUIRED_ENV_VARS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_NUMBER",
  "DARAJA_CONSUMER_KEY",
  "DARAJA_CONSUMER_SECRET",
  "DARAJA_SHORTCODE",
  "DARAJA_PASSKEY",
  "DARAJA_CALLBACK_URL",
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  const msg =
    `❌ Missing required environment variables: ${missing.join(", ")}\n` +
    "Copy .env.example to .env and fill in your credentials before starting the server.";

  // In development it's often useful to run without all production env vars.
  // Allow starting the server when NODE_ENV=development or FORCE_START=true.
  if (process.env.NODE_ENV === "development" || process.env.FORCE_START === "true") {
    console.warn(msg + "\nStarting in development mode without all env vars set.");
  } else {
    console.error(msg);
    process.exit(1);
  }
}

const app = express();

// Session support for admin auth
const session = require("express-session");
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", whatsappRoutes);
app.use("/", callbackRoutes);
app.use("/", adminRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   WhatsApp webhook:  POST /whatsapp`);
  console.log(`   Daraja callback:   POST /stk-callback`);
});
