const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[EmailService] SMTP transporter initialized.');
    } catch (err) {
      console.warn('[EmailService] Failed to initialize SMTP:', err.message);
      transporter = null;
    }
  } else {
    // Email is optional, in-app notifications are primary
    transporter = null;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    // SMTP not configured - gracefully skip
    return { success: false, skipped: true, message: 'SMTP not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Smart Library" <noreply@smartlibrary.edu>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
};

