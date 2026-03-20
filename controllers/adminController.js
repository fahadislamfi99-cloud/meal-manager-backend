const jwt = require('jsonwebtoken');
const Mess = require('../models/Mess');
const Coupon = require('../models/Coupon');
const AdminSetting = require('../models/AdminSetting'); // 🚀 নতুন লাইন

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

        // আনব্লক করলে তাকে আবার "Active" স্টেটে ফ্রি মোডে ফিরিয়ে দেওয়া হবে
        mess.subscriptionStatus = 'active';
        mess.trialEndsAt = null; 
        await mess.save();

        res.status(200).json({ success: true, message: 'Mess Unblocked! তারা এখন আবার অ্যাপ ব্যবহার করতে পারবে।' });
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