
/**
 * @function  gettingData
 * @description fetches the data to display in users information page from /getuserdata. if the user making the request
 *  is a student, it returns just their information. if it is a teacher, it returns everyone's information.
 * @return {object} users information / one user information
 **/
async function gettingData() {
    let recievedData = await fetch("/getuserdata")
    let data_json = await recievedData.json()
    return data_json
}

/**
 * @function gettingMyData
 * @description fetches the data of an specific user from /getmyinfo. Made to be able to retrieve the teacher information.
 * @return {object} one user information 
 **/
async function gettingMyData() {
    let recievedData = await fetch("/getmyinfo")
    let data_json = await recievedData.json()
    return data_json
}

/**
 * @function areThereStudent
 * @description checks if there exists any students so the teacher gets displayed only their own information if false, 
 * of everyone's information if true
 * @return {boolean} false = no students, true = yes there are students
 **/
async function areThereStudents() {
    let students = await gettingData()
    if (students.length == 0) {
        return false
    } else {
        return true;
    }
}

/**
 * @function getDates
 * @description function created to display the days in the x axis of the graph in user's information in teachers page.
 * it gets the amount of days between two dates, and which ones those are. Usually the start date is set depending on the needs of the 
 * length of the graph, and the stop date is the current date in time that the person has logged in.
 * @return {Array} contains an array of the days contained between two days
 **/
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

/**
 * @function  getTimesPerDates
 * @parameter {Array, Array}  logins is an array that contains how many times the user has logged in the plataform, and 
 * days is an array that checks in which days we will check if user has logged in
 * @description function made for calculating how many times an specific user logged in one certain day. 
 * example: [10,7] in [10/26/2022, 10/27/2022] which means that user logged in 10 times in the first date and 7 times in the second.
 * @return {object} returns the amout of times user logged in in a date
 **/
function getTimesPerDates(logins, days) {
    let times = []
    let timesperday = 0;

    for (let i = 0; i < days.length; i++) {  //console.log("I am in the day ", days[i])
        for (let j = 0; j < logins.length; j++) { //console.log(" - In the login ", logins[j])
            let onlydateDB = logins[j].slice(0, 10)
            if (days[i] === onlydateDB) {
                timesperday++;  // console.log("Current times ", timesperday)
            }
        }
        times.push(timesperday)  // console.log("in day ", days[i], "this amount of times in this user", times)
        timesperday = 0;
    }
    return times;
}

/**
 * @function getRandomColor
 * @description generates a random color for drawing the lines of the student's log in times in order to display
 * them in the teacher's tracking page
 * @return {String} returns a random color
 **/
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


/**
 * @function maketheHistogram
 * @parameter {Object} 
 * @description creates a histogram depending on the data input. it fills the variable in the html "MyHistoChart"
 * @return {None} 
 **/
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


/**
 * @function maketheLine
 * @parameter {Object} 
 * @description gets the dates for the X axis, the times an user logged in per day for the Y axis, and creates a Line Chart
 * depending on the data input. it fills the variable in the html "myLineChart"
 * @return {None} 
 **/
async function maketheLine(data_json) {

    let days = getDates()
    let times = getTimesPerDates(data_json.logins, days)

    // for (let i = 0; i < days.length; i++) {
    //     console.log(days[i], "had", times[i], "logins")
    // }

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

/**
 * @function maketheTable
 * @parameter {Object} 
 * @description creates a table depending on the data input. it fills the variable in the html "myTable"
 * @return {None} 
 **/

async function maketheTable(data_json) {

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

    // console.log(data)
    var table = document.getElementById('myTable')
    for (var i = 0; i < data.length; i++) {
        var row = `<tr>
                        <td>${data[i].day}</td>
                        <td>${data[i].time}</td>
                 </tr>`
        table.innerHTML += row
    }
}
