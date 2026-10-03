/* Experiment 6 - Task 3: Using a custom module
   Run: node 3-custom-module-demo.js */

const mathUtils = require('./mathUtils');

const bill = mathUtils.calculateBill(250, 3); // Gold seat, 3 tickets
console.log('Total: ₹' + bill.total);
console.log('Discount: ₹' + bill.discount.toFixed(0));
console.log('Final Amount: ₹' + bill.finalAmount.toFixed(0));
