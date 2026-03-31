import nodemailer from 'nodemailer';
import { EMAIL_PASSWORD, EMAIL_USER, EMAIL_HOST, EMAIL_PORT } from '../config/env.js';
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

// Create transporter (handles sending)
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST || 'smtp.gmail.com',
  port: Number(EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
  tls: {
    family: 4, // force IPv4
  },
} as SMTPTransport.Options);

// Create function to send emails
const sendEmail = async (to: string, subject: string, text: string) => {
  await transporter.sendMail({
    from: `"Up-cut" <${EMAIL_USER}>`, // sender name and email
    to,
    subject,
    text,
  });
};

export default sendEmail;
