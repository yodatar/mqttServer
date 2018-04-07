const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const app = express();

const port = 3000;

app.use(express.static(__dirname + "/views"));

app.listen(port, (err) => {
    if (err) {
        return console.log('Admin server FAILED to start:', err)
    }

    console.log(`Admin server is listening on ${port}`)
});

