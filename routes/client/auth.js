// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../../models/User');
const { createSessionToken } = require('../../middlewares/auth');

// Show login form
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login', active: '', css: 'auth.css' });
});


// Handle login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid email or password', title: 'Login', active: '', css: 'auth.css' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'Invalid email or password', title: 'Login', active: '', css: 'auth.css' });
        }
        createSessionToken(req, user);
        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
});

// Show signup form
router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up', active: '', css: 'auth.css' });
});

// Handle signup
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password, 'confirm-password': confirm } = req.body;
        if (password !== confirm) {
            return res.render('signup', { error: 'Passwords do not match', title: 'Sign Up', active: '', css: 'auth.css' });
        }
        const exists = await User.findOne({ email });
        if (exists) {
            return res.render('signup', { error: 'Email already in use', title: 'Sign Up', active: '', css: 'auth.css' });
        }
        const hash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hash });
        createSessionToken(req, user);
        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
