/* Custom module (Experiment 6, Task 3) reused here to calculate the ticket bill server-side */
function calculateTotal(price, seats) {
    return price * seats;
}
function applyDiscount(total) {
    return total > 500 ? total * 0.1 : 0;
}
function calculateBill(price, seats) {
    const total = calculateTotal(price, seats);
    const discount = applyDiscount(total);
    return { total, discount, finalAmount: total - discount };
}

module.exports = { calculateTotal, applyDiscount, calculateBill };
