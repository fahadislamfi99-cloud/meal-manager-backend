const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema({
    monthlyPrice: { type: Number, default: 99 },
    yearlyPrice: { type: Number, default: 999 }
});

module.exports = mongoose.model('AdminSetting', adminSettingSchema);