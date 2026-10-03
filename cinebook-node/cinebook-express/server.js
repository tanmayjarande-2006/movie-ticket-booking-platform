const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const billing = require('./modules/billing'); // custom module (Experiment 6, Task 3)

const app = express();
const PORT = 3000;

/* ---- View engine: EJS template engine for dynamic pages ---- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---- Serving static files using Express's built-in middleware ---- */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({
    secret: 'cinebook-lab-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hours
}));

/* Make the logged-in user (if any) available to every EJS view, so the
   navbar can greet them without each route having to pass it manually. */
app.use(function (req, res, next) {
    res.locals.user = req.session.user || null;
    next();
});

/* ---- Movie data loaded once at startup with a synchronous file read ---- */
const moviesPath = path.join(__dirname, 'data', 'movies.json');
const movies = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));

/* ---- User accounts, persisted to a JSON file ---- */
const usersPath = path.join(__dirname, 'data', 'users.json');
function loadUsers() {
    if (!fs.existsSync(usersPath)) return [];
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
}
function saveUsers(users) {
    fs.writeFile(usersPath, JSON.stringify(users, null, 2), function (err) {
        if (err) console.error('Could not save users:', err);
    });
}

/* ---- Booking history, persisted to a JSON file, one record per booking ---- */
const bookingsPath = path.join(__dirname, 'data', 'bookings.json');
function loadBookings() {
    if (!fs.existsSync(bookingsPath)) return [];
    return JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
}
function saveBookings(bookings) {
    fs.writeFile(bookingsPath, JSON.stringify(bookings, null, 2), function (err) {
        if (err) console.error('Could not save bookings:', err);
    });
}

/* Seat tiers by row, mirrored from public/script.js. The server never trusts
   a client-sent price - it looks up each seat's price itself from this table. */
var SEAT_TIERS = {
    A: 150, B: 150,   // Silver
    C: 250, D: 250,   // Gold
    E: 400, F: 400    // Platinum
};

/* require a logged-in session before a page route can run */
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

/* same, but for a JSON API route — a redirect would hand a fetch() call
   an HTML page instead of JSON, so this replies with 401 JSON instead */
function requireLoginApi(req, res, next) {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Please log in to book tickets.' });
    next();
}

/* ---- Basic routing using Express JS ---- */
app.get('/', function (req, res) {
    res.render('home');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/catalogue', function (req, res) {
    res.render('catalogue', { movies: movies });
});

app.get('/register', requireLogin, function (req, res) {
    // a Book Now link from Catalogue/Timetable can pre-select the movie via ?movie=
    res.render('register', { movies: movies, selectedMovie: req.query.movie || '' });
});

app.get('/timetable', function (req, res) {
    res.render('timetable', { movies: movies });
});

app.get('/mybookings', requireLogin, function (req, res) {
    var all = loadBookings();
    var mine = all
        .filter(function (b) { return b.email === req.session.user.email; })
        .sort(function (a, b) { return new Date(b.bookedAt) - new Date(a.bookedAt); });
    res.render('mybookings', { bookings: mine });
});

/* ---- Account creation: persists the user to data/users.json ---- */
app.post('/api/register', function (req, res) {
    var name = req.body.name, mobile = req.body.mobile, email = req.body.email;
    var password = req.body.password, gender = req.body.gender;

    if (!name || !mobile || !email || !password || !gender) {
        return res.status(400).json({ success: false, message: 'Please fill all fields.' });
    }
    var users = loadUsers();
    if (users.some(function (u) { return u.email === email; })) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    var user = { name: name, mobile: mobile, email: email, password: password, gender: gender };
    users.push(user);
    saveUsers(users);

    req.session.user = { name: name, mobile: mobile, email: email, gender: gender };
    res.json({ success: true, user: req.session.user });
});

/* ---- Login: checks against data/users.json and starts a session ---- */
app.post('/api/login', function (req, res) {
    var email = req.body.email, password = req.body.password;
    var users = loadUsers();
    var match = users.find(function (u) { return u.email === email && u.password === password; });
    if (!match) {
        return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }
    req.session.user = { name: match.name, mobile: match.mobile, email: match.email, gender: match.gender };
    res.json({ success: true, user: req.session.user });
});

app.post('/api/logout', function (req, res) {
    req.session.destroy(function () {
        res.json({ success: true });
    });
});

/* ---- JSON API route: uses the custom billing module and writes an
   asynchronous log entry for every successful booking. Booking requires
   a logged-in session, same as the page that leads to it. ---- */
app.post('/api/book', requireLoginApi, function (req, res) {
    var movie = req.body.movie;
    var seatList = Array.isArray(req.body.seats) ? req.body.seats : [];
    var cardLast4 = req.body.cardLast4 || '----';

    if (!seatList.length) {
        return res.status(400).json({ success: false, message: 'Please select at least one seat.' });
    }

    var available = Math.random() > 0.2; // ~80% chance seats are available
    if (!available) {
        return res.status(409).json({ success: false, message: 'Selected seats are no longer available. Please try again.' });
    }

    // Price each seat from its own row tier - never from what the client sent
    var seatTotal = seatList.reduce(function (sum, seatId) {
        return sum + (SEAT_TIERS[seatId[0]] || 0);
    }, 0);
    var bill = billing.calculateBill(seatTotal, 1); // custom module in action

    var logLine = new Date().toISOString() + ' | ' + req.session.user.email + ' | ' + movie + ' | seats: ' + seatList.join(',') +
        ' | card: **** ' + cardLast4 + ' | total: ₹' + bill.total + ' | final: ₹' + bill.finalAmount.toFixed(0) + '\n';

    // Asynchronous file operation: append to the plain-text booking log without blocking the response
    fs.appendFile(path.join(__dirname, 'bookings.log'), logLine, function (err) {
        if (err) console.error('Could not write booking log:', err);
    });

    // Save a structured record so the account can see it on /mybookings
    var bookings = loadBookings();
    bookings.push({
        email: req.session.user.email,
        movie: movie,
        seats: seatList,
        bill: bill,
        cardLast4: cardLast4,
        bookedAt: new Date().toISOString()
    });
    saveBookings(bookings);

    res.json({ success: true, bill: bill });
});

app.listen(PORT, function () {
    console.log('CineBook Express server running at http://localhost:' + PORT);
});
