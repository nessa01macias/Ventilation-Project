const express = require('express')
const app = express()
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const Data = require("./models/Data")
const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view-engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/sensors_data', () => {
    console.log("connection to Goose has been established")
}, e => console.error(e))


app.get("/", (req, res) => {
    res.render("index.ejs",)
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.post("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.post("/register", (req, res) => {
})


app.get("/stats", (req, res) => {
    res.render("sensors_chart.ejs")
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
    try {
        var saved_data = await new_data.save()
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
    console.log(onlyDate)

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
            // console.log(date)
            const [onlyDateDB] = date.split("T")
            // console.log(onlyDateDB)
            if (onlyDate === onlyDateDB) {
                sendData.push({
                    "date": date,
                    "pressure": pressure,
                    "co2": co2,
                    "speed": speed,
                    "temperature": temperature
                })
            }
        }
        if (sendData.length != 0) res.json(sendData)
        else { res.send("<h2>I do not have data from today!<h2>") }
    } catch (err) {
        console.log(err)
    }
})


app.listen(PORT, function (err) {
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", PORT);
})