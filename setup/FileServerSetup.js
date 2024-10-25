const fs = require('fs');
const path = require('path');
   
fs.mkdir(path.join(__dirname, '../FileServer'), (err) => {
    if (err) {
        return console.error(err);
    }
    console.log("FileServer created...");
});

fs.mkdir(path.join(__dirname, '../BIN'), (err) => {
    if (err) {
        return console.error(err);
    }
    console.log("BIN created...");
});