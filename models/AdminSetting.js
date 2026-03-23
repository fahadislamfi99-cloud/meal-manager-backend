const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema({
    monthlyPrice: { type: Number, default: 99 },
    yearlyPrice: { type: Number, default: 999 },
    trialDays: { type: Number, default: 20 },
    globalNotice: { type: String, default: '' } // 🚀 নতুন যোগ করা হলো
});

module.exports = mongoose.model('AdminSetting', adminSettingSchema);