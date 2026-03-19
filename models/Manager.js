const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },

  messId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mess', 
    required: [true, 'Mess ID is required'] 
  }
});

managerSchema.index({ messId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Manager', managerSchema);