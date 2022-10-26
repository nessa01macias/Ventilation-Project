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
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express()
const PORT = 8000


let loggedInUser = null;
// data
const Data = require("./models/Data")
const User = require('./models/User');
const UserStat = require('./models/Userstat');
const setdate = require("./middleware/setdate")
const { findById } = require('./models/Data');

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

// PASSPORT CONFIGURATION 
app.use(require("express-session")({
    secret: "'SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}))

// // configuration
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

// connection to the db
mongoose.connect(process.env.DB_URI, () => {
    console.log("connection to Goose has been established")
}, e => console.error(e))

// Retrieve Data
function retrieveData() {
    return Data.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
}



// created for later on feching to cliend-side the fan pressure
app.get("/getFanPressure", async (req, res) => {
    if (loggedInUser != null) {
        try {
            // the last piece of data saved
            const fanPressure = await retrieveData();
            res.json(fanPressure[0])
        } catch (err) {
            console.log("could not retrieve information from the latest fan pressure")
        }
    } else {
        res.redirect('/');
    }
})

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


//userstats getting
async function getUserstat(teacherCheck) {
    if (await teacherCheck) { // if user is a teacher
        return UserStat.find({})
            .exec();
    } else { // if user is a student
        const usr = await getUsername();
        console.log(usr)
        return await UserStat.findOne({ username: usr })
            .exec();
    }
}

// created for later on feching to cliend-side the fan pressure
app.get("/getuserdata", async (req, res) => {
    if (loggedInUser != null) { //logged in
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

// MQTT CONFIGURATION - SUBSCRIBING & SAVING THE INFO TO A DATABASE
const addr = 'mqtt://192.168.56.1:1883';

let default_pub_topic = "controller/settings"
let default_sub_topic = "controller/status"
const client = mqtt.connect(addr);

client.on("connect", function (err) {
    client.subscribe(default_sub_topic);
    console.log("client has subscribed succesfully")
});

client.on('message', async function (topic, message) {
    // console.log(message)
    var data = JSON.parse(message)
    // console.log("data gotten is", data)
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
        date: new Date().toJSON().slice(0, 10).replace(/-/g, '/')
    })
    // console.log(new_data)
    try {
        // var saved_data = await new_data.save()
        // console.log(saved_data)
    } catch (err) {
        console.log(err);
    }
})



// gets the value of the data in certain date, of the current day!
app.post("/date", setdate, async (req, res) => {
    // today's date
    let theRealDate = res.locals.date
    console.log("Date being used is", theRealDate)

    try {
        // pressure, co2, speed & temperature
        const datas = await Data.find({})
        const sendData = []
        for (let data of datas) {
            let date = data.createdAt.toISOString()
            // console.log(date)
            const [onlyDateDB] = date.split("T")
            // console.log(onlyDateDB)
            if (theRealDate === onlyDateDB) {
                sendData.push({
                    "theRealDate": theRealDate,
                    "date": date,
                    "pressure": data.pressure,
                    "co2": data.co2,
                    "speed": data.speed,
                    "temperature": data.temperature,
                    "auto": data.auto
                })
            }
        }
        console.log(sendData)
        if (sendData.length != 0) res.send(JSON.stringify(sendData))
        else {
            console.log("the array of data is empty")
            res.redirect("/stats")
        }

    } catch (err) {
        console.log(err)
    }
})

// FROM OUR PART WHEN MODE = MANUAL

// Send `{"auto": true, "pressure": 10}` to topic `controller/status`
// FROM THE EMBEDDED'S PART
// Recieved `{"auto": true, "pressure": 10}` from topic `controller/status`
// Send `{"nr": 40, "speed": 13, "setpoint": 10, "pressure": 3, "auto": true, "error": false, "co2": 300, "rh": 37, "temp": 20}` to topic `controller/settings`

// FROM OUR PART WHEN MODE = AUTO
// Send: `{"auto": false, "speed": 10}` from `controller/status` topic
// FROM THE EMBEDDED'S PART
// Recieved  `{"auto": false, "speed": 10}` from `controller/status` topic
// Send `{"nr": 22, "speed": 10, "setpoint": 10, "pressure": 3, "auto": false, "error": false, "co2": 300, "rh": 37, "temp": 20}` to topic `controller/settings`

app.post("/update", async (req, res) => {
    let information = {}
    let the_mode;
    if ('send_mode' in req.body) {
        the_mode = "auto"
        information["auto"] = true
        information["pressure"] = req.body.sliderPressure
    } else {
        the_mode = "manual"
        information["auto"] = false
        information["speed"] = req.body.sliderSpeed
    }

    if (loggedInUser != null) {
        let the_username = await getUsername();
        try {
            const info = await UserStat.find({ the_username })
            // console.log("the info from this user is ", info[0].mode)
            // console.log(the_username, the_mode)
            try {
                await UserStat.findOneAndUpdate( //add login event to usertstat array
                    { "username": the_username },
                    { "$push": { mode: the_mode } }
                )
                // await user.save()
            } catch (err) { console.log("Found the user in stats db but could not push the mode") }
        } catch (err) { console.log("Could not find the username in the stats database") }
    }
    // console.log("we are in ", JSON.stringify(information))
    // publishing
    client.publish(default_pub_topic, JSON.stringify(information));
    console.log(`Send '${JSON.stringify(information)}' from topic '${default_pub_topic}'`)
})

// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ` + process.env.PORT);
});

// AUTHORIZATION AND ROUTING

// Route to login page
app.get('/', (req, res) => {
    if (loggedInUser == null) {
        res.render('homepage.ejs'); //send to login page
    } else {
        res.redirect('/dashboard'); // redirect to dashboard if logged in
    }
});

// Route to register page
app.get('/register', (req, res) => {
    if (loggedInUser == null) {
        res.render('register.ejs'); //send to register page
    } else {
        res.redirect('/dashboard'); // redirect to dashboard if logged in
    }
});

// POST registration
app.post('/register', async (req, res) => {
    crypto.pbkdf2(req.body.password, 'salt', 10000, 64, 'sha512', (err, pbkdf2Key) => {
        if (err) throw err;
        // TODO: check if username exists
        if (req.body.teacherCode == process.env.TEACHER_CODE) {
            User.create({ username: req.body.username, password: pbkdf2Key.toString('hex'), isTeacher: true })
        } else {
            User.create({ username: req.body.username, password: pbkdf2Key.toString('hex') })
        }
        UserStat.create({ username: req.body.username }) //Create userstat entries in DB
        res.redirect('/')
    })
});

// POST login
app.post('/', async (req, res) => {
    await myAuthorizer(req.body.username, req.body.password); //Authorize

    if (loggedInUser != null) {
        res.redirect('/dashboard');
        await UserStat.updateOne( //add login event to usertstat array
            { username: req.body.username },
            { $push: { logins: Date.now() } }
        )
    }
});

// Route to dashboard
app.get('/dashboard', (req, res) => {
    if (loggedInUser == null) {
        res.redirect('/'); //send to login page
    } else {
        res.render('dashboard.ejs'); // redirect to dashboard if logged in
    }
});

// Go to user statistics page
app.get('/userstats', async (req, res) => {
    if (loggedInUser == null) {
        res.redirect('/'); // send to login page
    } else if (await teacherCheck()) { // user is a teacher
        res.render('userstats_teacher.ejs');
    } else { // user is a student
        res.render('userstats_student.ejs', { loggedInUser });
    }
});

app.get("/stats", (req, res) => {
    if (loggedInUser == null) {
        res.redirect('/'); //send to login page
    } else {
        res.render("sensors_chart.ejs") // redirect to sensors_chart if logged in
    }
});

// Route to sensor data
app.get('/logout', (req, res) => {
    loggedInUser = null;
    res.redirect('/'); //send to login page
});

// Authorizer
async function myAuthorizer(username, password) {
    const key = crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha512');

    const userQuery = await User.findOne({ username: username, password: key.toString('hex') }).then(user => {
        if (user) {
            loggedInUser = user._id;
        } else {
            loggedInUser = null;
            req.flash('error', 'You must be signed in to see the content!');
        }
    })
        .catch(err => {
            loggedInUser = null;
        });
}

// checks if logged in user is a teacher or not
async function teacherCheck() {
    let state;
    const userQuery = await User.findById(loggedInUser).then(user => {
        state = user.isTeacher;
    })
        .catch(err => {
            console.log(err);
        });
    return state;
}
