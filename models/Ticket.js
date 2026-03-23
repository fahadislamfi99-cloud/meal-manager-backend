const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    messId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
    messName: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Answered', 'Closed'], default: 'Open' },
    adminReply: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);