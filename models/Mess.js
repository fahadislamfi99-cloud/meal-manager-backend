const mongoose = require('mongoose');

const messSchema = new mongoose.Schema({
    messName: { 
        type: String, 
        required: true,
        trim: true
    },
    messEmail: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true
    },
    managerPin: { 
        type: String, 
        required: true
    },
    subscriptionStatus: { 
        type: String, 
        enum: ['trial', 'active', 'expired'], 
        default: 'trial' 
    },
    trialEndsAt: { 
        type: Date,
        default: () => new Date(+new Date() + 14 * 24 * 60 * 60 * 1000) 
    },
    
    // 👇 Forgot PIN (OTP) সেভ করার জন্য নতুন দুটি ফিল্ড
    resetOtp: { 
        type: String, 
        default: null 
    },
    resetOtpExpire: { 
        type: Date, 
        default: null 
    },
    // 👆 নতুন কোড শেষ

    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Mess', messSchema);