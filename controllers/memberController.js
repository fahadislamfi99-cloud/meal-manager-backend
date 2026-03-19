const Member = require('../models/Member');

exports.addMember = async (req, res, next) => {
  try {
    req.body.messId = req.messId; 
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) { next(error); }
};

exports.getMembers = async (req, res, next) => {
  try {
    const members = await Member.find({ messId: req.messId }).sort({ name: 1 });
    res.status(200).json({ success: true, data: members });
  } catch (error) { next(error); }
};

exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findOneAndUpdate({ _id: req.params.id, messId: req.messId }, req.body, { new: true });
    res.status(200).json({ success: true, data: member });
  } catch (error) { next(error); }
};

exports.deleteMember = async (req, res, next) => {
  try {
    await Member.findOneAndDelete({ _id: req.params.id, messId: req.messId });
    res.status(200).json({ success: true, data: {} });
  } catch (error) { next(error); }
};