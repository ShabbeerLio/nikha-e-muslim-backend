import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/api/auth/google/callback",
    },
    async (_, __, profile, done) => {
      const email = profile.emails[0].value;

      const user = await User.findOne({ email });
      if (!user) return done(null, false); // ❌ no signup

      return done(null, user);
    }
  )
);

export default passport;