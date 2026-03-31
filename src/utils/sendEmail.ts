import nodemailer from 'nodemailer';
import { EMAIL_PASSWORD, EMAIL_USER, EMAIL_HOST, EMAIL_PORT } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST || 'smtp.gmail.com',
  port: Number(EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

const sendEmail = async (to: string, subject: string, text: string) => {
  await transporter.sendMail({
    from: `"Up-cut" <${EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

export default sendEmail;
