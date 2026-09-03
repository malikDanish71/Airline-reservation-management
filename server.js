// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const { attachUser } = require('./middlewares/auth.js');
const requestLogger = require("./middlewares/logger");

const homeRouter = require('./routes/client/home');
const aboutRouter = require('./routes/client/about');
const filterRouter = require('./routes/client/filter');
const bookRouter = require('./routes/client/book');
const authRouter = require('./routes/client/auth');
const profileRouter = require('./routes/client/profile');
const bookingsRouter = require('./routes/client/booking');

const adminAirportsRouter = require('./routes/admin/airports');
const adminAirlineRouter = require('./routes/admin/airlines');
const adminUserRouter = require('./routes/admin/users');
const adminBookingRouter = require('./routes/admin/bookings');
const adminFlightRouter = require('./routes/admin/flights');




const app = express();


// Method Override (for PUT/DELETE in forms)
app.use(methodOverride('_method'));
app.use(requestLogger);

// Connect to MongoDB
connectDB();

// EJS + Layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Session (stores JWT token in session)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Attach req.user if logged in
app.use(attachUser);

// Routes
app.use('/', homeRouter);
app.use('/about', aboutRouter);
app.use('/filter', filterRouter);
app.use('/book', bookRouter);
app.use('/', authRouter);
app.use('/profile', profileRouter);
app.use('/bookings', bookingsRouter);

app.use('/admin/airports', adminAirportsRouter);
app.use('/admin/airlines', adminAirlineRouter);
app.use('/admin/users', adminUserRouter);
app.use('/admin/bookings', adminBookingRouter);
app.use('/admin/flights', adminFlightRouter);




// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', active: '' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('500', { title: 'Server Error', active: '' });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
