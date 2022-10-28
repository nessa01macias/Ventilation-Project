
/**
 * @function  fetchSensorsData
 * @description fetches the information from the sensors (/datasensors) to display it in sensors information page. 
 * cleans the json file and returns all the data in a nice array
 * @return {object} information from the sensors
 **/
async function fetchSensorsData() {
    // recieved: pressure, co2, speed & temperature
    let data = await fetch('http://localhost:8000/datasensors')
    let data_json = await data.json()

    let pressure = []
    let co2 = []
    let speed = []
    let temperature = []
    let dates = []
    let manual = 0
    let auto = 0


    for (let data of data_json) {
        pressure.push(data['pressure'])
        co2.push(data['co2'])
        speed.push(data['speed'])
        temperature.push(data['temperature'])
        dates.push(new Date(data['createdAt']).setHours(0, 0, 0, 0))
        if (data.auto) {
            auto = auto + 1
        } else if (!data.auto) {
            manual = manual + 1
        }
    }
    // console.log(pressure, co2, speed, temperature, dates )
    return [pressure, co2, speed, temperature, dates]
};


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
            let last_data_json = await gettingLastData()

            // console.log([labels, pressure, co2, speed, temperature])
            datapoints = [last_data_json.pressure, last_data_json.co2, last_data_json.speed, last_data_json.temperature]
            return datapoints;
        };

        fetchData().then(datapoints => {
            // console.log(datapoints, myChart)

            myPressureChart.config.data.datasets[0].data = [datapoints[0], 100 - datapoints[0]];
            myPressureChart.update();

            myCo2Chart.config.data.datasets[0].data = [datapoints[1], 500 - datapoints[1]];
            myCo2Chart.update();

            mySpeedChart.config.data.datasets[0].data = [datapoints[2], 100 - datapoints[2]];
            mySpeedChart.update();

            myTempatureChart.config.data.datasets[0].data = [datapoints[3], 100 - datapoints[3]];
            myTempatureChart.update();
        })
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function () {
    updateCharts();
})


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


