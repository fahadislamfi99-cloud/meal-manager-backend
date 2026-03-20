const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' },
    messName: { type: String, required: true },
    amount: { type: Number, required: true },
    trxId: { type: String, required: true }, // Payment ID
    status: { type: String, default: 'Success' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);