// configure dotenv
require('dotenv').config()

const express = require('express')
const mqtt = require('mqtt');
const bodyParser = require("body-parser");
const passport = require("passport");
const crypto = require('crypto');
const mongoose = require('mongoose');
const flash = require("connect-flash")
const methodOverride = require("method-override");
const path = require('path');
const app = express()

// is the user logged in
var loggedInUser = null;

// data
const Data = require("./models/Data")
const User = require('./models/User');
const UserStat = require('./models/Userstat');
const { findById } = require('./models/Data');

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

// PASSPORT CONFIGURATION 
app.use(require("express-session")({
    secret: "SECRET",
    resave: true,
    saveUninitialized: true,
}))

app.use(express.static('./public'))
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

mongoose.connect(process.env.DB_URI, () => {
    console.log("connection to Goose has been established")
}, e => console.error(e))



// AUTHORIZATION AND ROUTING

// Route to login page if user is not logged in, dashboard if it is logged in
app.get("/", (req, res) => {
    if (loggedInUser == null) {
        res.render("homepage.ejs", { message: '' });
    } else {
        res.redirect("/dashboard");
    }
});


// POST login
app.post("/", async (req, res) => {
    await myAuthorizer(req.body.username, req.body.password); //Authorize
    if (loggedInUser != null) {
        res.redirect("/dashboard");
        await UserStat.updateOne(
            { username: req.body.username },
            { $push: { logins: Date.now() } }
        );
    } else {
        res.redirect('/loginerror')
    }
});

app.get("/loginerror", (req, res) => {
    res.render("homepage.ejs", { message: 'Wrong password/username.' });
})

app.get("/registererror", (req, res) => {
    res.render("register.ejs", { message: 'Username already taken.' });
});

// Route to register page if user is not logged in
app.get("/register", (req, res) => {
    if (loggedInUser == null) {
        res.render("register.ejs", { message: '' });
    } else {
        res.redirect("/dashboard");
    }
});

// Route to create a new user in the database
app.post("/register", async (req, res) => {
    crypto.pbkdf2(req.body.password, "salt", 10000, 64, "sha512", async (err, pbkdf2Key) => {
        if (err) throw err;
        if (!(await checkUsername(req.body.username))) { //check if username is taken
            if (req.body.teacherCode == process.env.TEACHER_CODE) {
                const response = await User.create({
                    username: req.body.username,
                    password: pbkdf2Key.toString("hex"),
                    isTeacher: true,
                });
                console.log("User with teacher role created successfully: ", response);
            } else {
                const response = await User.create({
                    username: req.body.username,
                    password: pbkdf2Key.toString("hex"),
                });
                console.log("User with student role created successfully: ", response);
            }
            UserStat.create({ username: req.body.username });
            res.redirect("/");
        } else {
            res.redirect('registererror');
        }
    });
});

// Route to dashboarad if user is logged in
app.get("/dashboard", (req, res) => {
    if (loggedInUser == null) {
        res.redirect("/");
    } else {
        res.render("dashboard.ejs");
    }
});

// Route to send to teacher users stadistics or students stadistics
app.get("/userstats", async (req, res) => {
    if (loggedInUser == null) {
        res.redirect("/");
    } else if (await teacherCheck()) {
        const teacher = await getUserInfo()
        res.render("userstats_teacher.ejs", { teacher });
    } else {
        const student = await getUserInfo()
        res.render("userstats_student.ejs", { student });
    }
});

// Route to send to sensors_page if user is logged in.
app.get("/stats", (req, res) => {
    if (loggedInUser == null) {
        res.redirect('/');
    } else {
        res.render("sensors_chart.ejs")
    }
});

// Route to log out
app.get("/logout", (req, res) => {
    loggedInUser = null;
    res.redirect("/");
});

// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ` + process.env.PORT);
});


// API ROUTES FOR FETCHING INFORMATION

// Route that gets the all the data from the sensors
app.get("/datasensors", async (req, res) => {
    try {
        const datas = await Data.find({});
        const the_data = [];
        for (let data of datas) {
            the_data.push({
                pressure: data.pressure,
                co2: data.co2,
                speed: data.speed,
                temperature: data.temperature,
                auto: data.auto,
                createdAt: data.createdAt
            });
        }
        // console.log(the_data)
        return res.json(the_data);
    } catch (err) {
        console.log(err);
    }
})




// Route to publish data to MQTT when user changes the mode (auto or manual) in dashboard
app.post("/update", async (req, res) => {
    let information = {};
    let the_mode;
    if ("send_mode" in req.body) {
        the_mode = "auto";
        information["auto"] = true;
        information["pressure"] = req.body.sliderPressure;
    } else {
        the_mode = "manual";
        information["auto"] = false;
        information["speed"] = req.body.sliderSpeed;
    }

    if (loggedInUser != null) {
        let the_username = await getUsername();
        try {
            const info = await UserStat.find({ the_username }) // console.log("the info from this user is ", info[0].mode)
            try {
                await UserStat.findOneAndUpdate(
                    { "username": the_username },
                    { "$push": { mode: the_mode } }
                )
            } catch (err) { console.log("Found the user in stats db but could not push the mode") }
        } catch (err) { console.log("Could not find the username in the stats database") }
    }
    // publishing data to MQTT
    client.publish(default_pub_topic, JSON.stringify(information));
    console.log(`Send '${JSON.stringify(information)}' from topic '${default_pub_topic}'`)
})


