const cron = require('node-cron');
const prisma = require('../utils/prisma');
const { sendSMS } = require('../services/smsService');

async function runDailyReminder() {
  console.log('⏰ Running daily due-date reminder job...');
  
  try {
    const today = new Date();
    // Set to start of tomorrow
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    // Set to end of tomorrow
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Find pending installments due tomorrow that haven't had a reminder sent yet
    const upcomingInstallments = await prisma.loanInstallmentSchedule.findMany({
      where: {
        due_date: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        },
        status: 'PENDING',
        reminder_sent_at: null
      },
      include: {
        loan: {
          include: {
            client: true
          }
        }
      }
    });

    console.log(`Found ${upcomingInstallments.length} installments due tomorrow for reminder.`);

    for (const installment of upcomingInstallments) {
      const client = installment.loan.client;
      if (client && client.phone) {
        const message = `প্রিয় গ্রাহক, আগামীকাল আপনার ${installment.total_due} টাকার কিস্তি পরিশোধের শেষ দিন। - MFI System`;
        
        // Try sending the SMS
        const success = await sendSMS(client.phone, message);
        
        // If successful, update the database so we don't send it again
        if (success) {
          await prisma.loanInstallmentSchedule.update({
            where: { id: installment.id },
            data: {
              reminder_sent_at: new Date()
            }
          });
          console.log(`✅ Updated reminder_sent_at for schedule ID ${installment.id}`);
        }
      }
    }

    console.log('✅ Daily due-date reminder job completed.');
  } catch (error) {
    console.error('❌ Error running daily due-date reminder job:', error);
  }
}

const axios = require('axios');

async function runSmsBalanceCheck() {
  console.log('⏰ Running daily SMS balance check...');
  try {
    const username = process.env.MIMSMS_USERNAME;
    const apikey = process.env.MIMSMS_API_KEY;
    
    if (!username || !apikey) {
      console.log('⚠️ SMS configuration missing. Skipping balance check.');
      return;
    }

    const payload = { UserName: username, Apikey: apikey };
    const res = await axios.post('https://api.mimsms.com/api/V2/BalanceCheck', payload);
    
    if (res.data && res.data.data && res.data.data.length > 0) {
      const balance = parseFloat(res.data.data[0].balance);
      console.log(`Current MIM SMS Balance: ৳${balance}`);
      
      if (balance < 50) {
        console.log('⚠️ SMS Balance is critically low!');
        // Send alert to admin
        await sendSMS('01938264923', `⚠️ Alert: MFI system SMS balance is low (৳${balance}). Please recharge soon.`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking SMS balance:', error.response ? error.response.data : error.message);
  }
}

// This function will run every day at 8:00 AM
// Format: '0 8 * * *' (Minute: 0, Hour: 8)
function initCronJobs() {
  console.log('⏳ Initializing Cron Jobs...');

  cron.schedule('0 8 * * *', runDailyReminder, {
    scheduled: true,
    timezone: "Asia/Dhaka"
  });

  cron.schedule('0 9 * * *', runSmsBalanceCheck, {
    scheduled: true,
    timezone: "Asia/Dhaka"
  });
}

module.exports = {
  initCronJobs,
  runDailyReminder,
  runSmsBalanceCheck
};
