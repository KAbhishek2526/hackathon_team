/**
 * Role-based access control middleware.
 */

function requireStudent(req, res, next) {
    if (req.user?.role !== 'student') {
        return res.status(403).json({ error: 'This action is restricted to student accounts.' });
    }
    next();
}

function requireGlobalClient(req, res, next) {
    if (req.user?.role !== 'global_client') {
        return res.status(403).json({ error: 'This action is restricted to professional accounts.' });
    }
    next();
}

module.exports = { requireStudent, requireGlobalClient };
