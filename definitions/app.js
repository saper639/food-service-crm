//connect db
require('sqlagent/mysql').init(CONF.db, CONF.db_log);
//localize
LOCALIZE('/parts/*.html', ['compress']);
LOCALIZE('/forms/*.html', ['compress']);

MODULE('Utilit').setCompany();    
//выбрать cdn
MODULE('Utilit').setCDN();  
//активируем MQTT
MODULE('MQTT').init(); 