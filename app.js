const express = require('express');
const path = require('path');
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const session = require('express-session');

const directoryRouter = require('./routes/directory.js');
const usersRouter = require('./routes/users.js');

const cors = require('cors');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
  exposedHeaders: ['Content-Disposition'],
}));
app.use(session({
  secret: "OPENAI_API_KEY",
  saveUninitialized: true,
  resave: true
}));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users',usersRouter);
app.use('/directory',directoryRouter);

var port = 3000;
app.listen(port, function() {
  console.log(`Server is running on port ${port}`);
});
