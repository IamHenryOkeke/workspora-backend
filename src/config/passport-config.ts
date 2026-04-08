import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getEnv } from "./env";
import { AuthRepository } from "../modules/auth/auth.repository";
import { JwtPayload } from "../types/auth";

const authRepo = new AuthRepository();

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: getEnv("JWT_SECRET"),
};

const toUserData = (user: {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null | undefined;
  isVerified: boolean;
}) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  avatar: user.avatar,
  isVerified: user.isVerified,
});

passport.use(
  new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
    try {
      const user = await authRepo.getUserById(jwt_payload.id);
      if (!user) return done(null, false);
      return done(null, toUserData(user));
    } catch (error) {
      return done(error, false);
    }
  }),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
      callbackURL: getEnv("GOOGLE_CALLBACK_URL"),
    },
    async function (_accessToken, _refreshToken, profile, done) {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0].value || "";
        const fullName = profile.displayName;
        const image = profile.photos?.[0].value;
        const isVerified = profile.emails?.[0].verified === true;

        const existingUserByGoogleId =
          await authRepo.getUserByGoogleId(googleId);
        if (existingUserByGoogleId) {
          return done(null, toUserData(existingUserByGoogleId));
        }

        const existingUserByEmail = await authRepo.getUserByEmail(
          email.toLowerCase(),
        );

        if (existingUserByEmail) {
          const values = {
            googleId,
            ...(!existingUserByEmail.avatar && { avatar: image }),
            ...(!existingUserByEmail.fullName && { fullName }),
            ...(!existingUserByEmail.isVerified && { isVerified }),
          };
          const updatedUser = await authRepo.updateUser(
            existingUserByEmail.id,
            values,
          );
          return done(null, toUserData(updatedUser));
        }
        const values = {
          googleId,
          email,
          fullName,
          avatar: image,
          isVerified,
        };
        const newUser = await authRepo.createUser(values);
        return done(null, toUserData(newUser));
      } catch (err) {
        console.error("Google OAuth error:", err);
        done(err);
      }
    },
  ),
);

export default passport;
