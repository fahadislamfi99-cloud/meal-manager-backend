const cron = require('node-cron');
const Mess = require('../models/Mess');
const sendEmail = require('./sendEmail'); // আপনার বানানো Brevo API

const startCronJobs = () => {
    // ⏰ প্রতিদিন রাত ১২টা ১মিনিটে এই কোড একা একা রান করবে ('1 0 * * *')
    cron.schedule('1 0 * * *', async () => {
        console.log("⏳ Running daily subscription check (Cron Job)...");
        try {
            const today = new Date();
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + 3); // ৩ দিন পরের তারিখ

            // এমন সব মেস খুঁজে বের করবে যাদের মেয়াদ ঠিক ৩ দিন পর শেষ হবে
            const messesToRemind = await Mess.find({
                subscriptionStatus: { $in: ['trial', 'active'] }, // ট্রায়াল বা প্রিমিয়াম যাই হোক না কেন
                trialEndsAt: {
                    $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    $lte: new Date(targetDate.setHours(23, 59, 59, 999))
                }
            });

            if (messesToRemind.length > 0) {
                console.log(`📨 Found ${messesToRemind.length} messes expiring in 3 days. Sending emails...`);
                
                for (const mess of messesToRemind) {
                    const emailHTML = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                            <h2 style="color: #f59e0b; text-align: center;">Subscription Alert ⏳</h2>
                            <p>Hello <strong>${mess.messName}</strong>,</p>
                            <p>This is a gentle reminder that your Mess Manager App subscription will expire in exactly <strong>3 Days</strong>.</p>
                            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                                <p style="margin: 5px 0; color: #92400e;">To ensure uninterrupted access to all premium features, please log in to your dashboard and upgrade your plan.</p>
                            </div>
                            <p>If you have already renewed, please ignore this email.</p>
                            <br>
                            <p style="color: #64748b; font-size: 14px;">Regards,<br><strong>Mess Manager Team</strong></p>
                        </div>
                    `;

                    await sendEmail({
                        email: mess.messEmail,
                        subject: 'Action Required: Your Subscription Expires in 3 Days',
                        message: emailHTML
                    });
                }
                console.log("✅ All reminder emails sent successfully!");
            } else {
                console.log("👍 No subscriptions expiring in exactly 3 days.");
            }
        } catch (error) {
            console.error("❌ Cron Job Error:", error);
        }
    });
};

module.exports = startCronJobs;