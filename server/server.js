const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const CodeSubmission = require("./models/CodeSubmission");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// 🔥 PISTON MIRRORS (AUTO FALLBACK)
const PISTON_ENDPOINTS = [
  "https://emkc.org/api/v2/piston/execute",
  "https://piston.odin.surf/api/v2/execute",
];

// Judge0 language_id → Piston language
const languageMap = {
  50: "c",
  54: "cpp",
  62: "java",
  63: "javascript",
  71: "python",
};

// Run Code API
app.post("/run-code", async (req, res) => {
  const { language_id, source_code, stdin } = req.body;

  if (!language_id || !source_code) {
    return res.status(400).json({ output: "❌ Missing fields" });
  }

  const language = languageMap[language_id];
  if (!language) {
    return res.status(400).json({ output: "❌ Unsupported language" });
  }

  let lastError = null;

  for (const url of PISTON_ENDPOINTS) {
    try {
      const response = await axios.post(url, {
        language,
        version: "*",
        files: [{ content: source_code }],
        stdin: stdin || "",
      });

      const run = response.data.run;

      let output = "⚠️ No output";
      if (run.stdout) output = run.stdout;
      else if (run.stderr) output = "❌ Runtime Error:\n" + run.stderr;

      await CodeSubmission.create({
        language,
        source_code,
        stdin,
        output,
      });

      return res.json({ output });
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Piston failed at ${url}`);
    }
  }

  console.error("❌ All Piston endpoints failed");
  res.status(500).json({
    output: "❌ Code execution failed (Piston unreachable)",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
