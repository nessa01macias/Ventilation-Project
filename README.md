# Ventilation-Project
Created by Metropolia University of Applied Science students, 3rd yead, Smart IoT Systems major.
#### Web Application for ABB Ventilation Controller

# Description
The web user interface covers up this section of the ABB vent control project. The web application enables user interaction with the ABB vent. The following settings can be managed via the web user interface: The user can switch between automatic and manual modes in the mode menu. Speed - When the mode is in manual mode, the user can modify the ABB vent's speed. When the automatic mode is selected, the user can modify the pressure of the ABB vent. Additionally, on the stats page, the user can view the total statistics of the data kept in the database. User sessions, user activity, and sensor data, for instance, between two different time periods 
# Contents
- [User manual](#user-manual)
  * [Installation](#installation)
  * [Login](#login)
  * [Registration](#registration)
  * [User interface](#user-interface)
  * [Setting up the web interface](#setting-up-the-web-interface)
- [Documentation](#documentation)
  * [Technologies](#technologies)
  * [Accounts](#accounts)
  * [Database access](#database-access)
  * [Controller connection](#controller-connection)
  * [Visual design](#visual-design)
# User manual

## Installation
To install the web application, clone the repository into your selected directory.
```
git clone https://github.com/nessa01macias/Ventilation-Project.git
```
Downloading as a .zip package is available on the Github interface.
## Login
Log in with your username and password on the localhost:PORT/ route. In case you don't have an account yet, click on the "Register now!" link.
## Registration
You can register an account via the /register route. You will be required to provide a username and a password. To create a teacher/admin account, also provide the secret teacher code. This code is adjustable and changeable on the server side via a .env environment variable. You will be redirected to the login page.
## User interface
When you log in, you will be directed to the dashboard. On this page, you will be able to set the mode (manual or auto) and the corresponding value (fan speed or pressure level) of the ventilation system.

On the top of the page you will find a navigation bar which you can use to access the sensor data, user statistics page or log out.

On the sensors page, you can see the pressure, Co2, speed and temperature measurements on graphs.

On the User stats page, students will see their own account's login details, while teachers will be able to inspect the login frequency on all accounts and their own statistics.
## Setting up the web interface
To connect the web application to the ventilation system's controller, you have to manually set the MQTT connection up (IP address, port number, topics) hardcoded on the server side. The default topic for commands is <em>'controller/settings'</em> and <em>'controller/status'</em> for reading data from the ventilation system.

You will also need to set up your own database URI, your teacher code, as well as your selected port number as an environment variable.
# Documentation

## Technologies
The foundation of the web application is a Node.js server connected to a NoSQL MongoDB database. The visual look of the application is built via Bootstrap and jsDelivr.

The web interface uses a number of modules which will need to be downloaded using npm before using the application. The command for this is

```
npm i <module-name>
```

The used modules are:
- [animatejs](https://www.npmjs.com/package/animejs)
- [express](https://www.npmjs.com/package/express)
- [mqtt](https://www.npmjs.com/package/mqtt)
- [body-parser](https://www.npmjs.com/package/body-parser)
- [passport](https://www.npmjs.com/package/passport)
- [crypto-js](https://www.npmjs.com/package/crypto-js)
- [mongoose](https://www.npmjs.com/package/mongoose)
- [connect-flash](https://www.npmjs.com/package/connect-flash)
- [method-override](https://www.npmjs.com/package/method-override)
- [express-session](https://www.npmjs.com/package/express-session)
- [chart.js](https://www.npmjs.com/package/chartjs)
- [ejs](https://www.npmjs.com/package/ejs)
## Accounts
We handle account management with the help of the `crypto-js` module for password encryption/hashing and MongoDB for storing the account usernames and hashed passwords. Upon login requests, the input password is hashed and compared to the one in the database after querying for the entry with the username. Other than username and password, the database also records whether the user is a teacher in a boolean value.

Example of a MongoDB user entry.
![Users](https://user-images.githubusercontent.com/70892020/198275946-a433216a-2759-4ee4-b2b7-b15675ec9936.png)

## Database access

The Node.js server connects to the database via the `mongoose` module. The module allows us to create objects in the database based on our schemas and query through them. The schemas used by us describe users, user statistics and controller data.

| Data        | UserStat           | User  |
| :-------------: |:-------------:| :-----:|
| nr: <em>Number</em>| username: <em>String</em> | username:  <em>String</em> |
| speed: <em>Number</em>| logins: <em>[Date]</em>|password:  <em>String</em> |
| setpoint: <em>Number</em> | mode: <em>[String]</em>|isTeacher: <em>Boolean</em> |
| pressure: <em>Number</em> | <em>Timestamps</em>||
| auto: <em>Boolean</em> |||
| error: <em>Boolean</em> |||
| co2: <em>Number</em> |||
| rh: <em>Number</em> |||
| temperature: <em>Number</em> |||
| date: <em>Number</em> |||
| <em>Timestamps</em> |||


## Controller connection

We connect to the ventilation system via MQTT. To do this, we need the `mqtt` module. The setup of the connection is hardcoded in the `index.js` file.

## Visual design
