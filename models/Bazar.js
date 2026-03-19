const mongoose = require('mongoose');

const bazarSchema = new mongoose.Schema({
  date: { type: Date, required: [true, 'Date is required'] },
  item: { type: String, required: [true, 'Item name is required'] },
  amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
  note: { type: String, default: '' },

  messId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: [true, 'Mess ID is required']
  },

  // --- প্রফেশনাল ডাটাবেস রিলেশনশিপ (Member এর সাথে লিংক) ---
  shopper: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: false }

}, { timestamps: true });

module.exports = mongoose.model('Bazar', bazarSchema);