// Route to return the last data based in the sensors_database
app.get("/getFanPressure", async (req, res) => {
    if (loggedInUser != null) {
        try {
            const fanPressure = await retrieveData();
            res.json(fanPressure[0])
        } catch (err) {
            console.log("could not retrieve information from the latest fan pressure")
        }
    } else {
        res.redirect('/');
    }
})

// Route to return either all the information from the users (if it is a teacher) or information from a specific student
app.get("/getuserdata", async (req, res) => {
    if (loggedInUser != null) {
        try {
            const userdata = await getUserstat(teacherCheck());
            res.json(userdata)
        } catch (err) {
            console.log("could not retrieve user statistics:", err)
        }
    } else {
        res.redirect('/');
    }
})

// Route to return a specific json information for the current user logged in
app.get("/getmyinfo", async (req, res) => {
    if (loggedInUser != null) {
        const userdata = await getUserstat(false);
        console.log(userdata)
        res.json(userdata)
    } else {
        res.redirect('/');
    }
})

// MQTT CONFIGURATION

// Client subscribes and saves data into the database

//const addr = 'mqtt://192.168.1.254:1883';
// let default_pub_topic = "G07/controller/settings"
// let default_sub_topic = "G07/controller/status"


const addr = 'mqtt://192.168.56.1:1883';
let default_pub_topic = "controller/settings"
let default_sub_topic = "controller/status"

const client = mqtt.connect(addr);

client.on("connect", function (err) {
    client.subscribe(default_sub_topic);
    console.log("client has subscribed succesfully");
});

client.on("message", async function (topic, message) {
    var data = JSON.parse(message);
    let new_data = new Data({
        nr: data.nr,
        speed: data.speed,
        setpoint: data.setpoint,
        pressure: data.pressure,
        auto: data.auto,
        error: data.error,
        co2: data.co2,
        rh: data.rh,
        temperature: data.temp,
        date: new Date().toJSON().slice(0, 10).replace(/-/g, "/"),
    });
    try {
        var saved_data = await new_data.save()
        console.log(saved_data)
    } catch (err) {
        console.log(err);
    }
});

// FUNCTIONS USED DURING THE ROUTING

/**
 * @function myAuthorizer
 * @parameters recieves the username of the form input along with its password
 * @description encripts the username and password of the user to register them
 * @return {none} it sets loggedInUser as null or sets 
 **/
async function myAuthorizer(username, password) {
    const key = crypto.pbkdf2Sync(password, "salt", 10000, 64, "sha512");
    const userQuery = await User.findOne({
        username: username,
        password: key.toString("hex"),
    }).then((user) => {
        if (user) {
            loggedInUser = user._id;
        } else {
            loggedInUser = null;
        }
    }).catch((err) => {
        loggedInUser = null;
    });
}

/**
 * @function checkUsername
 * @description Checks whether the username is taken or not
 * @return {object} returns if username is taken(true) or not(false)
 **/
async function checkUsername(username) {
    let taken = false;
    await User.findOne({ username: username }).then(user => {
        if (user) {
            console.log('user found')
            taken = true;
        }
    })
        .catch(err => {
            console.log(err);
        });

    console.log(taken)
    return taken;
}


/**
 * @function getUsername
 * @description gets the username from the id in the user database logginUser /= Null
 * @return {object} returns an the username
 **/
async function getUsername() {
    let username;
    await User.findOne({ _id: loggedInUser }).then(user => {
        username = user.username;
    })
        .catch(err => {
            console.log(err);
        });
    return username;
}


/**
 * @function getUserstat
 * @description if the user calling the function is a teacher, it sends all the users information. 
 * if it is a student, it retrieves just their own information.
 * @return {object} returns all users information or an specific user
 **/
async function getUserstat(teacherCheck) {
    if (await teacherCheck) {
        return UserStat.find({}).exec();
    } else {
        const usr = await getUsername();
        return await UserStat.findOne({ username: usr })
            .exec();
    }
}

/**
 * @function teacherCheck
 * @description check if the current user is a teacher or student
 * @return {object} false if student, true if teacher
 **/
async function teacherCheck() {
    let state;
    const userQuery = await User.findById(loggedInUser)
        .then((user) => {
            state = user.isTeacher;
        })
        .catch((err) => {
            console.log(err);
        });
    return state;
}


/**
 * @function getUserInfo
 * @description gets all the specific information of an user and their user tracking. logginUser /= Null
 * @return {object} returns a how many times an user logged in, what commands have the used.
 **/
async function getUserInfo() {
    let info;
    const username = await getUsername()
    const userQuery = await UserStat.findOne({ username })
        .then((user) => {
            info = user;
        })
        .catch((err) => {
            console.log(err);
        });
    return info;
}

/**
 * @function retrieveData
 * @description it takes the last information saved in the sensors database
 * @return {object} last information from the sensors database
 **/
function retrieveData() {
    return Data.find({}).sort({ createdAt: -1 }).limit(10).exec();
}
