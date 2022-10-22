const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");
const { deserializeUser } = require("../models/User");
const { isLoggedIn } = require("../middleware/auth");

// Homepage route 
router.get("/", (req, res) => {
  res.render("homepage.ejs");
});

// Dashboard route
router.get("/dashboard", (req, res) => {
	res.render("dashboard.ejs");
});
// Show registration form route (there is another /register get route)
router.get("/register", (req, res) => {
  res.render("register.ejs");
});

// Registration POST
router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username
  });
  if (req.body.teacherCode === process.env.TEACHER_CODE) {
    newUser.isTeacher = true;
  }
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render("register", { error: err.message });
    }
    passport.authenticate("local")(req, res, function () {
      req.flash(
        "success",
        "Successfully Signed Up! Nice to meet you " + req.body.username
      );
      res.redirect("/");
    });
  });
});

// show form create an account - control by Teacher
router.get("/register", isLoggedIn, function(req, res){
	res.render("register.ejs")
})

// POST login form response
router.post("/", passport.authenticate("local",
{
	successRedirect: "/dashboard",
	failureRedirect:"/",
	successFlash:"Welcome to ABB Ventilation System"
}), function(req,res){
})

// logout route
router.get("/logout", function(req,res){
	req.logout()
	req.flash("success", "See you later!")
	res.redirect("/dashboard") //Why to /dashboard? Should go to / login page imo
})

module.exports = router;
