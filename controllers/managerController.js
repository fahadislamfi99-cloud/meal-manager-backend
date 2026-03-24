const Manager = require('../models/Manager');
const Mess = require('../models/Mess');

// 🚀 হ্যান্ডওভার: বর্তমান সেশন ক্লোজ করা এবং নতুন সেশন শুরু করা
exports.setManager = async (req, res, next) => {
  try {
    const { member, closeDate, newStartDate, newEmail } = req.body; 
    
    // ১. রানিং ম্যানেজারকে খুঁজে তার সেশন ক্লোজ করে দেওয়া (endDate বসিয়ে)
    let activeManager = await Manager.findOne({ messId: req.messId, isActive: true });
    
    if (activeManager) {
      activeManager.endDate = closeDate;
      activeManager.isActive = false;
      await activeManager.save();
    }

    // ২. নতুন ম্যানেজারের জন্য নতুন সেশন (Term) তৈরি করা
    const newManager = await Manager.create({ 
        messId: req.messId, 
        member: member, 
        startDate: newStartDate, 
        isActive: true 
    });

    // ৩. ইমেইল আপডেট
    if (newEmail && newEmail.trim() !== '') {
        await Mess.findByIdAndUpdate(req.messId, { messEmail: newEmail.trim() });
    }

    res.status(200).json({ success: true, message: "Handover successful!", data: newManager });
  } catch (error) { next(error); }
};

// 🚀 নতুন: মেসের সব সেশন (Terms) এর লিস্ট পাঠানো (ড্রপডাউনের জন্য)
exports.getTerms = async (req, res, next) => {
  try {
    const terms = await Manager.find({ messId: req.messId }).populate('member', 'name room').sort({ startDate: -1 });
    res.status(200).json({ success: true, data: terms });
  } catch (error) { next(error); }
};

// 🚀 ফিক্স: বর্তমান রানিং ম্যানেজারকে খুঁজে বের করা
exports.getManager = async (req, res, next) => {
  try {
    // এখন আর মাস/বছর দিয়ে না খুঁজে, সরাসরি অ্যাকটিভ (isActive: true) সেশনকে খুঁজবে
    const manager = await Manager.findOne({ messId: req.messId, isActive: true }).populate('member', 'name');
    res.status(200).json({ success: true, data: manager });
  } catch (error) { next(error); }
};