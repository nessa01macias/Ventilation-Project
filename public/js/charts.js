async function gettingData() {
    let recievedData = await fetch('http://localhost:8000/data')
    let data_json = await recievedData.json()
    return data_json
}


// Fetch Block for fetching the data from the sensors
function updateCharts() {
    async function fetchData() {
        let data_json = await gettingData()
        // pressure, co2, speed & temperature
        let pressure = []
        let co2 = []
        let speed = []
        let temperature = []
        let labels = []
        let manual = 0
        let auto = 0

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
        datapoints = [[labels, pressure, co2, speed, temperature], [auto, manual]]
        return datapoints;
    };

    fetchData().then(datapoints => {
        console.log(datapoints, myChart)
        myChart.config.data.labels = datapoints[0][0];
        myChart.config.data.datasets[0].data = datapoints[0][1];
        myChart.config.data.datasets[1].data = datapoints[0][2];
        myChart.config.data.datasets[2].data = datapoints[0][3];
        myChart.config.data.datasets[3].data = datapoints[0][4];
        myChart.update();

        myPieChart.config.data.datasets[0].data = datapoints[1];
        myPieChart.update();
    })

}

// FIRST CHART

//set up
const data = {
    labels: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    datasets: [
        {
            label: 'Pressure',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: '#7FB77E',
            backgroundColor: '#7FB77E',
            borderWidth: 1
        },
        {
            label: 'Co2',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: '#E5EBB2',
            backgroundColor: '#E5EBB2',
            borderWidth: 1
        },
        {
            label: 'Speed',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: '#F8C4B4',
            backgroundColor: '#F8C4B4',
            borderWidth: 1
        },
        {
            label: 'Temperature',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            fill: false,
            borderColor: '#FF8787',
            backgroundColor: '#FF8787',
            borderWidth: 1
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

// set up
const datapie = {
    labels: ['Auto', 'Manual'],
    datasets: [{
        label: '# of Mode',
        data: [50, 50],
        backgroundColor: [
            'rgba(54, 162, 235, 0.2)',
            'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [

            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)'
        ],
        borderWidth: 1
    }]
}

// config
const configpie = {
    type: 'doughnut',
    data: datapie,
    options: {
        aspectRatio: 1
    }
};

// render
const myPieChart = new Chart(
    document.getElementById('myPieChart'),
    configpie
);

