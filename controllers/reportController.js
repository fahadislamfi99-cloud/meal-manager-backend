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

    // 🚀 ম্যাজিক: year/month এর বদলে এখন সরাসরি startDate দিয়ে ম্যানেজার খুঁজবে
    const currentManager = await Manager.findOne({ messId: req.messId, startDate: startDate });
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

    const activeCalcMode = appSettings.calcMode || '';

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

// ==========================================
// 🚀 নতুন: পাবলিক মেম্বার হিস্ট্রি (Passbook Style)
// ==========================================
exports.getPublicMemberDetail = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate } = req.query;

        // ১. সেটিংস ও মেম্বার ডেটা আনা
        const appSettings = await Setting.findOne({ messId: req.messId }) || {};
        const member = await Member.findById(memberId).select('name room');
        if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

        const activeCalcMode = appSettings.calcMode || 'average';
        const fixedRates = {
            breakfast: Number(appSettings.rateBreakfast) || 0,
            lunch: Number(appSettings.rateLunch) || 0,
            dinner: Number(appSettings.rateDinner) || 0,
            sehri: Number(appSettings.rateSehri) || 0,
            iftar: Number(appSettings.rateIftar) || 0
        };

        // ২. এই মাসের মোট খরচ ও মোট মিল (Average রেট বের করার জন্য)
        let mealRate = 0;
        const currentManager = await Manager.findOne({ messId: req.messId, startDate: startDate });
        const managerId = currentManager ? currentManager.member.toString() : null;
        const isManager = memberId === managerId;

        if (activeCalcMode === 'average') {
            const [bazars, allMeals] = await Promise.all([
                Bazar.find({ messId: req.messId, date: { $gte: startDate, $lte: endDate } }),
                Meal.find({ messId: req.messId, date: { $gte: startDate, $lte: endDate } })
            ]);
            const totalExpense = bazars.reduce((sum, b) => sum + b.amount, 0);
            
            let totalPayableMeals = 0;
            allMeals.forEach(meal => {
                meal.members.forEach(m => {
                    if (m.toString() !== managerId) totalPayableMeals++;
                });
            });
            mealRate = totalPayableMeals > 0 ? (totalExpense / totalPayableMeals) : 0;
        }

        // ৩. নির্দিষ্ট মেম্বারের ডেপোজিট এবং মিল আনা
        const [deposits, memberMeals] = await Promise.all([
            Deposit.find({ messId: req.messId, member: memberId, date: { $gte: startDate, $lte: endDate } }),
            Meal.find({ messId: req.messId, members: memberId, date: { $gte: startDate, $lte: endDate } })
        ]);

        // ৪. ট্রানজেকশন (Passbook) তৈরি করা
        const transactions = [];

        deposits.forEach(d => {
            transactions.push({
                date: d.date,
                details: d.amount < 0 ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">Refund / Minus</span>' : '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Cash In</span>',
                amount: d.amount
            });
        });

        memberMeals.forEach(m => {
            let cost = 0;
            if (!isManager) {
                if (activeCalcMode === 'fixed') {
                    const mType = (m.mealType || '').trim().toLowerCase();
                    cost = fixedRates[mType] || 0;
                } else {
                    cost = mealRate;
                }
            }

            transactions.push({
                date: m.date,
                details: `<span class="badge bg-primary bg-opacity-10 text-primary text-capitalize border border-primary border-opacity-25">${m.mealType} Meal</span>`,
                amount: -cost // খরচ তাই মাইনাস
            });
        });

        // তারিখ অনুযায়ী লেটেস্টটা আগে সাজানো
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const formattedTransactions = transactions.map(t => ({
            date: new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            details: t.details,
            amount: t.amount
        }));

        res.status(200).json({
            success: true,
            data: { transactions: formattedTransactions }
        });

    } catch (error) { next(error); }
};