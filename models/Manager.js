const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  
  // 🚀 ম্যাজিক: মাস/বছরের বদলে এখন ডায়নামিক ডেট থাকবে
  startDate: { type: String, required: true }, // যে তারিখে দায়িত্ব নিলো
  endDate: { type: String, default: null },    // যে তারিখে দায়িত্ব ছাড়বে (রানিং অবস্থায় ফাঁকা থাকবে)
  isActive: { type: Boolean, default: true }   // বর্তমান ম্যানেজার কি না
});

// এক মেসের একই তারিখে যেন একাধিক টার্ম শুরু না হয়
managerSchema.index({ messId: 1, startDate: 1 }, { unique: true });

module.exports = mongoose.model('Manager', managerSchema);