const mongoose = require("mongoose");

const CodeSubmissionSchema = new mongoose.Schema({
    language_id: Number,
    source_code: String,
    stdin: String,
    output: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("CodeSubmission", CodeSubmissionSchema);
