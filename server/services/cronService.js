const cron = require('node-cron');
const BorrowTransaction = require('../models/BorrowTransaction');
const { createNotification } = require('./notificationService');

/**
 * Format a Date object to readable Indian format (e.g., "7 Nov 2026")
 */
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
  }).format(new Date(date));
};

/**
 * Normalizes a date to start of day (midnight) in local/specified timezone for comparison
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Checks all active borrow transactions for upcoming due dates, due today, or overdue status.
 */
const checkDueDates = async () => {
  console.log(`[CronScheduler] Running automated due-date check at ${new Date().toISOString()}...`);
  try {
    const activeTransactions = await BorrowTransaction.find({
      status: { $in: ['Issued', 'Overdue'] },
      returnDate: null,
    })
      .populate('student')
      .populate('book')
      .populate('bookCopy');

    const today = startOfDay(new Date());
    let remindersCreated = 0;
    let dueTodayCreated = 0;
    let overdueCreated = 0;
    let statusUpdated = 0;

    for (const tx of activeTransactions) {
      if (!tx.student || !tx.book) continue;

      const dueDay = startOfDay(tx.dueDate);
      const diffTime = dueDay.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const todayDateStr = today.toISOString().split('T')[0];

      // 1. Reminder 3 days before due date
      if (diffDays === 3) {
        const reminderKey = `${tx._id}_DUE_3_DAYS`;
        const res = await createNotification({
          studentId: tx.student._id,
          transactionId: tx._id,
          type: 'REMINDER_DUE_SOON',
          title: 'Book Due in 3 Days',
          message: `Your book '${tx.book.title}' is due in 3 days, on ${formatDate(tx.dueDate)}.`,
          reminderKey,
          studentEmail: tx.student.email,
        });
        if (res.created) remindersCreated++;
      }

      // 2. Due Today notification
      else if (diffDays === 0) {
        const reminderKey = `${tx._id}_DUE_TODAY_${todayDateStr}`;
        const res = await createNotification({
          studentId: tx.student._id,
          transactionId: tx._id,
          type: 'DUE_TODAY',
          title: 'Book Due Today',
          message: `Your book '${tx.book.title}' is due today. Please return it to the library.`,
          reminderKey,
          studentEmail: tx.student.email,
        });
        if (res.created) dueTodayCreated++;
      }

      // 3. Overdue notification
      else if (diffDays < 0) {
        const daysOverdue = Math.abs(diffDays);

        // Update transaction status to Overdue if not already marked
        if (tx.status !== 'Overdue') {
          tx.status = 'Overdue';
          await tx.save();
          statusUpdated++;
        }

        // Overdue notification sent daily or when overdue
        const reminderKey = `${tx._id}_OVERDUE_${daysOverdue}_DAYS`;
        const res = await createNotification({
          studentId: tx.student._id,
          transactionId: tx._id,
          type: 'OVERDUE',
          title: 'Book Overdue Alert',
          message: `Your book '${tx.book.title}' is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}. Please return it as soon as possible.`,
          reminderKey,
          studentEmail: tx.student.email,
        });
        if (res.created) overdueCreated++;
      }
    }

    console.log(
      `[CronScheduler] Check completed: Checked ${activeTransactions.length} active transactions. ` +
        `Reminders: ${remindersCreated}, Due Today: ${dueTodayCreated}, Overdue Alerts: ${overdueCreated}, Statuses Updated: ${statusUpdated}.`
    );

    return {
      success: true,
      totalChecked: activeTransactions.length,
      remindersCreated,
      dueTodayCreated,
      overdueCreated,
      statusUpdated,
    };
  } catch (error) {
    console.error('[CronScheduler] Error during scheduled due date check:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Initializes the node-cron scheduler.
 */
const initCronScheduler = () => {
  // Default: runs at the 0th minute of every hour ('0 * * * *')
  const schedulePattern = process.env.CRON_SCHEDULE || '0 * * * *';

  cron.schedule(schedulePattern, async () => {
    await checkDueDates();
  });

  console.log(`[CronScheduler] Background due-date checker scheduled with pattern: "${schedulePattern}"`);
};

module.exports = {
  initCronScheduler,
  checkDueDates,
};

