const Setting = require('../models/Setting');

exports.getSettings = async (req, res, next) => {
    try {
        // 🛡️ শুধু এই মেসের সেটিংস খুঁজবে
        let setting = await Setting.findOne({ messId: req.messId });
        if (!setting) { setting = await Setting.create({ messId: req.messId }); }
        res.status(200).json({ success: true, data: setting });
    } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
    try {
        let setting = await Setting.findOne({ messId: req.messId });
        if (!setting) {
            req.body.messId = req.messId; // 🛡️ নতুন সেটিংসে মেস আইডি যুক্ত
            setting = await Setting.create(req.body);
        } else {
            setting = await Setting.findOneAndUpdate({ messId: req.messId }, req.body, { new: true });
        }
        res.status(200).json({ success: true, data: setting });
    } catch (error) { next(error); }
};