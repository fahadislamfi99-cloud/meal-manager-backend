const jwt = require('jsonwebtoken');
const Mess = require('../models/Mess');
const Coupon = require('../models/Coupon');
const AdminSetting = require('../models/AdminSetting'); // 🚀 নতুন লাইন
const Transaction = require('../models/Transaction');

// ১. সুপার অ্যাডমিন লগিন (শুধু আপনি ঢুকতে পারবেন)
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;
    
    // আপনার .env ফাইলের সিক্রেট ক্রেডেনশিয়াল দিয়ে চেক করবে
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        // সুপার অ্যাডমিন টোকেন তৈরি (যা অন্য কারো কাছে থাকবে না)
        const token = jwt.sign({ id: 'superadmin123', role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({ success: true, token, message: 'Welcome back, Boss!' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid Admin Credentials!' });
    }
};

// ২. সব মেসের লিস্ট দেখা (ড্যাশবোর্ডের জন্য)
exports.getAllMesses = async (req, res) => {
    try {
        const messes = await Mess.find().select('-managerPin'); // সিকিউরিটির জন্য পিন বাদে সব আনবে
        res.status(200).json({ success: true, totalMesses: messes.length, data: messes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching messes' });
    }
};

// ৩. গ্লোবাল ম্যাজিক সুইচ (Free vs Subscription)
exports.toggleGlobalSubscription = async (req, res) => {
    try {
        const { isSubscriptionOn } = req.body; 
        
        if (isSubscriptionOn) {
            // সাবস্ক্রিপশন অন করলে সবার ২০ দিনের ট্রায়াল শুরু হবে
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 20); 

            await Mess.updateMany({}, { 
                subscriptionStatus: 'trial', 
                trialEndsAt: trialEndsAt 
            });

            res.status(200).json({ success: true, message: 'Subscription Mode ON! All messes got 20 days trial.' });
        } else {
            // 🚀 ম্যাজিক: ফ্রি করে দিলে ডেট null হয়ে যাবে এবং স্ট্যাটাস active হবে
            await Mess.updateMany({}, { 
                subscriptionStatus: 'active', 
                trialEndsAt: null 
            });

            res.status(200).json({ success: true, message: 'App is now 100% FREE for everyone!' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating global status' });
    }
};

// ৪. নতুন কুপন তৈরি করা
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountAmount, discountType } = req.body;
        const newCoupon = new Coupon({ code, discountAmount, discountType });
        await newCoupon.save();
        res.status(201).json({ success: true, message: 'Coupon created successfully!', data: newCoupon });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error! Maybe this coupon code already exists.' });
    }
};

// ৫. সাবস্ক্রিপশন ক্যানসেল বা মেস ব্লক করা
exports.cancelSubscription = async (req, res) => {
    try {
        const { messId } = req.params;
        const mess = await Mess.findById(messId);
        
        if(!mess) return res.status(404).json({ success: false, message: 'Mess not found' });

        // ট্রায়াল ডেট গতকালের তারিখে সেট করে দেওয়া হচ্ছে, যাতে লগিন করলেই এক্সপায়ারড দেখায় এবং লক হয়ে যায়!
        mess.subscriptionStatus = 'trial';
        mess.trialEndsAt = new Date(Date.now() - 86400000); 
        await mess.save();

        res.status(200).json({ success: true, message: 'Subscription Cancelled! App is now locked for this mess.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error cancelling subscription' });
    }
};

// ৬. মেস আনব্লক করা (Unblock)
exports.unblockMess = async (req, res) => {
    try {
        const { messId } = req.params;
        const mess = await Mess.findById(messId);
        
        if(!mess) return res.status(404).json({ success: false, message: 'Mess not found' });

        // 🚀 ম্যাজিক ফিক্স: আনব্লক করলে তাকে Free Lifetime না দিয়ে, পেমেন্ট করার জন্য ২৪ ঘণ্টার Grace Period (সুযোগ) দেওয়া হলো!
        mess.subscriptionStatus = 'trial';
        
        const gracePeriod = new Date();
        gracePeriod.setDate(gracePeriod.getDate() + 1); // বর্তমান সময়ের সাথে ১ দিন (২৪ ঘণ্টা) যোগ করা হলো
        mess.trialEndsAt = gracePeriod; 
        
        await mess.save();

        res.status(200).json({ success: true, message: 'Mess Unblocked! পেমেন্ট করার জন্য তাদের ২৪ ঘণ্টা সময় দেওয়া হয়েছে।' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during unblock' });
    }
};

// ৭. গ্লোবাল প্রাইস দেখা (সবাই দেখতে পারবে)
exports.getPricing = async (req, res) => {
    try {
        let settings = await AdminSetting.findOne();
        if (!settings) {
            settings = await AdminSetting.create({ monthlyPrice: 99, yearlyPrice: 999 });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching price' });
    }
};

// ৮. গ্লোবাল প্রাইস আপডেট করা (শুধু সুপার অ্যাডমিন পারবে)
exports.updatePricing = async (req, res) => {
    try {
        const { monthlyPrice, yearlyPrice } = req.body;
        let settings = await AdminSetting.findOne();
        
        if (!settings) {
            settings = new AdminSetting({ monthlyPrice, yearlyPrice });
        } else {
            settings.monthlyPrice = monthlyPrice;
            settings.yearlyPrice = yearlyPrice;
        }
        await settings.save();
        res.status(200).json({ success: true, message: 'Pricing updated globally!', data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating price' });
    }
};

// ৯. সব কুপন দেখা
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching coupons' });
    }
};

// ১০. সব ট্রানজেকশন লোড করা (ইমেইল সহ)
exports.getAllTransactions = async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const Mess = require('../models/Mess');

        const transactions = await Transaction.find().sort({ date: -1 }).lean(); 

        // 🚀 ম্যাজিক: প্রতিটি ট্রানজেকশনের সাথে মেসের ইমেইল খুঁজে যুক্ত করা হচ্ছে
        const updatedTransactions = await Promise.all(transactions.map(async (trx) => {
            const mess = await Mess.findById(trx.messId) || await Mess.findOne({ messName: trx.messName });
            return {
                ...trx,
                messEmail: mess ? mess.messEmail : 'Email not found'
            };
        }));

        res.status(200).json({ success: true, data: updatedTransactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching transactions' });
    }
};

// কুপন তৈরি করা (লিমিট ও মেয়াদ সহ)
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountAmount, discountType, usageLimit, expiresAt } = req.body;
        
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if(existing) return res.status(400).json({ success: false, message: 'এই কুপন কোডটি আগেই তৈরি করা আছে!' });

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountAmount,
            discountType,
            usageLimit,
            expiresAt
        });

        res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating coupon' });
    }
};

// কুপন ডিলিট করা
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Coupon deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting coupon' });
    }
};

