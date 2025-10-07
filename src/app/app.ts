import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import session from 'express-session';
import StatusCodes from 'http-status-codes';
import os from 'os';
import config from './config';
import './config/passport';
import passport from './config/passport';
import globalErrorHandler from './middlewares/globalErrorHandler';
import notFound from './middlewares/notFound';
import router from './routes';

const app: Application = express();

// 🔹 Middlewares and Parsers
app.set('trust proxy', 1);

// 🔹 Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }),
);

// 🔹 Session middleware (optional, remove if using stateless JWT)
app.use(
  session({
    secret: config.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

// 🔹 Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// 🔹 Health check route
app.get('/', (req: Request, res: Response) => {
  const currentDateTime = new Date().toISOString();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const serverHostname = os.hostname();
  const serverPlatform = os.platform();
  const serverUptime = os.uptime();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Welcome to Ace Language Server 🎉',
    version: '1.0.0',
    clientDetails: {
      ipAddress: clientIp,
      accessedAt: currentDateTime,
    },
    serverDetails: {
      hostname: serverHostname,
      platform: serverPlatform,
      uptime: `${Math.floor(serverUptime / 60 / 60)} hours ${Math.floor((serverUptime / 60) % 60)} minutes`,
    },
    developerContact: {
      email: 'mrshakilhossain@outlook.com',
      website: 'https://shakil-tawny.vercel.app',
      developedBy: 'BlueSpaceIT',
    },
  });
});

// 🔹 Routes
app.use('/api/v1', router);

// 🔹 Error handling
app.use(notFound);
app.use(globalErrorHandler);

export default app;
