const axios = require('axios');

const sendEmail = async (options) => {
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                // 🚀 ম্যাজিক ফিক্স ১: এখানে 'hello@...' এর বদলে আপনার Brevo অ্যাকাউন্টের আসল জিমেইলটি দিন
                sender: { name: 'Meal Manager Team', email: 'fahadislam.fi.99@gmail.com' }, // <-- আপনার জিমেইলটি ঠিক আছে কি না দেখে নিন
                
                // কাকে মেইল পাঠানো হচ্ছে (to)
                to: [{ email: options.email }],
                
                // মেইলের সাবজেক্ট এবং বডি
                subject: options.subject,
                htmlContent: options.message
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY, 
                    'content-type': 'application/json'
                }
            }
        );
        console.log("✅ Brevo Email Sent Successfully!");
    } catch (error) {
        console.error("❌ Brevo Email Error:", error.response ? JSON.stringify(error.response.data) : error.message);
        // 🚀 ম্যাজিক ফিক্স ২: এরর হলে এখন আর ফ্রন্টএন্ডে "Success" দেখাবে না!
        throw new Error('Email sending failed'); 
    }
};

module.exports = sendEmail;