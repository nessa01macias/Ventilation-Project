# Ventilation-Project
#### Web Interface for ABB Ventilation Controller

# Contents
- [User manual](#user-manual)
  * [Installation](#installation)
  * [Login](#login)
  * [Registration](#registration)
  * [User interface](#user-interface)
  * [Connecting to the device](#connecting-to-the-device)
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
Downloading as .zip is available on the Github interface.
## Login
Log in with your username and password on the localhost:PORT/ route. In case you don't have an account yet, click on the "Register now!" link.
## Registration
You can register an account via the /register route. You will be required to provide a username and a password. To create a teacher/admin account, also provide the secret teacher code. You will be redirected to the login page.
## User interface
When you log in, you will be directed to the dashboard. On this page, you will be able to set the mode (manual or auto) and the corresponding value (fan speed or pressure level) of the ventilation system.
On the top of the page you will find a navigation bar which you can use to access the sensor data, user statistics page or log out.
On the sensors page, you can see the pressure, Co2, speed and temperature measurements and <> on graphs.
On the User stats page, students will see their own account's login details, while teachers will be able to inspect each account's statistics.
## Connecting to the device
To connect the web application to the ventilation system's controller, you have to manually set the MQTT connection up (IP address, port number) hardcoded on the server side.
# Documentation

## Technologies

## Accounts

## Database access

## Controller connection

## Visual design
