import nodemailer from 'nodemailer';
// import { EMAIL_PASSWORD, EMAIL_USER, EMAIL_HOST, EMAIL_PORT } from '../config/env.js';

// const transporter = nodemailer.createTransport({
//   host: EMAIL_HOST || 'smtp.gmail.com',
//   port: Number(EMAIL_PORT) || 587,
//   secure: false,
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASSWORD,
//   },
// });

// const sendEmail = async (to: string, subject: string, text: string) => {
//   await transporter.sendMail({
//     from: `"Up-cut" <${EMAIL_USER}>`,
//     to,
//     subject,
//     text,
//   });
// };

// export default sendEmail;

const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    console.log(' Attempting to send email to:', to);

    console.log({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.EMAIL_USER,
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log('✅ Email sent:', info.response);
  } catch (error) {
    console.error('❌ sendEmail error:', error);
    throw error;
  }
};
export default sendEmail;
