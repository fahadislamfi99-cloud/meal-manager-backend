const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: [true, 'Member is required'] },
  // এখান থেকে 'min: 0' শর্তটি সরিয়ে দেওয়া হয়েছে
  amount: { type: Number, required: [true, 'Amount is required'] }, 
  date: { type: Date, required: [true, 'Date is required'] },
  messId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mess', 
    required: [true, 'Mess ID is required'] 
  }
});

module.exports = mongoose.model('Deposit', depositSchema);