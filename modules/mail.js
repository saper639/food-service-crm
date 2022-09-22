exports.name = "Mail";
exports.version = "1.0";

exports.send = function(to, subject, body) {	
	var mess = new Mail.Message(subject, body);
	mess.to(to);
	mess.from(CONF.mail_address_from, F.global.company.name);
	mess.send(CONF.mail_smtp, CONF.mail_smtp_options);		
	return;
}

Mail.on('error', function (err, mess) {
	LOGGER('error', 'Mail send', err);	        			
});