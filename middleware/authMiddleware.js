const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            
            // 🔐 প্রোডাকশন গ্রেড সিকিউরিটি (.env এর চাবি দিয়ে চেক করছে)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.messId = decoded.messId;
            next();
        } catch (error) {
            console.error("❌ Token Error:", error.message);
            return res.status(401).json({ message: 'টোকেন বাতিল বা ভুল, দয়া করে আবার লগিন করুন!' });
        }
    } else {
        return res.status(401).json({ message: 'আপনি লগিন করেননি, কোনো টোকেন পাওয়া যায়নি!' });
    }
};

module.exports = { protect };