exports.install = function() {	
	WEBSOCKET('+ /ws', handler, ['json'], 3)
}	

F.global.WS = null


function handler() {
	var self = this;
	F.global.WS = self;

	self.on('open', (client) => {			
		console.log('open ws', client.user);		
	})

	self.on('close', (client) => {		
		console.log('close ws', client.user);			
	})
	//handling responses from users
	self.on('message', (client, data) => {				
		console.log(client);
		console.log(data);
	})
}