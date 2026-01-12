import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: Date,
  type: { type: String, enum: ["signup", "forgot"] }
});

export default mongoose.model("Otp", otpSchema);