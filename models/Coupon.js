const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountAmount: { type: Number, required: true },
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    isActive: { type: Boolean, default: true },
    
    // নতুন যুক্ত করা ফিল্ডগুলো
    usageLimit: { type: Number, required: true, default: 100 }, 
    usedCount: { type: Number, default: 0 }, 
    expiresAt: { type: Date, required: true }, 

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);