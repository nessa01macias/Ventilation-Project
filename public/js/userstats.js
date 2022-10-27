
async function gettingData() {
    let recievedData = await fetch("/getuserdata")
    let data_json = await recievedData.json()
    return data_json
}


async function gettingMyData() {
    let recievedData = await fetch("/getmyinfo")
    let data_json = await recievedData.json()
    return data_json
}


async function areThereStudents() {
    let students = await gettingData()
    if (students.length == 0) {
        return false
    } else {
        return true;
    }
}

function getDates(startDate, stopDate) {
    startDate = "2022-10-23";
    stopDate = new Date().toISOString().slice(0, 10)
    // console.log("startDate", startDate, "- stop date", stopDate)

    var dateArray = [];
    var currentDate = moment(startDate);
    var stopDate = moment(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push(moment(currentDate).format('YYYY-MM-DD'))
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}

function getTimesPerDates(logins, days) {
    // console.log("calculating how many times user logged in per day in", days);
    let times = []
    let timesperday = 0;

    for (let i = 0; i < days.length; i++) {
        //console.log("I am in the day ", days[i])
        for (let j = 0; j < logins.length; j++) {
            //console.log(" - In the login ", logins[j])
            let onlydateDB = logins[j].slice(0, 10)
            if (days[i] === onlydateDB) {
                timesperday++;
                // console.log("Current times ", timesperday)
            }
        }
        times.push(timesperday)
        // console.log("in day ", days[i], "this amount of times in this user", times)
        timesperday = 0;
    }
    return times;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


async function maketheHistogram(data_json) {

    let times = [0, 0] // [auto, manual]

    let modes = data_json.mode
    for (let mode of modes) {
        if (mode === "auto") { times[0]++ }
        else if (mode === "manual") { times[1]++ }
    }

    // set up
    const data_histo = {
        labels: ['Auto', 'Manual'],
        datasets: [{
            label: ['# Auto'],
            data: times,
            backgroundColor: [
                'rgb(104, 156, 197, 0.3)',
                'rgb(156, 10, 150, 0.3)',
            ],
            borderColor: [
                'rgb(104, 156, 197)',
                'rgb(156, 10, 150)',
            ],
            borderWidth: 1
        }]
    }
    // config
    const config_histo = {
        type: 'bar',
        data: data_histo,
        options: {
            aspectRatio: 1,
            plugins: {
                title: {
                    display: true,
                    fullSize: true,
                    text: 'How many times have you set each mode?',
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    };
    // render
    const myHistoChart = new Chart(
        document.getElementById('myHistoChart'),
        config_histo
    );
}


async function maketheLine(data_json) {

    let days = getDates()
    let times = getTimesPerDates(data_json.logins, days)

    for (let i = 0; i < days.length; i++) {
        console.log(days[i], "had", times[i], "logins")
    }

    // set up
    const data_line = {
        labels: days,
        datasets: [{
            label: ['# of times you have logged in per day'],
            data: times,
            backgroundColor: [
                'rgb(59, 67, 104)'
            ],
            borderWidth: 2
        }]
    }
    // config
    const config_line = {
        type: 'line',

        data: data_line,
        options: {
            aspectRatio: 1,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            plugins: {
                title: {
                    display: true,
                    fullSize: true,
                    text: 'How many times do you loggin per day?',
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }

        },
        plugins: [ChartDataLabels]
    };
    // render
    const myLineChart = new Chart(
        document.getElementById('myLineChart'),
        config_line
    );
}


async function maketheTable(data_json) {
    console.log(data_json)
    let logins = data_json.logins
    let data = []
    let eachLogin;

    for (let i = 0; i < logins.length; i++) {
        eachLogin = {
            'day': logins[i].slice(0, 10),
            'time': logins[i].slice(11, 19)
        }
        data.push(eachLogin)
    }

    console.log(data)
    var table = document.getElementById('myTable')
    for (var i = 0; i < data.length; i++) {
        var row = `<tr>
                        <td>${data[i].day}</td>
                        <td>${data[i].time}</td>
                 </tr>`
        table.innerHTML += row
    }
}
