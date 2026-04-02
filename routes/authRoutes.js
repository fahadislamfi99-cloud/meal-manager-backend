const express = require('express');
const mongoose = require('mongoose'); // 👈 Mongoose ইমপোর্ট করা হলো
const router = express.Router(); // 👈 Router তৈরি হলো

// ১. কন্ট্রোলার থেকে সবগুলো প্রয়োজনীয় ফাংশন ইমপোর্ট করা হলো
const { 
    registerMess, 
    loginMess, 
    loginMember, 
    getProfile, 
    updateProfile,
    forgotPin,
    resetPin
} = require('../controllers/authController');

// ২. প্রোফাইল সিকিউর করার জন্য মিডলওয়্যার (গার্ড) ইমপোর্ট করা হলো
const { protect } = require('../middleware/authMiddleware');


// ==========================================
// --- AUTHENTICATION ROUTES ---
// ==========================================
router.post('/register', registerMess);
router.post('/login', loginMess); 
router.post('/login-member', loginMember);

// ==========================================
// --- PROFILE MANAGEMENT ROUTES ---
// ==========================================
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ==========================================
// --- FORGOT PIN ROUTES ---
// ==========================================
router.post('/forgot-pin', forgotPin);
router.post('/reset-pin', resetPin);

module.exports = router;