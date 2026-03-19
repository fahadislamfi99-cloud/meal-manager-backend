const express = require('express');
const router = express.Router();

// ১. কন্ট্রোলার থেকে সবগুলো প্রয়োজনীয় ফাংশন ইমপোর্ট করা হলো
const { 
    registerMess, 
    loginMess, 
    loginMember, 
    getProfile, 
    updateProfile,
    forgotPin, // 👈 নতুন
    resetPin   // 👈 নতুন
} = require('../controllers/authController');

// ২. প্রোফাইল সিকিউর করার জন্য মিডলওয়্যার (গার্ড) ইমপোর্ট করা হলো
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// --- AUTHENTICATION ROUTES ---
// ==========================================

// মেস রেজিস্ট্রেশনের API
router.post('/register', registerMess);

// ম্যানেজার লগিনের API
router.post('/login', loginMess); 

// সাধারণ মেম্বার লগিনের API
router.post('/login-member', loginMember);

// ==========================================
// --- PROFILE MANAGEMENT ROUTES ---
// ==========================================

// প্রোফাইল দেখার API (লগিন বাধ্যতামূলক)
router.get('/profile', protect, getProfile);

// প্রোফাইল আপডেট করার API (লগিন বাধ্যতামূলক)
router.put('/profile', protect, updateProfile);

// ==========================================
// --- FORGOT PIN ROUTES ---
// ==========================================
router.post('/forgot-pin', forgotPin);
router.post('/reset-pin', resetPin);

module.exports = router;