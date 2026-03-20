const axios = require('axios');
const Mess = require('../models/Mess'); 
const Coupon = require('../models/Coupon'); // 🚀 নতুন: কুপন ডাটাবেস ইমপোর্ট করা হলো
const AdminSetting = require('../models/AdminSetting');

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
        throw new Error('Failed to generate bKash token');
    }
};

// ২. পেমেন্ট ক্রিয়েট করা (এখানে কুপনের আসল ম্যাজিক হবে)
exports.createPayment = async (req, res) => {
    try {
        const { packagePrice, promoCode } = req.body; // 🚀 ফ্রন্টএন্ড থেকে প্রোমো কোড রিসিভ করা হলো
        const messId = req.messId;

        const originalPrice = Number(packagePrice);
        
        // 🚀 ডাটাবেস থেকে বর্তমান আসল দাম নিয়ে আসা হচ্ছে
        const pricing = await AdminSetting.findOne() || { monthlyPrice: 99, yearlyPrice: 999 };
        const validPrices = [pricing.monthlyPrice, pricing.yearlyPrice];

        if (!validPrices.includes(originalPrice)) {
            return res.status(400).json({ success: false, message: 'ভুল প্যাকেজ সিলেক্ট করেছেন!' });
        }

        let finalAmount = originalPrice;

        // 🎟️ কুপন ভ্যালিডেশন এবং ডিসকাউন্ট হিসাব
        if (promoCode) {
            const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true });
            
            if (!coupon) {
                return res.status(400).json({ success: false, message: 'ভুল বা মেয়াদোত্তীর্ণ প্রোমো কোড!' });
            }

            // ডিসকাউন্ট কাটাকাটি
            if (coupon.discountType === 'flat') {
                finalAmount -= coupon.discountAmount;
            } else if (coupon.discountType === 'percentage') {
                finalAmount -= (finalAmount * coupon.discountAmount) / 100;
            }

            // পেমেন্ট যেন নেগেটিভ বা শূন্য না হয় (বিকাশের মিনিমাম লিমিট ১ টাকা)
            if (finalAmount < 1) finalAmount = 1;
        }

        const token = await getBkashToken();
        const invoiceNo = 'Inv_' + Date.now();

        const { data } = await axios.post(`${process.env.BKASH_BASE_URL}/tokenized/checkout/create`, {
            mode: '0011',
            payerReference: messId,
            // 💡 নোটিশ: কলব্যাক লিংকে আমরা আসল দাম (originalPrice) পাঠাচ্ছি, যাতে পেমেন্ট শেষে মেয়াদ ঠিকমতো বাড়ে
            callbackURL: `https://meal-manager-backend-kp8y.onrender.com/api/payment/callback?messId=${messId}&pkg=${originalPrice}`,
            amount: finalAmount, // 💡 কিন্তু বিকাশে কাটবে ডিসকাউন্ট করা দাম (finalAmount)
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: invoiceNo
        }, {
            headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY }
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

// ৩. পেমেন্ট কলব্যাক (আগের মতোই থাকবে)
exports.bkashCallback = async (req, res) => {
    const { paymentID, status, messId, pkg } = req.query;

    if (status === 'success') {
        try {
            const token = await getBkashToken();
            const { data } = await axios.post(`${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`, { paymentID }, {
                headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY }
            });

            if (data && data.statusCode === '0000') {
                const mess = await Mess.findById(messId);
                let addDays = Number(pkg) === 999 ? 365 : 30; 
                let currentExpiry = mess.trialEndsAt && new Date(mess.trialEndsAt) > new Date() ? new Date(mess.trialEndsAt) : new Date();
                
                currentExpiry.setDate(currentExpiry.getDate() + addDays);

                mess.subscriptionStatus = 'active';
                mess.trialEndsAt = currentExpiry;
                await mess.save();

                return res.redirect('https://mealmanager99.netlify.app/app.html?payment=success');
            }
        } catch (error) {
            console.error("Execute Error:", error.message);
        }
    }
    res.redirect('https://mealmanager99.netlify.app/app.html?payment=failed');
};

// ৪. কুপন ভেরিফাই করা (পেমেন্টের আগে চেক করে ডিসকাউন্ট দেখানোর জন্য)
exports.verifyCoupon = async (req, res) => {
    try {
        const { promoCode, packagePrice } = req.body;
        const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(400).json({ success: false, message: 'Invalid or expired promo code!' });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'flat') {
            discountAmount = coupon.discountAmount;
        } else if (coupon.discountType === 'percentage') {
            discountAmount = (packagePrice * coupon.discountAmount) / 100;
        }

        let finalPrice = packagePrice - discountAmount;
        if (finalPrice < 1) finalPrice = 1; // বিকাশে মিনিমাম ১ টাকা কাটতে হয়

        res.status(200).json({
            success: true,
            discountAmount,
            finalPrice,
            message: 'Promo applied successfully!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error verifying coupon' });
    }
};