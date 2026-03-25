const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    // মেস আইডি (ডুপ্লিকেট মুছে ক্লিন করা হয়েছে)
    messId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mess',
        required: [true, 'Mess ID is required']
    },
    
    // 🔐 পাবলিক শেয়ার লিংকের সিক্রেট কোড
    shareToken: { type: String, default: () => Math.random().toString(36).substring(2, 10) },

    // 💰 সাবস্ক্রিপশন প্রাইস (Super Admin কন্ট্রোল করবে) - 🚀 নতুন যোগ করা হলো
    monthlyPrice: { type: Number, default: 99 },
    yearlyPrice: { type: Number, default: 999 },

    // 🧮 মিল রেট এবং অন্যান্য সেটিংস
    calcMode: { type: String, default: '' },
    rateBreakfast: { type: Number, default: 30 },
    rateLunch: { type: Number, default: 60 },
    rateDinner: { type: Number, default: 50 },
    rateSehri: { type: Number, default: 40 },
    rateIftar: { type: Number, default: 50 },

    periodStart: { type: String, default: '' },
    periodEnd: { type: String, default: '' },

    // 🌐 ম্যাজিক: গ্লোবাল কন্ট্রোলের জন্য নতুন ফিল্ড
    showBazarReport: { type: Boolean, default: true }
});

module.exports = mongoose.model('Setting', settingSchema);