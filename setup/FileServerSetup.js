const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

if (!fs.existsSync(path.join(__dirname, '../FileServer'))) {
    fs.mkdir(path.join(__dirname, '../FileServer'), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log("FileServer folder created...");
    });
}
if (!fs.existsSync(path.join(__dirname, '../BIN'))) {
    fs.mkdir(path.join(__dirname, '../BIN'), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log("BIN folder created...");
    });
}
if (!fs.existsSync(path.join(__dirname, '../public/profileImages'))) {
    fs.mkdir(path.join(__dirname, '../public/profileImages'), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log("profileImages folder created...");
    });
}
if (!fs.existsSync(path.join(__dirname, '../DB'))) {
    fs.mkdir(path.join(__dirname, '../DB'), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log("DB folder created...");
    });
    const db = new Database(path.join(__dirname,'../DB','users.db'), { verbose: console.log });
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            emailid TEXT NOT NULL,
            phonenumber TEXT NOT NULL
        )
    `).run();
}