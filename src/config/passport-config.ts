import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getEnv } from "./env";
import { prisma } from "../lib/prisma";
import { AuthRepository } from "../modules/auth/auth.repository";

const authRepo = new AuthRepository();
const { getUserByGoogleId, getUserByEmail, createUser, updateUser } = authRepo;

interface JwtPayload {
  id: string;
}

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: getEnv("JWT_SECRET"),
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: jwt_payload.id },
      });

      const data = {
        id: user?.id,
        name: user?.fullName,
        email: user?.email,
        avatar: user?.avatar,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      };

      if (user) return done(null, data);
      return done(null, false);
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
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async function (_accessToken, _refreshToken, profile, done) {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0].value || "";
        const name = profile.displayName;
        const image = profile.photos?.[0].value;

        const existingUserByGoogleId = await getUserByGoogleId(googleId);
        if (existingUserByGoogleId) return done(null, existingUserByGoogleId);

        const existingUserByEmail = await getUserByEmail(
          email.toLowerCase() || "",
        );
        if (existingUserByEmail) {
          const values = {
            googleId,
            ...(!existingUserByEmail.avatar && { avatar: image }),
            ...(!existingUserByEmail.fullName && { fullName: name }),
            isVerified: true,
          };
          const updatedUser = await updateUser(existingUserByEmail.id, values);
          return done(null, updatedUser);
        }

        const values = {
          googleId,
          email,
          fullName: name,
          avatar: image,
        };

        const newUser = await createUser(values);
        return done(null, newUser);
      } catch (err) {
        console.error("Google OAuth error:", err);
        done(err);
      }
    },
  ),
);

export default passport;
