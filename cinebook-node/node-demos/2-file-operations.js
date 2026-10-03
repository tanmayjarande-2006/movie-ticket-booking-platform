/* Experiment 6 - Task 2: Synchronous vs Asynchronous file operations
   Run: node 2-file-operations.js */

const fs = require('fs');
const moviesPath = __dirname + '/../cinebook-express/data/movies.json';

console.log('--- Synchronous read ---');
const dataSync = fs.readFileSync(moviesPath, 'utf8');
console.log('Read complete (sync):', JSON.parse(dataSync).length, 'movies loaded');
console.log('This line only runs after the file has been fully read.\n');

console.log('--- Asynchronous read ---');
fs.readFile(moviesPath, 'utf8', function (err, data) {
    if (err) throw err;
    console.log('Read complete (async):', JSON.parse(data).length, 'movies loaded');
});
console.log('This line runs immediately, before the async read finishes.');
