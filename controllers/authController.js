const Mess = require('../models/Mess');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==========================================
// ১. মেস রেজিস্ট্রেশন API (With 20-Day Free Trial)
// ==========================================
exports.registerMess = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const bcrypt = require('bcrypt');
        const { messName, messEmail, managerPin } = req.body;

        if (!messName || !messEmail || !managerPin) {
            return res.status(400).json({ success: false, message: 'সবগুলো তথ্য দিতে হবে!' });
        }

        const existingMess = await Mess.findOne({ messEmail: messEmail.trim().toLowerCase() });
        if (existingMess) {
            return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(String(managerPin).trim(), salt);

        // ⏱️ ম্যাজিক: বর্তমান তারিখ থেকে ২০ দিন পর ট্রায়াল শেষ হবে
        const trialDate = new Date();
        trialDate.setDate(trialDate.getDate() + 20);

        const newMess = new Mess({
            messName,
            messEmail: messEmail.trim().toLowerCase(),
            managerPin: hashedPin,
            subscriptionStatus: 'trial',
            trialEndsAt: trialDate
        });

        await newMess.save();
        res.status(201).json({ success: true, message: 'মেস রেজিস্ট্রেশন সফল হয়েছে!' });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: 'সার্ভার এরর।' });
    }
};

// ==========================================
// ২. ম্যানেজার লগিন API (Send Trial Status)
// ==========================================
exports.loginMess = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const jwt = require('jsonwebtoken');
        const bcrypt = require('bcrypt');
        const { messEmail, managerPin } = req.body;

        if (!messEmail || !managerPin) return res.status(400).json({ success: false, message: 'ইমেইল এবং পিন দিন!' });

        const mess = await Mess.findOne({ messEmail: messEmail.trim().toLowerCase() });
        if (!mess) return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি!' });

        let isMatch = false;
        if (mess.managerPin.startsWith('$2b$') || mess.managerPin.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(String(managerPin).trim(), mess.managerPin);
        } else {
            isMatch = String(mess.managerPin).trim() === String(managerPin).trim();
        }

        if (!isMatch) return res.status(400).json({ success: false, message: 'আপনার দেওয়া পিনটি ভুল হয়েছে!' });

        const token = jwt.sign({ messId: mess._id, role: 'manager' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        // 🛡️ লগিন করার সময় সাবস্ক্রিপশনের তথ্য ফ্রন্টএন্ডে পাঠানো হচ্ছে
        res.status(200).json({ 
            success: true, 
            token, 
            messId: mess._id, 
            messName: mess.messName, 
            subscriptionStatus: mess.subscriptionStatus || 'trial',
            trialEndsAt: mess.trialEndsAt,
            role: 'manager' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'সার্ভার এরর।' });
    }
};

// ==========================================
// --- PROFILE MANAGEMENT (SAAS FEATURE) ---
// ==========================================

// ১. প্রোফাইল ডেটা দেখার API
exports.getProfile = async (req, res) => {
    try {
        const Mess = require('../models/Mess'); // মডেল ইমপোর্ট (যদি উপরে না থাকে)
        // পাসওয়ার্ড বা পিন ছাড়া বাকি ডেটা পাঠানো হচ্ছে
        const mess = await Mess.findById(req.messId).select('-managerPin'); 
        if (!mess) return res.status(404).json({ message: 'অ্যাকাউন্ট পাওয়া যায়নি!' });
        
        res.status(200).json({ success: true, data: mess });
    } catch (error) {
        res.status(500).json({ message: 'সার্ভার এরর।' });
    }
};

// ==========================================
// ৫. প্রোফাইল ডেটা আপডেট করার API (Hash Support)
// ==========================================
exports.updateProfile = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const { messName, messEmail, oldPin, newPin } = req.body;
        
        const mess = await Mess.findById(req.messId);
        if (!mess) return res.status(404).json({ message: 'অ্যাকাউন্ট পাওয়া যায়নি!' });

        if (oldPin || newPin) {
            let isMatch = false;
            if (mess.managerPin.startsWith('$2b$') || mess.managerPin.startsWith('$2a$')) {
                isMatch = await bcrypt.compare(String(oldPin).trim(), mess.managerPin);
            } else {
                isMatch = String(mess.managerPin).trim() === String(oldPin).trim();
            }

            if (!isMatch) return res.status(400).json({ message: 'আপনার বর্তমান পিনটি ভুল হয়েছে!' });

            // নতুন পিন সেট করলে সেটিকে হ্যাশ করে নেওয়া
            if (newPin) {
                const salt = await bcrypt.genSalt(10);
                mess.managerPin = await bcrypt.hash(String(newPin).trim(), salt);
            }
        }

        if (messName) mess.messName = messName;
        if (messEmail) mess.messEmail = messEmail;

        await mess.save();
        res.status(200).json({ success: true, message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' });
    } catch (error) {
        res.status(500).json({ message: 'সার্ভার এরর।' });
    }
};

