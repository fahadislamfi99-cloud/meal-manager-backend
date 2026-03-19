const axios = require('axios');
const Mess = require('../models/Mess'); // আপনার মেস মডেল

// ১. বিকাশের টোকেন জেনারেট করার ফাংশন
const getBkashToken = async () => {
    try {
        const { data } = await axios.post(`${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
            app_key: process.env.BKASH_APP_KEY,
            app_secret: process.env.BKASH_APP_SECRET
        }, {
            headers: {
                username: process.env.BKASH_USERNAME,
                password: process.env.BKASH_PASSWORD
            }
        });
        return data.id_token;
    } catch (error) {
        console.error("bKash Token Error:", error.response?.data || error.message);
        throw new Error('Failed to generate bKash token');
    }
};

// ২. পেমেন্ট ক্রিয়েট করা (ইউজারকে যে লিংক দেবো)
exports.createPayment = async (req, res) => {
    try {
        const { packagePrice } = req.body; // 99 বা 999
        const messId = req.messId; // Auth Middleware থেকে আসবে

        if (![99, 999].includes(Number(packagePrice))) {
            return res.status(400).json({ success: false, message: 'ভুল প্যাকেজ সিলেক্ট করেছেন!' });
        }

        const token = await getBkashToken();
        const invoiceNo = 'Inv_' + Date.now();

        const { data } = await axios.post(`${process.env.BKASH_BASE_URL}/tokenized/checkout/create`, {
            mode: '0011',
            payerReference: messId,
            callbackURL: `https://meal-manager-backend-kp8y.onrender.com/api/payment/callback?messId=${messId}&pkg=${packagePrice}`,
            amount: packagePrice,
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: invoiceNo
        }, {
            headers: {
                Authorization: token,
                'X-APP-Key': process.env.BKASH_APP_KEY
            }
        });

        if (data && data.bkashURL) {
            res.status(200).json({ success: true, bkashURL: data.bkashURL });
        } else {
            res.status(400).json({ success: false, message: data.statusMessage || 'Payment creation failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during payment creation' });
    }
};

// ৩. পেমেন্ট কমপ্লিট হওয়ার পর বিকাশের কলব্যাক রিসিভ করা (The Magic)
exports.bkashCallback = async (req, res) => {
    const { paymentID, status, messId, pkg } = req.query;

    if (status === 'success') {
        try {
            const token = await getBkashToken();
            
            // পেমেন্টটি ভেরিফাই বা Execute করা
            const { data } = await axios.post(`${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`, {
                paymentID
            }, {
                headers: {
                    Authorization: token,
                    'X-APP-Key': process.env.BKASH_APP_KEY
                }
            });

            if (data && data.statusCode === '0000') {
                // পেমেন্ট ১০০% সফল! এবার ডাটাবেসে ইউজারের মেয়াদ বাড়িয়ে দেবো
                const mess = await Mess.findById(messId);
                
                let addDays = Number(pkg) === 999 ? 365 : 30; // ৯৯৯ টাকা হলে ১ বছর, নাহলে ৩০ দিন
                let currentExpiry = mess.trialEndsAt && new Date(mess.trialEndsAt) > new Date() ? new Date(mess.trialEndsAt) : new Date();
                
                currentExpiry.setDate(currentExpiry.getDate() + addDays);

                mess.subscriptionStatus = 'active';
                mess.trialEndsAt = currentExpiry;
                await mess.save();

                // সফল হলে ইউজারকে আপনার ফ্রন্টএন্ডের ড্যাশবোর্ডে রিডাইরেক্ট করে দেবো
                return res.redirect('https://mealmanager99.netlify.app/app.html?payment=success');
            }
        } catch (error) {
            console.error("Execute Error:", error.message);
        }
    }

    // পেমেন্ট ফেইল করলে বা ইউজার ক্যান্সেল করলে
    res.redirect('https://mealmanager99.netlify.app/app.html?payment=failed');
};