// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET;

// after login/signup, sign & store token in session
function createSessionToken(req, user) {
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, SECRET, { expiresIn: '2h' });
    req.session.token = token;
}

// decode token, attach req.user if valid
async function attachUser(req, res, next) {
    const token = req.session.token;
    if (!token) return next();
    try {
        const { id } = jwt.verify(token, SECRET);
        req.user = await User.findById(id).select('-password');
    } catch (e) { /* invalid token */ }
    next();
}

// require login
function reqAuth(req, res, next) {
    if (!req.user) return res.redirect('/login');
    next();
}

// optional auth: attach user if any, but allow pass
function optAuth(req, res, next) {
    next();
}

// require admin
function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/');
    }
    next();
}

module.exports = {
    attachUser,
    reqAuth,
    optAuth,
    isAdmin,
    createSessionToken
};
