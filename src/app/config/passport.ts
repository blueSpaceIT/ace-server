/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthProviderType, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import config from '.';
import ApiError from '../helpers/ApiError';
import prisma from '../shared/prisma';

// 🔹 Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          include: { authProviders: true },
        });

        if (!user) {
          return done(null, false, { message: 'User does not exist' });
        }

        // Only allow ACTIVE users to login
        if (user.status !== UserStatus.ACTIVE) {
          if (user.status === UserStatus.PENDING) {
            return done(null, false, {
              message:
                'Account not verified. Please verify your email with the OTP sent or request a new OTP.',
            });
          } else {
            return done(null, false, {
              message: `Account status is ${user.status}. Only ACTIVE accounts can login.`,
            });
          }
        }

        if (user.isDeleted) {
          return done(null, false, { message: 'User is deleted' });
        }

        const isGoogleAuthenticated = user.authProviders.some(
          (auth) => auth.provider === AuthProviderType.GOOGLE,
        );

        if (isGoogleAuthenticated && !user.password) {
          return done(null, false, {
            message:
              'You signed up with Google. Please log in with Google first and set a password to use email/password login.',
          });
        }

        const isPasswordMatched = await bcrypt.compare(
          password,
          user.password as string,
        );

        if (!isPasswordMatched) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        console.error('LocalStrategy Error:', error);
        return done(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Authentication failed',
          ),
        );
      }
    },
  ),
);

// 🔹 Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: 'No email found from Google' });
        }

        let user = await prisma.user.findUnique({
          where: { email },
          include: { authProviders: true },
        });

        if (user) {
          // Only allow ACTIVE users to login
          if (user.status !== UserStatus.ACTIVE) {
            if (user.status === UserStatus.PENDING) {
              return done(null, false, {
                message:
                  'Account not verified. Please verify your email with the OTP sent or request a new OTP.',
              });
            } else {
              return done(null, false, {
                message: `Account status is ${user.status}. Only ACTIVE accounts can login.`,
              });
            }
          }

          if (user.isDeleted) {
            return done(null, false, { message: 'User is deleted' });
          }
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || 'Unknown User',
              picture: profile.photos?.[0]?.value,
              userRole: UserRole.STUDENT,
              status: UserStatus.ACTIVE,
              emailVerified: true,
              authProviders: {
                create: {
                  provider: AuthProviderType.GOOGLE,
                  providerId: profile.id,
                },
              },
            },
            include: { authProviders: true },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('GoogleStrategy Error:', error);
        return done(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Google authentication failed',
          ),
        );
      }
    },
  ),
);

// 🔹 Serialize / Deserialize
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { authProviders: true },
    });
    if (!user) {
      return done(new ApiError(StatusCodes.NOT_FOUND, 'User not found'));
    }
    done(null, user);
  } catch (error) {
    console.error('Deserialize Error:', error);
    done(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to deserialize user',
      ),
    );
  }
});

export default passport;