// ==========================================
// ৩. মেম্বারদের শুধু দেখার জন্য লগিন (RBAC)
// ==========================================
exports.loginMember = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const jwt = require('jsonwebtoken');
        const { messEmail } = req.body;

        if (!messEmail) return res.status(400).json({ message: 'মেস ইমেইল দিতে হবে!' });

        const mess = await Mess.findOne({ messEmail });
        if (!mess) return res.status(401).json({ message: 'এই ইমেইলে কোনো মেস পাওয়া যায়নি!' });

        const cleanMessId = String(mess._id);
        
        // মেম্বারদের জন্য রিড-ওনলি টোকেন
        const token = jwt.sign(
            { messId: cleanMessId, role: 'member' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({ success: true, token, messId: cleanMessId, messName: mess.messName, role: 'member' });
    } catch (error) {
        res.status(500).json({ message: 'সার্ভার এরর।' });
    }
};

// ==========================================
// ৪. প্রোফাইল ডেটা দেখার API
// ==========================================
exports.getProfile = async (req, res) => {
    try {
        const Mess = require('../models/Mess'); 
        const mess = await Mess.findById(req.messId).select('-managerPin'); 
        if (!mess) return res.status(404).json({ message: 'অ্যাকাউন্ট পাওয়া যায়নি!' });
        
        res.status(200).json({ success: true, data: mess });
    } catch (error) {
        res.status(500).json({ message: 'সার্ভার এরর।' });
    }
};

// ==========================================
// ৫. প্রোফাইল ডেটা আপডেট করার API
// ==========================================
exports.updateProfile = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const { messName, messEmail, oldPin, newPin } = req.body;
        
        const mess = await Mess.findById(req.messId);
        if (!mess) return res.status(404).json({ message: 'অ্যাকাউন্ট পাওয়া যায়নি!' });

        if (oldPin || newPin) {
            if (mess.managerPin !== oldPin) {
                return res.status(400).json({ message: 'আপনার বর্তমান পিনটি ভুল হয়েছে!' });
            }
            if (newPin) mess.managerPin = newPin;
        }

        if (messName) mess.messName = messName;
        if (messEmail) mess.messEmail = messEmail;

        await mess.save();
        res.status(200).json({ success: true, message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' });
    } catch (error) {
        res.status(500).json({ message: 'ইমেইলটি হয়তো অন্য কেউ ব্যবহার করছে অথবা সার্ভার এরর।' });
    }
};

// ==========================================
// --- FORGOT PIN & OTP MANAGEMENT ---
// ==========================================

// ১. ইমেইলে OTP পাঠানোর API
exports.forgotPin = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const sendEmail = require('../utils/sendEmail'); // 🚀 ম্যাজিক: আমাদের নতুন Brevo API ইমপোর্ট করা হলো
        const { messEmail } = req.body;

        const mess = await Mess.findOne({ messEmail: messEmail.toLowerCase() });
        if (!mess) return res.status(404).json({ success: false, message: 'এই ইমেইলে কোনো মেস অ্যাকাউন্ট পাওয়া যায়নি!' });

        // ৬ ডিজিটের রেন্ডম OTP তৈরি করা হচ্ছে
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // ডাটাবেসে OTP এবং মেয়াদ (১০ মিনিট) সেভ করা
        mess.resetOtp = otp;
        mess.resetOtpExpire = Date.now() + 10 * 60 * 1000; 
        await mess.save();

        // 📧 ইমেইলের ডিজাইন
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
                <h2 style="color: #0d6efd;">Mess Manager</h2>
                <p>Hello <b>${mess.messName}</b>,</p>
                <p>We received a request to reset your Manager PIN.</p>
                <p>Your One Time Password (OTP) is:</p>
                <h1 style="background: #f4f7f6; padding: 15px; letter-spacing: 5px; color: #dc3545; border-radius: 5px;">${otp}</h1>
                <p style="color: #6c757d; font-size: 12px;">This OTP is valid for the next 10 minutes. Please do not share this with anyone.</p>
            </div>
        `;

        // 🚀 Nodemailer এর বদলে সরাসরি আমাদের Brevo API কল করা হচ্ছে
        await sendEmail({
            email: mess.messEmail,
            subject: '🔒 Your PIN Reset OTP - Mess Manager',
            message: emailHTML
        });

        res.status(200).json({ success: true, message: 'আপনার ইমেইলে একটি ৬-ডিজিটের OTP পাঠানো হয়েছে!' });

    } catch (error) {
        console.error("Email Error: ", error);
        res.status(500).json({ success: false, message: 'সার্ভার এরর। ইমেইল পাঠানো যায়নি।' });
    }
};

// ==========================================
// Forgot PIN - ২. OTP মিলিয়ে নতুন পিন সেট করা
// ==========================================
exports.resetPin = async (req, res) => {
    try {
        const Mess = require('../models/Mess');
        const { messEmail, otp, newPin } = req.body;

        const mess = await Mess.findOne({
            messEmail: messEmail.toLowerCase(),
            resetOtp: otp,
            resetOtpExpire: { $gt: Date.now() }
        });

        if (!mess) return res.status(400).json({ success: false, message: 'OTP ভুল অথবা মেয়াদ শেষ হয়ে গেছে! 🚫' });

        // 🛡️ নতুন পিনকেও সিকিউর (Hash) করে সেভ করা হচ্ছে
        const salt = await bcrypt.genSalt(10);
        mess.managerPin = await bcrypt.hash(String(newPin).trim(), salt);
        
        mess.resetOtp = null;
        mess.resetOtpExpire = null;
        await mess.save();

        res.status(200).json({ success: true, message: 'আপনার পিন সফলভাবে পরিবর্তন করা হয়েছে! 🎉 এখন লগিন করুন।' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'সার্ভার এরর।' });
    }
};