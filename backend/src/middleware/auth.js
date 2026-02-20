const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role || 'student' };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authMiddleware;
