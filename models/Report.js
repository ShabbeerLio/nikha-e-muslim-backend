import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Resolved"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Report", reportSchema);