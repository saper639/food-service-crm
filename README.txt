IMPORTANT! 
This repository is responsible only for the backend version of the service

** HOW INSTALL**

1. Install, run the `npm install` command

2. Need to create a `config` file and put it in the root of the project. 
The settings are as follows:

name                        : CRM Food Service
version                     : 0.0.1
author                      : ESSTU student
cookie                      : __user
cookie_secret               : cpbbd83hd92gd
db                          : mysql://<user>:<password>@<host>:<port>/<db>
db_log                      : true
cdn                         : {"host": "http://45.153.231.101:8989", "key":"gjkd75893"}
//Company
company                     : {"brand": "Univer", "name": "Ltd.Univer", "phone": "+7 (9021) 999-999", "email": "support@univer.im", "web" : "http://univer.im"}
//Setting
default_port                :  6447

3. Follow the path /node_modules/sqlagent/mysql.js
   change the first line to `const database = require('mysql2');`
