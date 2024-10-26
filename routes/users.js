var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require("crypto-js");
const db = require('better-sqlite3')('./DB/users.db', { verbose: console.log });

const PROFILE_PIC_BASE_URL = "../public/profileImages";

const CREATE_USER=`INSERT INTO users (uid, username, password, emailid, phonenumber) VALUES (@uid, @username, @password, @emailid, @phonenumber)`;
const CHECK_USER_USERNAME = `SELECT * FROM users WHERE username = @username`;
const USER_LOGIN =`SELECT uid, username, emailid, phonenumber FROM users WHERE username = @username AND password = @password`;

router.post("/register", function(req, res, next){
    try{
        const uid = uuidv4();
        let body = req.body;
        let user = JSON.parse(body.user);
        let files = req.files;      
        if (!user.username || !user.password || !user.emailid || !user.phonenumber) {
            return res.status(400).send({ message: "All fields are required" });
        }
        let encryptedPwd = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(user.password));
        const userData = {
            uid,
            username: user.username,
            password: encryptedPwd,
            emailid: user.emailid,
            phonenumber: user.phonenumber
        };
        const existingUser = db.prepare(CHECK_USER_USERNAME).get({ username: userData.username });       
        if (existingUser) {
            return res.status(400).send({ message: "Username already exists" });
        }
        db.prepare(CREATE_USER).run(userData);  
        if(files){
            let file = files.profilePic;
            const fileExtension = path.extname(file.name);
            let filePath=path.resolve(path.join(__dirname,PROFILE_PIC_BASE_URL,`${uid}${fileExtension}`));
            file.mv(filePath, err => {
                if (err) {
                    res.status(500).send(err);
                } 
            });
        }
        res.send({ message: "User registration successful" });
    } catch (err) {
        res.status(500).send({ message: "Error during user registration:", error: err });
    }    
});

router.post('/login', function(req, res, next) {
    try{
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send({ message: "Username and password are required" });
        }
        let encryptedPwd = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(password));
        const user = db.prepare(USER_LOGIN).get({ username, password:encryptedPwd}); 
        if (!user) {
            return res.status(400).send({ message: "Unauthorized: Invalid username or password" });
        }        
        fs.readdir(path.join(__dirname, PROFILE_PIC_BASE_URL), (err, files) => {
            if (err) {
                return res.status(500).send({ message: "Error accessing profile images." });
            }
            const matchingFile = files.find(file => file.startsWith(user.uid));
            user.profilePic=matchingFile; 
            req.session.username = user.username;
            req.session.save();
            res.send({ message: "Success",user:user});
        });
    } catch (err){
        res.status(500).send({ message: "Error loging in:", error: err });
    }
});

router.post("/logout", function(req, res, next){
    req.session.destroy();
    res.send({ message: "Success" });
});

module.exports = router;