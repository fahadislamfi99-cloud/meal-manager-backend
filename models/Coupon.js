const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, // কোড সবসময় বড় হাতের হবে (যেমন: EID50)
        trim: true
    },
    discountAmount: { 
        type: Number, 
        required: true 
    },
    discountType: { 
        type: String, 
        enum: ['flat', 'percentage'], // flat = ২০০ টাকা ছাড়, percentage = ২০% ছাড়
        default: 'flat' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);