const axios = require('axios');

const sendEmail = async (options) => {
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                // কে মেইল পাঠাচ্ছে (from)
                sender: { name: 'Mess Manager Team', email: 'hello@messmanager.com' },
                // কাকে মেইল পাঠানো হচ্ছে (to)
                to: [{ email: options.email }],
                // মেইলের সাবজেক্ট এবং বডি
                subject: options.subject,
                htmlContent: options.message
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY, // 🚀 আপনার গোপন API Key
                    'content-type': 'application/json'
                }
            }
        );
        console.log("✅ Brevo Email Sent Successfully!", response.data);
    } catch (error) {
        console.error("❌ Brevo Email Error:", error.response ? error.response.data : error.message);
    }
};

module.exports = sendEmail;