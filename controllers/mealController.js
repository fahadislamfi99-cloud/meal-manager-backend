const Meal = require('../models/Meal');

exports.addMeal = async (req, res, next) => {
  try {
    req.body.messId = req.messId;
    const meal = await Meal.create(req.body);
    res.status(201).json({ success: true, data: meal });
  } catch (error) { next(error); }
};

exports.getMealsByMonth = async (req, res, next) => {
  try {
    const { startDate, endDate, year, month } = req.query;
    let dateQuery = { messId: req.messId };

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.date = { $gte: start, $lte: end };
    } else {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        dateQuery.date = { $gte: start, $lte: end };
    }

    const meals = await Meal.find(dateQuery).populate('members', 'name room');
    res.status(200).json({ success: true, count: meals.length, data: meals });
  } catch (error) { next(error); }
};

exports.getTotalMealCount = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const meals = await Meal.find({ messId: req.messId, date: { $gte: start, $lte: end } });
    const total = meals.reduce((sum, meal) => sum + meal.totalMeals, 0);
    
    res.status(200).json({ success: true, totalMeals: total });
  } catch (error) { next(error); }
};

exports.updateMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, messId: req.messId }, 
      req.body, 
      { new: true }
    );
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found or unauthorized' });
    res.status(200).json({ success: true, data: meal });
  } catch (error) { next(error); }
};

exports.deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, messId: req.messId });
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found or unauthorized' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) { next(error); }
};