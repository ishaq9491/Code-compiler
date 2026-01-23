const mongoose = require("mongoose");

const CodeSubmissionSchema = new mongoose.Schema({
  language: String,
  source_code: String,
  stdin: String,
  output: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CodeSubmission", CodeSubmissionSchema);
