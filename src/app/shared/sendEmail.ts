import ejs from 'ejs';
import nodemailer from 'nodemailer';
import path from 'path';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: config.EMAIL_SENDER.SMTP_USER,
    pass: config.EMAIL_SENDER.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const renderTemplate = async (
  templateName: string,
  data: Record<string, any> = {},
) => {
  const templatePath = path.join(__dirname, '../../templates', templateName);
  const templateData = {
    ...data,
    frontendUrl: config.FRONTEND_URL,
    supportEmail: config.SUPPORT_EMAIL,
    companyName: config.COMPANY_NAME,
  };

  return ejs.renderFile(templatePath, templateData);
};

const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"${config.COMPANY_NAME}" <${config.EMAIL_SENDER.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export default {
  send: sendEmail,
  renderTemplate,
};
