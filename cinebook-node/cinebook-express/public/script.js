/* ---- Seat selection grid: priced by row, like a real cinema ---- */
var selectedSeats = [];
var SEAT_TIERS = {
    A: { label: 'Silver', price: 150, cls: 'tier-silver' },
    B: { label: 'Silver', price: 150, cls: 'tier-silver' },
    C: { label: 'Gold', price: 250, cls: 'tier-gold' },
    D: { label: 'Gold', price: 250, cls: 'tier-gold' },
    E: { label: 'Platinum', price: 400, cls: 'tier-platinum' },
    F: { label: 'Platinum', price: 400, cls: 'tier-platinum' }
};
var SEAT_ROWS = Object.keys(SEAT_TIERS);
var SEATS_PER_ROW = 8;

function renderSeatMap() {
    var map = document.getElementById('seatMap');
    if (!map) return;
    map.innerHTML = '';
    SEAT_ROWS.forEach(function (row) {
        for (var n = 1; n <= SEATS_PER_ROW; n++) {
            var seatId = row + n;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'seat ' + SEAT_TIERS[row].cls;
            btn.textContent = seatId;
            btn.title = SEAT_TIERS[row].label + ' - ₹' + SEAT_TIERS[row].price;
            btn.onclick = function () { toggleSeat(this.textContent); };
            map.appendChild(btn);
        }
    });
}

function toggleSeat(seatId) {
    var i = selectedSeats.indexOf(seatId);
    if (i === -1) {
        selectedSeats.push(seatId);
    } else {
        selectedSeats.splice(i, 1);
    }
    document.querySelectorAll('.seat').forEach(function (btn) {
        btn.classList.toggle('selected', selectedSeats.indexOf(btn.textContent) !== -1);
    });
    document.getElementById('seatSummary').textContent =
        selectedSeats.length ? 'Selected: ' + selectedSeats.join(', ') : 'No seats selected yet.';
    calculateBill();
}

/* ---- Task 1: array + operators (billing calculator) ----
   Each selected seat carries its own price from its row's tier, so the
   total is a sum over the array rather than a flat price * count. */
function calculateBill() {
    var box = document.getElementById('billResult');
    if (!box) return;
    var total = selectedSeats.reduce(function (sum, seatId) {
        return sum + SEAT_TIERS[seatId[0]].price;
    }, 0);
    var discount = total > 500 ? total * 0.1 : 0;
    var finalAmount = total - discount;
    box.textContent = selectedSeats.length
        ? 'Total: ₹' + total + ' | Discount: ₹' + discount.toFixed(0) + ' | Final Amount: ₹' + finalAmount.toFixed(0)
        : '';
}

/* ---- show/hide a password field ---- */
function togglePassword(inputId, btn) {
    var input = document.getElementById(inputId);
    var hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    btn.textContent = hidden ? 'Hide' : 'Show';
}

/* ---- simple payment field formatting ---- */
function formatCardNumber(input) {
    input.value = input.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(input) {
    var v = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
}

/* ---- Task 2: events + this keyword ---- */
function cancelBooking(btn) {
    btn.textContent = 'Cancelled';
    document.getElementById('bookingForm').reset();
    selectedSeats = [];
    renderSeatMap();
    document.getElementById('seatSummary').textContent = 'No seats selected yet.';
    document.getElementById('billResult').textContent = '';
    document.getElementById('paymentError').textContent = '';
    document.getElementById('bookingLog').innerHTML = '';
    setTimeout(function () { btn.textContent = 'Cancel'; }, 1500);
}

document.addEventListener('DOMContentLoaded', renderSeatMap);

/* ---- Task 3: DOM manipulation (live character count) ---- */
function updateCharCount() {
    var box = document.getElementById('reviewBox');
    if (box) document.getElementById('charCount').textContent = box.value.length;
}

/* ---- Task 4: form validation, then a real account is created server-side ---- */
function validateAccountForm(e) {
    e.preventDefault();
    var name = document.getElementById('accName').value.trim();
    var mobile = document.getElementById('accMobile').value.trim();
    var email = document.getElementById('accEmail').value.trim();
    var pass = document.getElementById('accPass').value;
    var cpass = document.getElementById('accCPass').value;
    var gender = document.querySelector('input[name=gender]:checked');
    var errorBox = document.getElementById('accError');

    if (!name || !mobile || !email || !pass || !cpass || !gender) {
        errorBox.textContent = 'Please fill all fields.';
        return false;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
        errorBox.textContent = 'Mobile number must be exactly 10 digits.';
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorBox.textContent = 'Enter a valid email address.';
        return false;
    }
    if (pass.length < 6) {
        errorBox.textContent = 'Password must be at least 6 characters.';
        return false;
    }
    if (pass !== cpass) {
        errorBox.textContent = 'Passwords do not match.';
        return false;
    }
    errorBox.textContent = '';

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, mobile: mobile, email: email, password: pass, gender: gender.value })
    })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
            if (!result.ok) {
                errorBox.textContent = result.data.message;
                return;
            }
            window.location.href = '/login'; // reload so the navbar/page picks up the new session
        })
        .catch(function () { errorBox.textContent = 'Could not reach the server. Please try again.'; });

    return false;
}

