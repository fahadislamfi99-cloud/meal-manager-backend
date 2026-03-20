const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 🛡️ সিকিউরিটি প্যাকেজগুলো ইমপোর্ট করা হলো
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();
const app = express();

// ==========================================
// 🛡️ SAAS SECURITY MIDDLEWARES 🛡️
// ==========================================

// ১. HTTP Headers Security (XSS অ্যাটাক এবং ক্লিকজ্যাকিং থেকে বাঁচায়)
app.use(helmet());

// ২. CORS Policy (শুধু আপনার ওয়েবসাইট ছাড়া অন্য কেউ API কল করতে পারবে না)
// CORS Setup - Allow Frontend to connect
app.use(cors({
    origin: ['https://mealmanager99.netlify.app', 'http://127.0.0.1:5500', 'http://localhost:5000'], // আপনার Netlify লিংক
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// ৩. Rate Limiting (Brute Force / পিন হ্যাকিং থেকে বাঁচায়)
// নিয়ম: এক IP থেকে ১৫ মিনিটে ১০০ বারের বেশি রিকোয়েস্ট করলে ব্লক করে দেবে
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // ১৫ মিনিট
    max: 1000, 
    message: { success: false, message: 'আপনি অনেক বেশি রিকোয়েস্ট পাঠিয়েছেন! দয়া করে ১৫ মিনিট পর আবার চেষ্টা করুন।' }
});
app.use('/api/', apiLimiter);

// বডি পার্সার (JSON ডেটা পড়ার জন্য)
app.use(express.json());

// ৪. Data Sanitization (NoSQL Injection থেকে ডাটাবেসকে রক্ষা করে)
// নিয়ম: ইউজার ইনপুটের ভেতর কোনো ক্ষতিকর মঙ্গোডিবি কোড (যেমন: $gt, $set) থাকলে মুছে ফেলবে
app.use(mongoSanitize());

// ==========================================
// 🚀 ROUTERS (আপনার সব API রাউট)
// ==========================================
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const bazarRoutes = require('./routes/bazarRoutes');
const mealRoutes = require('./routes/mealRoutes');
const depositRoutes = require('./routes/depositRoutes');
const managerRoutes = require('./routes/managerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');
const publicRoutes = require('./routes/publicRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/bazar', bazarRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/public', publicRoutes);
app.use(cors());
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 🗄️ DATABASE CONNECTION & SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Database');
    app.listen(PORT, () => console.log(`🚀 Secure Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

  app.get('/', (req, res) => {
    res.send('Mess Manager API is running smoothly! 🚀');
});