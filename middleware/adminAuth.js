const jwt = require('jsonwebtoken');

const adminProtect = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 🛡️ ম্যাজিক: চেক করবে এই টোকেনটি কি আসলেই "সুপার অ্যাডমিন" এর কি না!
            if (decoded.role !== 'superadmin') {
                return res.status(403).json({ success: false, message: 'Access Denied! You are not the Super Admin.' });
            }
            
            req.adminId = decoded.id;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid Admin Token!' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'No Token Found!' });
    }
};

module.exports = { adminProtect };