var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// Untuk MQTT
const database = require(path.resolve(__dirname, 'database'));
const mqtt = require('mqtt');
require('dotenv').config();

// Server Config
var port = 3000;
const host = "localhost";

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var fingerRouter = require('./routes/fingerprint');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/fingerprint', fingerRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// MQTT SETUP ABSENSI START ============================
// URL
const url = process.env.URL_HOST 
// Setup options
const options = {
  clean: true,
  connectTimeout: 4000,
  clientId: 'webServerFinger',
  username: 'rifqi',
  password: 'rifqi123',
};
// Koneksi ke broker
const client = mqtt.connect(url, options);
// Query database select uid
const query = `SELECT UID from datanode;`;
// Jalankan query
database.query(query, function(err, data){
  // Jika terkoneksi
  client.on('connect', function(){
    console.log("Berhasil terkoneksi ke broker");
    // Subscribe ke setiap topic
    for (const topic of data) {
      client.subscribe(`/finger/${topic.UID}`, function (err) {
        if (err) {
          console.error(`Error subscribe ke topic /finger/${topic.UID}`, ":", err);
          throw err;
        }
        console.log(`Berhasil subscribe ke /finger/${topic.UID}`);
      });
    }
  });
});
// Jika ada pesan
client.on('message', function(topic, message){
  // Ambil uid dari topic yang masuk
  let uid = topic.split("/").pop();
  if (message.toString() !== "enroll") {
    console.log(uid);
    console.log(message.toString());
  } 
});
// MQTT SETUP ABSENSI END ==============================


app.listen(port, host, () => {
  console.log(`Server jalan di: http://${host}:${port}`);
});

module.exports = app;
