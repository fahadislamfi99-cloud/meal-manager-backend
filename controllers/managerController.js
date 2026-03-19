const Manager = require('../models/Manager');

exports.setManager = async (req, res, next) => {
  try {
    const { member, year, month } = req.body;
    // 🛡️ SaaS Security: মেস আইডি অনুযায়ী ম্যানেজার খোঁজা ও সেট করা
    let manager = await Manager.findOne({ messId: req.messId, year, month });
    
    if (manager) {
      manager.member = member;
      await manager.save();
    } else {
      manager = await Manager.create({ messId: req.messId, member, year, month });
    }
    res.status(200).json({ success: true, data: manager });
  } catch (error) { next(error); }
};

exports.getManager = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const manager = await Manager.findOne({ messId: req.messId, year, month }).populate('member', 'name');
    res.status(200).json({ success: true, data: manager });
  } catch (error) { next(error); }
};