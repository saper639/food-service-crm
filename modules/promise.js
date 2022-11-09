exports.name = "Promise";
exports.version = "1.0";

exports.get = function(schema, helper, controller) {
	return new Promise((resolve, reject) => {
	  	$$$(schema).get(helper, (err, res) =>{	  		  	
	  		if (err) reject(err);
	  		if (!res.success) reject();
	  		resolve(res.value);	  		  		
	  	}, controller);
	}); 
}

exports.query = function(schema, helper, controller) {
	return new Promise((resolve, reject) => {
	  	$$$(schema).query(helper, (err, res) =>{	  		  	
	  		if (err) reject(err);	  		
	  		resolve(res);	  	
	  }, controller);
	}); 
}


exports.save = function(schema, model, controller, options) {		
	return new Promise((resolve, reject) => {
	  	$$$(schema).save(model, options, (err, res) =>{	  		  	
	  		if (err) reject(err);
	  		if (!res.success) reject();
	  		resolve(res.value);	  	
	  	}, controller);
	}); 
}

exports.remove = function(schema, helper, controller) {		
	return new Promise((resolve, reject) => {	  
	  $$$(schema).remove(helper, (err, res) =>{	  		  	
	  	if (err) reject(err);
	  	if (!res.success) reject();
	  	resolve(res.value);	  	
	  }, controller);
	}); 
}


exports.workflow = function(schema, func, helper, controller) {		
	return new Promise((resolve, reject) => {
 	  	$$$(schema).workflow2(func, helper, (err, res) =>{	  		  	
	  		if (err) reject(err);
	  		resolve(res);	  	
	  	}, controller);
	}); 
}