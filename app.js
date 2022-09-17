require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var hbs=require('express-handlebars')
var app = express();
// var fileUpload=require('express-fileUpload')
var db=require('./config/connection')
var session=require('express-session')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
var Hbs=hbs.create({});

// Hbs.handlebars.registerHelper('if_eq', function(a, b, opts) {
//   if(a == b) // Or === depending on your needs
//       return opts.fn(this);
//   else
//       return opts.inverse(this);
// });

Hbs.handlebars.registerHelper('eq', function () {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  return args.every(function (expression) {
      return args[0] === expression;
  });
});
      

app.engine('hbs',hbs.engine({
  extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layouts/',partialsDir:__dirname+'/views/partials/',helpers: {
    inc: function (value, options) {
      return parseInt(value) + 1;
    }
  }
}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const maxAge =24 * 60 * 60 * 1000;
app.use(session({secret:"Key",cookie:{maxAge:maxAge}}))
// app.use(fileUpload())
app.use((req, res, next) => {
  if (!req.user) {
    res.header("cache-control", "private,no-cache,no-store,must revalidate");
    res.header("Express", "-3");
  }
  next();
});
db.connect((err)=>{
  if(err) console.log("Connection Error"+err);
  else console.log("Database Connected to port");
})



app.use('/admin', adminRouter);
app.use('/', usersRouter);

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

module.exports = app;
