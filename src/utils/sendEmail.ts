// src/utils/sendEmail.ts
import { Resend } from 'resend';
import { RESEND_API_KEY } from '../config/env.js';

const resend = new Resend(RESEND_API_KEY);

const sendEmail = async (to: string, subject: string, html: string) => {
  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject,
    html,
  });
};

export default sendEmail;