/* ---- Login: real session created server-side ---- */
function loginUser(e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errorBox = document.getElementById('loginError');

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
            if (!result.ok) {
                errorBox.textContent = result.data.message;
                return;
            }
            window.location.href = '/login'; // reload to show "My Account"
        })
        .catch(function () { errorBox.textContent = 'Could not reach the server. Please try again.'; });

    return false;
}

function logout() {
    fetch('/api/logout', { method: 'POST' }).then(function () { window.location.href = '/'; });
}

/* ---- shared helper to log a step into a list ---- */
function logStep(listId, msg) {
    var li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = msg;
    document.getElementById(listId).appendChild(li);
}

/* ---- Task 5: nested callbacks (food order) ---- */
var foodSteps = ['Food selected.', 'Order confirmed.', 'Food is being prepared.', 'Delivery partner assigned.', 'Food delivered!'];
function nextFoodStep(i) {
    if (i >= foodSteps.length) return;
    setTimeout(function () { logStep('foodLog', foodSteps[i]); nextFoodStep(i + 1); }, 500);
}
function startFoodOrder() {
    document.getElementById('foodLog').innerHTML = '';
    nextFoodStep(0);
}

/* ---- Task 6: Promise chaining (shopping flow) ---- */
var shopSteps = ['Product selected.', 'Availability checked.', 'Added to cart.', 'Payment completed.', 'Order confirmation generated!'];
function step(listId, msg, delay) {
    return new Promise(function (resolve) {
        setTimeout(function () { logStep(listId, msg); resolve(); }, delay);
    });
}
function startShopping() {
    document.getElementById('shopLog').innerHTML = '';
    shopSteps.reduce(function (chain, msg) {
        return chain.then(function () { return step('shopLog', msg, 500); });
    }, Promise.resolve());
}

/* ---- Task 7: async/await + try...catch (movie booking) ----
   This now talks to the real Express backend (POST /api/book) instead of
   just simulating a wait, so the async/await flow drives an actual
   server request that uses the custom billing module and writes to
   bookings.log on the server. */
function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

function logBooking(msg) {
    document.getElementById('bookingLog').innerHTML += msg + '<br>';
}

function validatePaymentForm() {
    var errorBox = document.getElementById('paymentError');
    if (!selectedSeats.length) {
        errorBox.textContent = 'Please select at least one seat.';
        return false;
    }
    var cardName = document.getElementById('cardName').value.trim();
    var cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    var cardExpiry = document.getElementById('cardExpiry').value;
    var cardCvv = document.getElementById('cardCvv').value;
    if (!cardName || !/^\d{16}$/.test(cardNumber) || !/^\d{2}\/\d{2}$/.test(cardExpiry) || !/^\d{3}$/.test(cardCvv)) {
        errorBox.textContent = 'Please enter valid payment details (16-digit card, MM/YY expiry, 3-digit CVV).';
        return false;
    }
    errorBox.textContent = '';
    return true;
}

async function bookTicket(e) {
    e.preventDefault();
    if (!validatePaymentForm()) return;

    var movie = document.getElementById('movie').value;
    var cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    var cardLast4 = cardNumber.slice(-4);
    document.getElementById('bookingLog').innerHTML = '';
    try {
        logBooking('Movie selected: ' + movie);
        await wait(300);
        logBooking('Checking seat availability for: ' + selectedSeats.join(', '));

        // the server looks up each seat's price itself from its row - the
        // client never gets to tell it what to charge
        var response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie: movie, seats: selectedSeats, cardLast4: cardLast4 })
        });
        var result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        logBooking('Seats reserved: ' + selectedSeats.join(', '));
        await wait(400);
        logBooking('Charging card ending in ' + cardLast4 + '...');
        await wait(400);
        logBooking('Payment successful. Total charged: ₹' + result.bill.finalAmount);
        logBooking('Ticket generated! Enjoy the movie.');
        document.getElementById('bookingForm').reset();
        selectedSeats = [];
        renderSeatMap();
        document.getElementById('seatSummary').textContent = 'No seats selected yet.';
    } catch (err) {
        logBooking('Booking failed: ' + err.message);
    }
}
