const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (!token) {
            console.log('[AUTH_FAIL] No token provided for:', req.originalUrl);
            return res.status(401).json({ message: 'Tidak ada token' });
        }

        const secret = process.env.JWT_SECRET || 'dev_secret';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('[AUTH_FAIL] Invalid token:', err.message, 'for:', req.originalUrl);
        return res.status(401).json({ message: 'Token tidak valid' });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Admin yang boleh.' });
    }
    next();
};

const teacherOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'guru') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Guru yang boleh.' });
    }
    next();
};

module.exports = { protect, adminOnly, teacherOnly };
