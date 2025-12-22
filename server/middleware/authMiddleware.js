const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (!token) {
            return res.status(401).json({ message: 'Tidak ada token' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'guru') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Guru yang boleh.' });
    }
    next();
};

module.exports = { protect, adminOnly };
