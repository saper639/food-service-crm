var Pr = MODULE('Promise');   

NEWSCHEMA('User', function(schema) {
	schema.define('id'        		, 'Number'     	  	          );  	
	schema.define('first_name'      , 'String(50)',  true, 'cu' 	  );  	
	schema.define('last_name'       , 'String(50)',  true, 'cu'    );  	
	schema.define('role'   		    , 'Number'    ,	  	   'c'     );  	
	schema.define('status'   	    , 'Number'    ,	  	   'c'     );  	
	schema.define('email'   	    , 'String(50)',   	   'cu'    );  	
	schema.define('phone'   	    , 'String(20)',   	   'cu'    );  	
	schema.define('login'   	    , 'String(20)',   	   'c'	  );  	
	schema.define('password'   	    , 'String(50)',   	   'c'	  );  	
	schema.define('telegram_uid'    , 'String(50)',	  	   'cu'	  );  	
	schema.define('created_at'      , 'Datetime'  ,	  	   'c'     );  	
	schema.define('updated_at'      , 'Datetime'  ,	       'u'     );  	

	schema.setResource('default');      

	schema.setDefault(function(property) {    		
		if (property === 'status')      	   return 1;   	
		if (property === 'created_at')         return new Date();   	
		if (property === 'updated_at')         return new Date();   	
  	}); 
	
	schema.setGet(function ($) {		
		var o = Object.assign({}, U.isEmpty($.query) ? $.options : $.query);									
		var sql = DB(); 
		sql.debug = true;         
		sql.select('user', 'user').make(function(builder) {      
			builder.fields('id', 
						   'login', 
						   'first_name', 
						   'last_name', 
						   'role', 
						   'phone', 
						   'email', 
						   'status', 
						   'telegram_uid', 
						   'created_at', 
						   'updated_at');
			if (o.id) builder.in('id', o.id);   
			if (o.email) builder.where('email', o.email);
			if (o.login) builder.where('!lower(login)', o.login);  
			if (o.password) builder.where('password', o.password.md5());	    				
			if (o.role) builder.in('role', o.role);	    				
			if (U.isArray(o.status)) builder.in('status', o.status);      		                  		
	       		else if (typeof o.status == 'string') builder.in('status', (o.status == 'active') ? [1] : (o.status == 'all') ? [0,1] : [0]);                             	
	        	else if (isNum(o.status)) builder.where('status', o.status);                               
	        	else builder.where('status', 1); 
	       	builder.first();		
		})	

		sql.exec(function(err, resp) {                      
			if (err) {        
                LOGGER('error', 'User/get', err);          
                return $.success(false);	        
            }    
			//return $.callback(resp||null);
            if (!resp) $.success(false);
            return $.success(true, resp);                        
		}, 'user')	
	});

	schema.setSave(function ($) {	
		var model = schema.clean($.model); 
		var isINSERT = (model.id ==0) ? true : false;  
		var act = isINSERT ? 'c' : 'u';		
       	var sql = DB();           
	   	sql.debug = true;		   		
	   	sql.save('user', 'user', isINSERT, function(builder, isINSERT) {
	   		builder.set(schema.filter('*'+act, model));
	      	if (model.password) builder.set('password', model.password.md5());    
	      	if (!isINSERT) {
	        	builder.where('id', model.id);        
	      	}            	      	
	    })

	    sql.exec(function(err, user) {	
			if (err) {
				LOGGER('error', 'User/save', err);          	        	
	        	return $.success(false);	
	      	} 
	      	if (isINSERT) model.id = user.identity;                                  
	      	return $.success(true, model);               
  		}, 'user')		
	});

	schema.setRemove(function ($) {	
		var o = Object.assign({}, U.isEmpty($.params) ? $.options : $.params);											
		var sql = DB(); 		
		sql.debug = true;
		
		if (!o.id) return $.success(false);

		sql.update('user', 'user').make(function (builder) {			
			builder.set('status', -1);	//change status		
			builder.where('id', o.id);			
		})	

		sql.exec(function(err, resp) {                      
			if (err) {
				LOGGER('error', 'User/remove', err);
				return $.success(false);
			}						
			if (!resp) $.success(false, 'User not found');
			return $.success(true);
		}, 'user')	

	});

	schema.addWorkflow('grid', function($) {		
    });
})


NEWSCHEMA('User/Login', function(schema) {
	schema.define('login', 	       'String(40)',  true);
	schema.define('password',      'String(50)',  true);    
	schema.define('autologin', 	   'Boolean',    false);

	schema.addWorkflow('exec', async function($) {
	    try {
       		var model = schema.clean($.model);
            var user = await Pr.get('User', model);	
            if (!user) {            	
                $.success(false, RESOURCE('!user_pass'));                
                return; 
            }		

            var opt = {};
            opt.name = CONF.cookie;
            opt.key = CONF.cookie_secret;
            opt.id = user.id;
            opt.expire = (model.autologin) ? '20 days' : '1 day';    
            opt.data = user;  
            MAIN.session.setcookie($, opt, $.done());            
            AUDIT('users', $, 'login', user.id + ': ' + user.login);            	
        } catch (err) {
		    LOGGER('error', 'Login', err);                 
	        return $.success(false, RESOURCE('!auth'));                            	
 		} 
    })
})