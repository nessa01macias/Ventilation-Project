const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const User = require('./models/User')
const flash = require("connect-flash")
const methodOverride = require("method-override");
const LocalStrategy = require("passport-local")
// configure dotenv
require("dotenv").config();

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

// Connects to the mongoDB
mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true, useUnifiedTopology: true }, err=>{
  if(err){
    console.log('Error in connect the database' + err);
  }else{
    console.log('Connected to Mongodb');
  }
});

const userRoute = require('./routes/User')

// Require static assets from public folder 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));

// PASSPORT CONFIGURATION 
app.use(require("express-session")({
    secret:"'SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}))

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.use("/", userRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ` + process.env.PORT);
});
