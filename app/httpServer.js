const path = require('path');
const express = require('express');
const app = express();

const port = 3000;

app.use(express.static(__dirname + "/clients"));

app.listen(port, (err) => {
    if (err) {
        return console.log('HTTP server FAILED to start:', err)
    }

    console.log(`HTTP server is listening on ${port}`)
});

