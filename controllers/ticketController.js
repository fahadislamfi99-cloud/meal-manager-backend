const Ticket = require('../models/Ticket');
const Mess = require('../models/Mess');

// ১. ইউজার নতুন টিকিট তৈরি করবে
exports.createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const messId = req.messId; // Auth Middleware থেকে আসবে
        
        const mess = await Mess.findById(messId);
        if (!mess) return res.status(404).json({ success: false, message: "Mess not found" });

        const newTicket = await Ticket.create({
            messId,
            messName: mess.messName,
            subject,
            message
        });

        res.status(201).json({ success: true, ticket: newTicket, message: "Support ticket submitted successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create ticket" });
    }
};

// ২. ইউজার তার নিজের টিকিটগুলো দেখবে
exports.getUserTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ messId: req.messId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching tickets" });
    }
};

// ৩. সুপার অ্যাডমিন সব টিকিট দেখবে
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching tickets" });
    }
};

// ৪. সুপার অ্যাডমিন টিকিটের রিপ্লাই দেবে
exports.replyTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { adminReply, status } = req.body;

        const ticket = await Ticket.findByIdAndUpdate(
            ticketId,
            { adminReply, status: status || 'Answered' },
            { new: true }
        );

        res.status(200).json({ success: true, message: "Reply sent successfully!", data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to reply" });
    }
};