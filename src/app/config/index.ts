/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

type NodeEnv = 'development' | 'production';

interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: NodeEnv;
  BCRYPT_SALT_ROUND: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES: string;
  JWT_RESET_PASS_SECRET: string;
  JWT_RESET_PASS_SECRET_EXPIRES: string;
  EXPRESS_SESSION_SECRET: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CALLBACK_URL: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  FRONTEND_URL: string;
  COMPANY_NAME: string;
  SUPPORT_EMAIL: string;
  SSL: {
    STORE_ID: string;
    STORE_PASS: string;
    SSL_PAYMENT_API: string;
    SSL_VALIDATION_API: string;
    SSL_SUCCESS_FRONTEND_URL: string;
    SSL_FAIL_FRONTEND_URL: string;
    SSL_CANCEL_FRONTEND_URL: string;
    SSL_SUCCESS_BACKEND_URL: string;
    SSL_FAIL_BACKEND_URL: string;
    SSL_CANCEL_BACKEND_URL: string;
    SSL_IPN_URL: string;
  };
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  EMAIL_SENDER: {
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_PORT: string;
    SMTP_HOST: string;
    SMTP_FROM: string;
  };
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_USERNAME: string;
  REDIS_PASSWORD: string;
}

const requiredEnvVariables: (keyof EnvConfig | string)[] = [
  'PORT',
  'DATABASE_URL',
  'NODE_ENV',
  'BCRYPT_SALT_ROUND',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRES',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES',
  'JWT_RESET_PASS_SECRET',
  'JWT_RESET_PASS_SECRET_EXPIRES',
  'EXPRESS_SESSION_SECRET',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CALLBACK_URL',
  'SUPER_ADMIN_EMAIL',
  'SUPER_ADMIN_PASSWORD',
  'FRONTEND_URL',
  'COMPANY_NAME',
  'SUPPORT_EMAIL',
  'SSL_STORE_ID',
  'SSL_STORE_PASS',
  'SSL_PAYMENT_API',
  'SSL_VALIDATION_API',
  'SSL_SUCCESS_FRONTEND_URL',
  'SSL_FAIL_FRONTEND_URL',
  'SSL_CANCEL_FRONTEND_URL',
  'SSL_SUCCESS_BACKEND_URL',
  'SSL_FAIL_BACKEND_URL',
  'SSL_CANCEL_BACKEND_URL',
  'SSL_IPN_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_PORT',
  'SMTP_HOST',
  'SMTP_FROM',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_USERNAME',
  'REDIS_PASSWORD',
];

requiredEnvVariables.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const config: EnvConfig = {
  PORT: process.env.PORT!,
  DATABASE_URL: process.env.DATABASE_URL!,
  NODE_ENV: process.env.NODE_ENV as NodeEnv,
  BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES!,
  JWT_RESET_PASS_SECRET: process.env.JWT_RESET_PASS_SECRET!,
  JWT_RESET_PASS_SECRET_EXPIRES: process.env.JWT_RESET_PASS_SECRET_EXPIRES!,
  EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL!,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  COMPANY_NAME: process.env.COMPANY_NAME!,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL!,
  SSL: {
    STORE_ID: process.env.SSL_STORE_ID!,
    STORE_PASS: process.env.SSL_STORE_PASS!,
    SSL_PAYMENT_API: process.env.SSL_PAYMENT_API!,
    SSL_VALIDATION_API: process.env.SSL_VALIDATION_API!,
    SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL!,
    SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL!,
    SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL!,
    SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL!,
    SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL!,
    SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL!,
    SSL_IPN_URL: process.env.SSL_IPN_URL!,
  },
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  },
  EMAIL_SENDER: {
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    SMTP_PORT: process.env.SMTP_PORT!,
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_FROM: process.env.SMTP_FROM!,
  },
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: process.env.REDIS_PORT!,
  REDIS_USERNAME: process.env.REDIS_USERNAME!,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD!,
};

export default config;
