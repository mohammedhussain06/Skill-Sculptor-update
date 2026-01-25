import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

// Local strategy for email/password login
passport.use(
	new LocalStrategy(
		{ usernameField: "email", passwordField: "password", session: false },
    async (email, password, done) => {
			try {
        const user = await User.findOne({ email: String(email).trim().toLowerCase() });
				if (!user) return done(null, false, { message: "User not found" });
				const isMatch = await bcrypt.compare(password, user.password);
				if (!isMatch) return done(null, false, { message: "Invalid credentials" });
				return done(null, user);
			} catch (err) {
				return done(err);
			}
		}
	)
);

// JWT strategy for protecting routes
passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET,
		},
		async (payload, done) => {
			try {
				const user = await User.findById(payload.id).select("_id email username");
				if (!user) return done(null, false);
				return done(null, user);
			} catch (err) {
				return done(err, false);
			}
		}
	)
);

export default passport;

