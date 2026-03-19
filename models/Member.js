const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  room: { type: String, required: [true, 'Room number is required'] },
  phone: { type: String, default: '' },
  
  // 🛡️ SaaS Security: এই মেম্বারটি কোন মেসের, তা চেনার জন্য নিচের অংশটুকু যুক্ত করুন
  messId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mess', 
    required: [true, 'Mess ID is required'] 
  },

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', memberSchema);