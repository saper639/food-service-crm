NEWSCHEMA('User', function(schema) {
    schema.define('id', 'Number');  	 
	schema.setResource('default');       
	schema.setDefault(function(property) {     
		if (property === 'dt') return new Date();   	
  	}); 
	schema.setGet(function ($) {	
	});

	schema.setSave(function ($) {		
	});

	schema.setRemove(function ($) {		
	});

	schema.addWorkflow('grid', function($) {		
        });
})

NEWSCHEMA('User/Login', function(schema) {
	schema.define('email', 'String(100)', true); 
	schema.define('pass', 'String(40)',  true);    
	schema.define('autologin', Boolean, false);

	schema.addWorkflow('exec', async function($) {
	    	try {
		   //
                } catch (err) {
		    LOGGER('error', 'Login', err);                 
	            $.invalid('!auth');                    
        	    return;
 		} 
        })
})