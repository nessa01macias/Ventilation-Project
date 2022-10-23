const User = require("../models/User");

module.exports = {

    isLoggedIn: function (req, res, next) {

        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error', 'You must be signed in to see the content!');
        res.redirect('/');
    }, registerRight: function (req, res, next) {
        if (!User.isTeacher) {

        } else {

        }
    },
    isTeacher: function (req, res, next) {

        if (req.user.isAdmin) {
            next()
        } else {
            req.flash('error', 'You do not have a right to access this function')
            res.redirect('back');
        }
    }
}
