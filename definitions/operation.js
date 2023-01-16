NEWOPERATION('ws.notify.order', function(error, value, callback) {			
	F.global.WS.all((client)=>{					
		client.send({'type': 'notify', value: value});		
	});
}) 