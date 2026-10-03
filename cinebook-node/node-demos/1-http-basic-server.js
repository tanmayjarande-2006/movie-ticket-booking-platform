/* Experiment 6 - Task 1: Basic Node.js server using the built-in http module
   Covers: http module server, basic routing (HTML + JSON responses),
   and a callback (fs.readFile's callback). Run: node 1-http-basic-server.js
   Then visit http://localhost:3000 and http://localhost:3000/movies */

const http = require('http');
const fs = require('fs');

function getMovies(callback) {
    fs.readFile(__dirname + '/../cinebook-express/data/movies.json', 'utf8', function (err, data) {
        if (err) return callback(err);
        callback(null, JSON.parse(data));
    });
}

const server = http.createServer(function (req, res) {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>CineBook - Basic Node.js Server</h1><p>Visit <a href="/movies">/movies</a> for the JSON movie list.</p>');
    } else if (req.url === '/movies') {
        getMovies(function (err, movies) {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Could not load movies' }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(movies));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1>');
    }
});

server.listen(3000, function () {
    console.log('Basic http server running at http://localhost:3000');
});
