import nodemailer from "nodemailer";

export const sendOTP = async (email, otp, purpose) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: purpose === "signup" ? "Signup OTP" : "Reset Password OTP",
    html: `<h2>Your OTP is ${otp}</h2><p>Valid for 5 minutes</p>`,
  });
};