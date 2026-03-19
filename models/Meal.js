const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  date: { type: Date, required: [true, 'Date is required'] },
  mealType: {
    type: String,
    required: true,
    enum: ['Sehri', 'Breakfast', 'Lunch', 'Iftar', 'Dinner']
  },

  messId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: [true, 'Mess ID is required']
  },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  totalMeals: { type: Number, required: true, default: 0 }
});

// Auto-calculate totalMeals before saving
mealSchema.pre('save', function (next) {
  this.totalMeals = this.members.length;
  next();
});

module.exports = mongoose.model('Meal', mealSchema);