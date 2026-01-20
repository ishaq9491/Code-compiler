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

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Judge0 CE via RapidAPI
const JUDGE0_BASE_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_SUBMIT_URL = `${JUDGE0_BASE_URL}/submissions/?wait=false`;
const JUDGE0_GET_URL = `${JUDGE0_BASE_URL}/submissions/`;


// Your RapidAPI key
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Run Code Endpoint
app.post("/run-code", async (req, res) => {
    const { language_id, source_code, stdin } = req.body;

    if (!language_id || !source_code) {
        return res.status(400).json({ output: "❌ Missing fields" });
    }

    try {
        const submissionRes = await axios.post(
            JUDGE0_SUBMIT_URL,
            {
                language_id,
                source_code,
                stdin: stdin || "",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-RapidAPI-Key": RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                },
            }
        );

        const token = submissionRes.data.token;

        let result = null;
        for (let i = 0; i < 15; i++) {
            const statusRes = await axios.get(
                `${JUDGE0_GET_URL}${token}`,
                {
                    headers: {
                        "X-RapidAPI-Key": RAPIDAPI_KEY,
                        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                    },
                }
            );

            if (statusRes.data.status.id <= 2) {
                await new Promise(r => setTimeout(r, 1000));
            } else {
                result = statusRes.data;
                break;
            }
        }

        if (!result) {
            return res.status(504).json({ output: "⚠️ Timeout" });
        }

        let output = "⚠️ No output";
        if (result.stdout) output = result.stdout;
        else if (result.stderr) output = "❌ Runtime Error:\n" + result.stderr;
        else if (result.compile_output) output = "❌ Compilation Error:\n" + result.compile_output;

        await CodeSubmission.create({
            language_id,
            source_code,
            stdin,
            output,
        });

        res.json({ output });
    } catch (err) {
        console.error("Judge0 error:", err.response?.data || err.message);
        res.status(500).json({ output: "❌ Code execution failed" });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
