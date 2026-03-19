const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const Deposit = require('../models/Deposit');
const Member = require('../models/Member');
const Manager = require('../models/Manager');
const Setting = require('../models/Setting');

exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { startDate, endDate, year, month } = req.query;
    
    // 🛡️ শুধু এই নির্দিষ্ট মেসের সেটিংস নিয়ে আসবে!
    const appSettings = await Setting.findOne({ messId: req.messId }) || {};
    
    let dateQuery = { messId: req.messId }; // 🛡️ সব খোঁজার সাথে messId জুড়ে দেওয়া হলো!
    let managerYear = year;
    let managerMonth = month;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.date = { $gte: start, $lte: end };
        managerYear = start.getFullYear();
        managerMonth = start.getMonth() + 1; 
    } else {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        dateQuery.date = { $gte: start, $lte: end };
    }

    const currentManager = await Manager.findOne({ messId: req.messId, year: managerYear, month: managerMonth });
    const managerId = currentManager ? currentManager.member.toString() : null;

    const bazars = await Bazar.find(dateQuery);
    const totalExpense = bazars.reduce((sum, b) => sum + b.amount, 0);

    const allMembers = await Member.find({ messId: req.messId, isActive: true });
    const memberStats = {};
    allMembers.forEach(m => {
      memberStats[m._id.toString()] = { 
        memberId: m._id, name: m.name, room: m.room, phone: m.phone, totalMeals: 0, depositedAmount: 0,
        fixedTotalCost: 0 
      };
    });

    const fixedRates = {
        breakfast: Number(appSettings.rateBreakfast) || 0,
        lunch: Number(appSettings.rateLunch) || 0,
        dinner: Number(appSettings.rateDinner) || 0,
        sehri: Number(appSettings.rateSehri) || 0,
        iftar: Number(appSettings.rateIftar) || 0
    };

    const activeCalcMode = appSettings.calcMode || 'average';

    const meals = await Meal.find(dateQuery).populate('members', 'name');
    let totalMeals = 0; 
    meals.forEach(meal => {
      const safeMealType = (meal.mealType || '').trim().toLowerCase();
      const costForThisMeal = fixedRates[safeMealType] || 0; 
      
      meal.members.forEach(m => {
        if (memberStats[m._id.toString()]) {
          memberStats[m._id.toString()].totalMeals += 1;
          memberStats[m._id.toString()].fixedTotalCost += costForThisMeal; 
          totalMeals += 1;
        }
      });
    });

    let totalPayableMeals = 0;
    Object.values(memberStats).forEach(m => {
      if (m.memberId.toString() !== managerId) { 
        totalPayableMeals += m.totalMeals; 
      }
    });
    
    const mealRate = totalPayableMeals > 0 ? (totalExpense / totalPayableMeals) : 0;

    const deposits = await Deposit.find(dateQuery);
    deposits.forEach(d => {
      if (memberStats[d.member.toString()]) {
         memberStats[d.member.toString()].depositedAmount += d.amount;
      }
    });

    const memberDetails = Object.values(memberStats).map(m => {
      const isManager = m.memberId.toString() === managerId;
      let payableAmount = 0;

      if (!isManager) {
          if (activeCalcMode === 'fixed') {
              payableAmount = m.fixedTotalCost;
          } else {
              payableAmount = Number((m.totalMeals * mealRate).toFixed(2));
          }
      }

      const balance = Number((m.depositedAmount - payableAmount).toFixed(2));
      return { ...m, isManager, payableAmount, balance };
    });

    res.status(200).json({
      success: true,
      data: { totalExpense, totalMeals, mealRate: Number(mealRate.toFixed(2)), calcMode: activeCalcMode, members: memberDetails, managerId }
    });
  } catch (error) { next(error); }
};