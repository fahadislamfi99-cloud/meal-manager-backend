const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
    
    // 🔐 পাবলিক শেয়ার লিংকের সিক্রেট কোড
    shareToken: { type: String, default: () => Math.random().toString(36).substring(2, 10) },

    calcMode: { type: String, default: 'average' },
    rateBreakfast: { type: Number, default: 30 },
    rateLunch: { type: Number, default: 60 },
    rateDinner: { type: Number, default: 50 },
    rateSehri: { type: Number, default: 40 },
    rateIftar: { type: Number, default: 50 },

    periodStart: { type: String, default: '' },
    periodEnd: { type: String, default: '' },

    messId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mess',
        required: [true, 'Mess ID is required']
    },

    // 🌐 ম্যাজিক: গ্লোবাল কন্ট্রোলের জন্য নতুন ফিল্ড
    showBazarReport: { type: Boolean, default: true }
});

module.exports = mongoose.model('Setting', settingSchema);