// ১১. ড্যাশবোর্ড চার্টের জন্য গত ৬ মাসের ডেটা
exports.getChartData = async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const Mess = require('../models/Mess');
        
        // ৬ মাস আগের তারিখ বের করা
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); 

        // ডেটাবেস থেকে ডেটা আনা
        const transactions = await Transaction.find({ date: { $gte: sixMonthsAgo }, status: 'Success' });
        const messes = await Mess.find({ createdAt: { $gte: sixMonthsAgo } });

        // মাসের নামগুলোর একটি ফাঁকা কাঠামো তৈরি
        const months = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push({
                month: d.getMonth(),
                year: d.getFullYear(),
                label: monthNames[d.getMonth()],
                revenue: 0,
                messes: 0
            });
        }

        // ট্রানজেকশন থেকে মাসের রেভিনিউ যোগ করা
        transactions.forEach(trx => {
            const trxDate = new Date(trx.date);
            const match = months.find(m => m.month === trxDate.getMonth() && m.year === trxDate.getFullYear());
            if (match) match.revenue += trx.amount;
        });

        // মেস থেকে মাসের নতুন রেজিস্ট্রেশন যোগ করা
        messes.forEach(mess => {
            const messDate = new Date(mess.createdAt);
            const match = months.find(m => m.month === messDate.getMonth() && m.year === messDate.getFullYear());
            if (match) match.messes += 1;
        });

        const labels = months.map(m => m.label);
        const revenueData = months.map(m => m.revenue);
        const messesData = months.map(m => m.messes);

        res.status(200).json({ success: true, labels, revenueData, messesData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching chart data' });
    }
};

// ১২. গ্লোবাল নোটিশ আপডেট করা
exports.updateGlobalNotice = async (req, res) => {
    try {
        const { notice } = req.body;
        let settings = await AdminSetting.findOne();
        
        if (!settings) {
            settings = new AdminSetting({ globalNotice: notice });
        } else {
            settings.globalNotice = notice; // নতুন নোটিশ সেট করা হলো
        }
        
        await settings.save();
        res.status(200).json({ success: true, message: 'Notice published globally!', data: settings.globalNotice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating notice' });
    }
};