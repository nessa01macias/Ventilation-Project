
/**
 * @function  gettingData
 * @description fetches the information from the sensors (/date) to display it in sensors information page. 
 * /date is a POST request as the route is also used to recieve the form information from the calendar input.
 * @return {object} information from the sensors
 **/
async function gettingData() {
    let recievedData = await fetch('http://localhost:8000/date', {
        method: 'POST'
    })
    // console.log("i got the data!")
    let data_json = await recievedData.json()
    return data_json
}

/**
 * @function  gettingLastData
 * @description fetches the last information from the sensors (/date) to display it in dashboard page and for the pressure,
 * co2, speed and temperature graphs. 
 * @return {object} last information saved from the sensors database
 **/
async function gettingLastData() {
    let recievedData = await fetch('http://localhost:8000/getFanPressure')
    let data_json = await recievedData.json()
    return data_json
}


/**
 * @function  updateCharts
 * @description Updates all the charts of the sensors page by fetching the information from the API's, specifically, the new data 
 * being published by the mqtt every couple of seconds. data cleaning is also performed as the graphs need the data to be split into arrays.
 * @return {None} 
 **/
function updateCharts() {
    setInterval(function () {
        async function fetchData() {
            // recieved: pressure, co2, speed & temperature
            let data_json = await gettingData() // console.log(data_json, data_json[0].theRealDate)
            document.getElementById("theRealDate").innerHTML = data_json[0].theRealDate

            let pressure = []
            let co2 = []
            let speed = []
            let temperature = []
            let labels = []
            let manual = 0
            let auto = 0

            let last_data_json = await gettingLastData()

            for (let data of data_json) {
                pressure.push(data['pressure'])
                co2.push(data['co2'])
                speed.push(data['speed'])
                temperature.push(data['temperature'])
                labels.push(data['date'])
                if (data.auto) {
                    auto = auto + 1
                } else if (!data.auto) {
                    manual = manual + 1
                }
            }
            // console.log([labels, pressure, co2, speed, temperature])
            datapoints = [[labels, pressure, co2, speed, temperature], [auto, manual], [last_data_json.pressure, last_data_json.co2, last_data_json.speed, last_data_json.temperature]]
            return datapoints;
        };

        fetchData().then(datapoints => {
            // console.log(datapoints, myChart)
            myChart.config.data.labels = datapoints[0][0];
            myChart.config.data.datasets[0].data = datapoints[0][1];
            myChart.config.data.datasets[1].data = datapoints[0][2];
            myChart.config.data.datasets[2].data = datapoints[0][3];
            myChart.config.data.datasets[3].data = datapoints[0][4];
            myChart.update();

            myPieChart.config.data.datasets[0].data = datapoints[1];
            myPieChart.update();

            myPressureChart.config.data.datasets[0].data = [datapoints[2][0], 100 - datapoints[2][0]];
            myPressureChart.update();

            myCo2Chart.config.data.datasets[0].data = [datapoints[2][1], 500 - datapoints[2][1]];
            myCo2Chart.update();

            mySpeedChart.config.data.datasets[0].data = [datapoints[2][2], 100 - datapoints[2][2]];
            mySpeedChart.update();

            myTempatureChart.config.data.datasets[0].data = [datapoints[2][3], 100 - datapoints[2][3]];
            myTempatureChart.update();

        })
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function () {
    updateCharts();
})

// FIRST CHART

//set up
const data = {
    labels: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    datasets: [
        {
            label: 'Pressure',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: 'rgb(138, 201, 38)',
            backgroundColor: 'rgb(138, 201, 38)',
            borderWidth: 1.5
        },
        {
            label: 'Co2',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: 'rgb(255, 202, 58)',
            backgroundColor: 'rgb(255, 202, 58)',
            borderWidth: 1.5
        },
        {
            label: 'Speed',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: 'rgb(156, 10, 150)',
            backgroundColor: 'rgb(156, 10, 150)',
            borderWidth: 1.5
        },
        {
            label: 'Temperature',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: 'rgb(25, 130, 196)',
            backgroundColor: 'rgb(25, 130, 196)',
            borderWidth: 1.5
        }
    ],
}

// config
const config = {
    type: 'line',
    data: data,
    options: {
        aspectRatio: 1
    }
}

// render
const myChart = new Chart(
    document.getElementById('myChart'),
    config
);


// SECOND CHART

const data_pie = {
    labels: ['Auto', 'Manual'],
    datasets: [{
        label: ['# of auto'],
        data: [50, 50],
        backgroundColor: [
            'rgb(25, 130, 196, 0.2)',
            'rgb(156, 10, 150, 0.2)',
        ],
        borderColor: [
            'rgb(25, 130, 196)',
            'rgb(156, 10, 150)',
        ],
        borderWidth: 1
    }]
}

const config_pie = {
    type: 'bar',
    data: data_pie,
    options: {
        aspectRatio: 1
    },
    plugins: [ChartDataLabels]
};

const myPieChart = new Chart(
    document.getElementById('myPieChart'),
    config_pie
);

// PRESSURE CHART

const data_pressure = {
    labels: [
        'Pressure'
    ],
    datasets: [{
        label: 'Pressure',
        data: [50, 50],
        backgroundColor: [
            'rgb(138, 201, 38, 0.5)',
            'rgb(138, 201, 38, 0.05)'

        ],
        borderColor: [
            'rgb(138, 201, 38)',
            'rgb(138, 201, 38, 0.3)'
        ],
        borderWidth: 1,
        hoverOffset: 1
    }]
};

const config_pressure = {
    type: 'doughnut',
    data: data_pressure,
    options: {},
    plugins: [ChartDataLabels]
};

const myPressureChart = new Chart(
    document.getElementById('myPressureChart'),
    config_pressure
);

// CO2 CHART 

const data_co2 = {
    labels: [
        'Co2'
    ],
    datasets: [{
        label: 'Co2',
        data: [50, 50],
        backgroundColor: [
            'rgb(255, 202, 58, 0.5)',
            'rgb(255, 202, 58, 0.05)'

        ],
        borderColor: [
            'rgb(255, 202, 58)',
            'rgb(255, 202, 58, 0.3)'
        ],
        borderWidth: 1,
        hoverOffset: 1
    }]
};

const config_co2 = {
    type: 'doughnut',
    data: data_co2,
    plugins: [ChartDataLabels]
};

const myCo2Chart = new Chart(
    document.getElementById('myCo2Chart'),
    config_co2
);


// SPEED CHART

const data_speed = {
    labels: [
        'Speed'
    ],
    datasets: [{
        label: 'Speed',
        data: [50, 50],
        backgroundColor: [
            'rgb(156, 10, 150, 0.5)',
            'rgb(156, 10, 150, 0.05)'

        ],
        borderColor: [
            'rgb(156, 10, 150)',
            'rgb(156, 10, 150,0.3)'
        ],
        borderWidth: 1,
        hoverOffset: 1
    }]
};

const config_speed = {
    type: 'doughnut',
    data: data_speed,
    plugins: [ChartDataLabels]
};

const mySpeedChart = new Chart(
    document.getElementById('mySpeedChart'),
    config_speed
);


// TEMPERATURE CHART

const data_temperature = {
    labels: [
        'Temperature'
    ],
    datasets: [{
        label: 'Temperature',
        data: [50, 50],
        backgroundColor: [
            'rgb(25, 130, 196, 0.5)',
            'rgb(25, 130, 196, 0.05)',

        ],
        borderColor: [
            'rgb(25, 130, 196)',
            'rgb(25, 130, 196, 0.3)'
        ],
        borderWidth: 1,
        hoverOffset: 1
    }]
};

const config_temperature = {
    type: 'doughnut',
    data: data_temperature,
    plugins: [ChartDataLabels]
};

const myTempatureChart = new Chart(
    document.getElementById('myTempatureChart'),
    config_temperature
);


