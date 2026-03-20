const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 🚀 ম্যাজিক ফিক্স: Render-এর IPv6 ব্লক এড়াতে কাস্টম হোস্ট এবং পোর্ট (587) বসানো হলো
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // 587 পোর্টের জন্য এটি false রাখতে হয়, তবে এটি সম্পূর্ণ নিরাপদ (TLS)
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: 'Mess Manager Team <no-reply@messmanager.com>',
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;