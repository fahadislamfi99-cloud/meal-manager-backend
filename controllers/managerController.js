const Manager = require('../models/Manager');
const Mess = require('../models/Mess'); // 🚀 নতুন: Mess মডেল ইমপোর্ট করা হলো

exports.setManager = async (req, res, next) => {
  try {
    // 🚀 নতুন: ফ্রন্টএন্ড থেকে newEmail রিসিভ করা হচ্ছে
    const { member, year, month, newEmail } = req.body; 
    
    // 🛡️ SaaS Security: মেস আইডি অনুযায়ী ম্যানেজার খোঁজা ও সেট করা
    let manager = await Manager.findOne({ messId: req.messId, year, month });
    
    if (manager) {
      manager.member = member;
      await manager.save();
    } else {
      manager = await Manager.create({ messId: req.messId, member, year, month });
    }

    // 🚀 ম্যাজিক: যদি নতুন ইমেইল দেওয়া হয়, তবে মূল মেস অ্যাকাউন্টের ইমেইল আপডেট করে দেওয়া!
    if (newEmail && newEmail.trim() !== '') {
        await Mess.findByIdAndUpdate(req.messId, { messEmail: newEmail.trim() });
    }

    res.status(200).json({ success: true, message: "Manager and Email updated successfully!", data: manager });
  } catch (error) { 
      next(error); 
  }
};

exports.getManager = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const manager = await Manager.findOne({ messId: req.messId, year, month }).populate('member', 'name');
    res.status(200).json({ success: true, data: manager });
  } catch (error) { 
      next(error); 
  }
};