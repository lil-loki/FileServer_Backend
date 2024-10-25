var express = require('express');
var path = require('path');
var logger = require('morgan');
var fileUpload = require('express-fileupload');

var directoryRouter = require('./routes/directory');

var cors = require('cors');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  exposedHeaders: ['Content-Disposition'], 
}));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/directory',directoryRouter);

var port = 3000;
app.listen(port, function() {
  console.log(`Server is running on port ${port}`);
});
