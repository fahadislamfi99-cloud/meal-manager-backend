const Deposit = require('../models/Deposit');

exports.addDeposit = async (req, res, next) => {
  try {
    req.body.messId = req.messId;
    const deposit = await Deposit.create(req.body);
    res.status(201).json({ success: true, data: deposit });
  } catch (error) { next(error); }
};

exports.getDepositsByMonth = async (req, res, next) => {
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

    const deposits = await Deposit.find(dateQuery).populate('member', 'name room');
    res.status(200).json({ success: true, count: deposits.length, data: deposits });
  } catch (error) { next(error); }
};

exports.deleteDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findOneAndDelete({ _id: req.params.id, messId: req.messId });
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found or unauthorized' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) { next(error); }
};