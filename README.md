# Ventilation-Project
#### Web Application for ABB Ventilation Controller

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

On the sensors page, you can see the pressure, Co2, speed and temperature measurements and <> on graphs.

On the User stats page, students will see their own account's login details, while teachers will be able to inspect each account's statistics.
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

- [express](https://www.npmjs.com/package/express)
- [mqtt](https://www.npmjs.com/package/mqtt)
- [body-parser](https://www.npmjs.com/package/body-parser)
- [passport](https://www.npmjs.com/package/passport)
- [crypto-js](https://www.npmjs.com/package/crypto-js)
- [mongoose](https://www.npmjs.com/package/mongoose)
- [connect-flash](https://www.npmjs.com/package/connect-flash)
- [method-override](https://www.npmjs.com/package/method-override)
- [express-session](https://www.npmjs.com/package/express-session)
## Accounts
We handle account management with the help of the crypto-js module for password encryption/hashing and MongoDB for storing the account usernames and hashed passwords.
## Database access

## Controller connection

## Visual design
