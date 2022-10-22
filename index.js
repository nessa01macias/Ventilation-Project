const express = require('express')
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express()

// Socket set.up
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = 8000;

// EJS
app.use(express.static('./public'))
app.set('view engine', 'ejs');

// data
const Data = require("./models/Data")


// Retrieve Data
function retrieveData() {
    return Data.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
}

// connection to the db
mongoose.connect('mongodb://localhost:27017/sensors_data', () => {
    console.log("connection to Goose has been established")
}, e => console.error(e))


// serving the dasboard 
app.get("/dashboard", async (req, res) => {
    res.render('dashboard.ejs')
})

// created for later on feching to cliend-side the fan pressure
app.get("/getFanPressure", async (req, res) => {
    try {
        // the last piece of data saved
        const fanPressure = await retrieveData();
        res.json(fanPressure[0])
    } catch (err) {
        console.log("could not retrieve information from the latest fan pressure")
    }
})








// MQTT CONFIGURATION - SUBSCRIBING & SAVING THE INFO TO A DATABASE
const addr = 'mqtt://192.168.56.1:1883';

let default_sub_topic = "controller/settings"
const client = mqtt.connect(addr);


client.on("connect", function (err) {
    client.subscribe(default_sub_topic);
    console.log("client has subscribed succesfully")

});


client.on('message', async function (topic, message) {
    var data = JSON.parse(message)
    io.emit("stats", data);

    let new_data = new Data({
        nr: data.nr,
        speed: data.speed,
        setpoint: data.setpoint,
        pressure: data.pressure,
        auto: data.auto,
        error: data.error,
        co2: data.co2,
        rh: data.rh,
        temperature: data.temp
    })
    console.log(new_data)
    try {
        //var saved_data = await new_data.save()
        // console.log(saved_data)
    } catch (err) {
        console.log(err);
    }
})



// gets the value of the data in certain date, of the current day!
app.get("/data", async (req, res) => {
    // today's date
    var isoDate = new Date().toISOString()
    const [onlyDate] = isoDate.split('T');
    //console.log(onlyDate)

    try {
        // pressure, co2, speed & temperature
        const datas = await Data.find({})
        const sendData = []
        for (let data of datas) {
            let date = data.createdAt.toISOString()
            let co2 = data.co2
            let speed = data.speed
            let temperature = data.temperature
            let pressure = data.pressure
            let auto = data.auto
            // console.log(date)
            const [onlyDateDB] = date.split("T")
            // console.log(onlyDateDB)
            if (onlyDate === onlyDateDB) {
                sendData.push({
                    "date": date,
                    "pressure": pressure,
                    "co2": co2,
                    "speed": speed,
                    "temperature": temperature,
                    "auto": auto
                })
            }
        }
        if (sendData.length != 0) res.json(sendData)
        else { res.send("<h2>I do not have data from today!<h2>") }
    } catch (err) {
        console.log(err)
    }
})


app.get("/stats", (req, res) => {
    res.render("sensors_chart.ejs")
})



httpServer.listen(PORT, function (err) {
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", PORT);
})
