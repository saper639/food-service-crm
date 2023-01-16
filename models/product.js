NEWSCHEMA('Product').make(function(schema) {    
	schema.define('id'          , 'Number'                        );               
    schema.define('category_id' , 'Number'     ,   true,  'cu'    );       
    schema.define('name'        , 'String(200)',   true,  'cu'    );                   
    schema.define('description' , 'String(500)',          'cu'    );       
    schema.define('summary' 	, 'String(100)',          'cu'    );       
    schema.define('price'       , 'Number'     ,   true,  'cu'    );               
    schema.define('discount'    , 'Number'     ,          'cu'    );           
    schema.define('thumb'       , 'String(100)',          'cu'    );               
    schema.define('imgs'        , 'Object'	   ,          'cu' 	  );           
    schema.define('status'      , 'Number'     ,          'cu'    );                   
    schema.define('created_at'  , 'Date'       ,          'c'     );                  
    schema.define('updated_at'  , 'Date'       ,          'u'     );                  

    schema.setResource('default');     

    schema.setDefault(function(property, isntPreparing, schema) {    
        if (property === 'created_at')  return new Date();   
        if (property === 'updated_at')  return new Date();   
        if (property === 'thumb')       return null;                 
        if (property === 'status')      return 1;                 
    })

    schema.setGet(function ($) {		
		var o = Object.assign({}, U.isEmpty($.query) ? $.options : $.query);									
		var sql = DB(); 
		sql.debug = true;         
		sql.select('product', 'product').make(function(builder) {      			
			if (o.id) builder.in('id', o.id);   			
			if (U.isArray(o.status)) builder.in('status', o.status);      		                  		
	       		else if (typeof o.status == 'string') builder.in('status', (o.status == 'active') ? [1] : (o.status == 'all') ? [0,1] : [0]);                             	
	        	else if (isNum(o.status)) builder.where('status', o.status);                               
	        	else builder.where('status', '>', -1); 
	       	builder.first();		
		})	

		sql.exec(function(err, resp) {                      
			if (err) {        
                LOGGER('error', 'Product/get', err);          
                return $.success(false);	        
            }    			
            if (!resp) $.success(false);
            return $.success(true, resp);                        
		}, 'product')	
	});	

    schema.setRemove(function ($) { 
        var o = Object.assign({}, U.isEmpty($.params) ? $.options : $.params);                                          
        var sql = DB();         
        sql.debug = true;

        if (!o.id) return $.success(false);

        sql.update('product', 'product').make(function (builder) {            
            builder.set('status', -1);  //change status     
            builder.where('id', o.id);          
        })  

        sql.exec(function(err, resp) {                      
            if (err) {
                LOGGER('error', 'Product/remove', err);
                return $.success(false);
            }                       
            if (!resp) $.success(false, 'Product not found');
            return $.success(true);
        }, 'product')  

    });

    schema.setSave(function ($) {     
    	var model = schema.clean($.model); 
		var isINSERT = (model.id ==0) ? true : false;  
		var act = isINSERT ? 'c' : 'u';		
       	var sql = DB();           
	   	sql.debug = true;		   		                         

	   	model.imgs = (model.imgs.length > 0) ? JSON.stringify(model.imgs) : null;	   		   	

        sql.save('product', 'product', isINSERT, function(builder, isINSERT) {
            builder.set(schema.filter('*'+act, model));
            if (!isINSERT) {
                builder.where('id', model.id);          
            }                                     
        })  
        sql.exec(function(err, resp) {          
            if (err) {
                LOGGER('error', 'Product/save', err);                    
             	return $.success(false);	
            }
            if (isINSERT) { 
                model.id = resp.identity;                                           
            }   
            return $.success(true, model);               
        }, 'product')
    }) 

    schema.addWorkflow('grid', function($) { 
        var o = $.query||{};
        var sql = DB();                    
        sql.debug = true;

        sql.listing('product', 'product').make(function(builder) {
        	if (o.category_id > 0) {
                builder.where('category_id', o.category_id);                
            }               
            if (o.sort) builder.sort(o.sort, (o.order=='asc') ? false : true);
                else builder.sort('created_at', true);
            if (o.search) {
                builder.scope(function() {                  
                    builder.like('name', o.search, '*');         
                    builder.or();
                    builder.like('description', o.search, '*');                                 
                });                 
            };            
    		builder.where('status', '>', -1);                         
            builder.page(o.page, o.limit);      
        })	
        sql.exec(function(err, resp) {
            if (err) {
                LOGGER('error', 'Product/grid', err);           
                $.callback([]); 
            }           
            return $.callback({'total': resp.count, 'rows': resp.items});            
        }, 'product');          
	})    	
})	

NEWSCHEMA('Product/Category').make(function(schema) {    
	schema.define('id'          , 'Number'                         );           
	schema.define('up'  	    , 'Number' 	   ,		  'cu'     );
    schema.define('emoji'  	    , 'String(5)'  ,          'cu'     );
    schema.define('name'        , 'String(100)',   true,  'cu'     );                   
    schema.define('description' , 'String(200)',          'cu'     );          
    schema.define('thumb'       , 'String(100)',          'cu'	   );                            
    schema.define('ord'         , 'Number'     ,          'cu'     );              
    schema.define('status'      , 'Number'     ,          'c' 	   );              
	schema.define('created_at'  , 'Date'       ,          'c'      );                  
    schema.define('updated_at'  , 'Date'       ,          'u'      );                  

    schema.setResource('default');     

    schema.setResource('default');     

    schema.setDefault(function(property, isntPreparing, schema) {        	
    	if (property === 'thumb')       return null;                 
        if (property === 'created_at')  return new Date();   
        if (property === 'updated_at')  return new Date();   
        if (property === 'status')      return 1;                 
    })

    schema.setSave(function ($) {     
    	var model = schema.clean($.model); 
		var isINSERT = (model.id ==0) ? true : false;  
		var act = isINSERT ? 'c' : 'u';		
       	var sql = DB();           
	   	sql.debug = true;		   		                         

        sql.save('product_category', 'product_category', isINSERT, function(builder, isINSERT) {
            builder.set(schema.filter('*'+act, model));
            if (!isINSERT) {
                builder.where('id', model.id);          
            }                                     
        })  
        sql.exec(function(err, resp) {          
            if (err) {
                LOGGER('error', 'Product/Category/save', err);                    
             	return $.success(false);	
            }
            if (isINSERT) { 
                model.id = resp.identity;                                           
            }   
            return $.success(true, model);               
        }, 'product_category')
    }) 

    schema.setQuery(function($) {   
        var o = Object.assign({}, U.isEmpty($.query) ? $.options : $.query);									
        if (U.isEmpty(o)) o = {};
        var sql = DB();     
        sql.debug = true;                        
        sql.select('product_category', 'product_category').make(function(builder) {                        
        	if (o.up) builder.where('up', o.up);                           
            if (o.id) builder.in('id', o.id);                           

            if (isNum(o.status)) builder.where('status', o.status);
                else builder.where('status', 1);                
            builder.sort('ord', false);
        });

        sql.exec(function(err, resp) {
            if (err) {
                LOGGER('error', 'Prouct/Category/query', err);          
                return $.success(false);
            }                       
            return $.success(true, resp);
        }, 'product_category');              
    })  
})	