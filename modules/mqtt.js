exports.name = "MQTT";
var mqtt= require('mqtt');

var broker;

exports.init = function() {	
	broker  = mqtt.connect(CONF.mqtt);

	broker.on("connect", () => {		
  		console.log("Connected to mqtt server");
	});

	broker.on("error", (error) => {
  		console.log("MQTT error:", error);
	});	

	broker.subscribe('notify.order');	

	broker.on('message', function (topic, message) {			
	  	switch (topic) {
	  	 	case 'notify.order': 	  OPERATION('ws.notify.order', 	   JSON.parse(message.toString()), NOOP); break;
	  	}
	})
}	

//create new notify
exports.add = function(route, message) {	
	broker.publish(route, JSON.stringify(message), (err) => {
  		if (err) LOGGER('error', 'MQTT', err);  		
	});
}