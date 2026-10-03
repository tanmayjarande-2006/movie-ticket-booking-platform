CineBook - Experiment 6 (Node.js + Express.js)
================================================

This folder has two parts:

1. node-demos/
   Small standalone scripts, one per Node.js concept asked for in the
   experiment sheet. Run each with plain Node, no install needed:

     node node-demos/1-http-basic-server.js      (then open http://localhost:3000
                                                    and http://localhost:3000/movies)
     node node-demos/2-file-operations.js         (shows sync vs async file read)
     node node-demos/3-custom-module-demo.js      (uses the custom mathUtils module)

2. cinebook-express/
   The actual CineBook website, now served by Express instead of being a
   static file. This is the real upgrade - routing, static file serving,
   and templating all come from Express now.

   To run it:
     cd cinebook-express
     npm install
     npm start
   Then open http://localhost:3000 in your browser.

   What's inside:
     server.js          - Express app: routes, static middleware, view engine
     modules/billing.js  - the same custom module, reused server-side
     data/movies.json    - movie data, read once at startup (fs.readFileSync)
     views/*.ejs          - EJS templates (the catalogue page is rendered
                             dynamically from movies.json, nothing is hardcoded)
     public/              - style.css, images, and script.js (served as static
                             files via express.static)
     bookings.log          - created automatically the first time a booking
                              succeeds (fs.appendFile, async, non-blocking)

   The booking flow on the Book Tickets page now sends a real POST request
   to /api/book, which uses the custom billing module to calculate the bill
   and logs it to bookings.log - so the async/await + try/catch JavaScript
   from Experiment 4 is now driving an actual server call instead of a
   simulated delay.
