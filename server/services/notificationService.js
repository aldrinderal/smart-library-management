const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

/**
 * Create an in-app notification with deduplication support.
 * If reminderKey is provided and an existing notification with that key exists, it skips creation.
 */
const createNotification = async ({
  studentId,
  transactionId = null,
  type = 'INFO',
  title,
  message,
  reminderKey = null,
  studentEmail = null,
}) => {
  try {
    if (reminderKey) {
      const existing = await Notification.findOne({ reminderKey });
      if (existing) {
        return { created: false, message: 'Notification already exists for this reminder stage.' };
      }
    }

    const notification = await Notification.create({
      student: studentId,
      transaction: transactionId,
      type,
      title,
      message,
      reminderKey: reminderKey || undefined,
    });

    // Optional email dispatch if email is available
    if (studentEmail) {
      sendEmail({
        to: studentEmail,
        subject: `[Library Notice] ${title}`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Smart Library Management System</h2>
            <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #0f172a;">${title}</h3>
              <p style="color: #334155; line-height: 1.6; font-size: 15px;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
              This is an automated library notification. Please check your student portal for more details.
            </p>
          </div>
        `,
      }).catch((err) => {
        console.warn('[NotificationService] Email send error ignored:', err.message);
      });
    }

    return { created: true, notification };
  } catch (error) {
    // If duplicate key error occurs during race condition, handle gracefully
    if (error.code === 11000) {
      return { created: false, message: 'Duplicate reminder key skipped.' };
    }
    console.error('[NotificationService] Error creating notification:', error.message);
    throw error;
  }
};

module.exports = {
  createNotification,
};

