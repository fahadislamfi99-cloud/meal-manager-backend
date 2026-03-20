const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // ১. ট্রান্সপোর্টার তৈরি (যে মেইল পাঠাবে)
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // ২. মেইলের অপশন সেটআপ
    const mailOptions = {
        from: 'Mess Manager Team <no-reply@messmanager.com>',
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // ৩. মেইল পাঠানো
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;