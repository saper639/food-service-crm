DEF.helpers.head = function() {
	var self = this;  	

	if (U.isArray(self.sm) && self.sm.length > 0) {
		var item = self.sm.find('last', true);						
		return RESOURCE(item.name);		
	} 
	return '';	
}	

DEF.helpers.title = function() {	
	var self = this;  		

	var name = F.global.company.brand||RESOURCE('company');		

	if (U.isArray(self.sm) && self.sm.length > 0) {		
		var item = self.sm.find('last', true);				
		return RESOURCE(item.name)+ " / " + name;	
	} 
	return name;	
}

DEF.helpers.role = function() {
	var self = this; 
	var roleName = ""; 	
	switch (self.user.role) {
		case 1 : roleName = RESOURCE('admin'); break;
		case 2 : roleName = RESOURCE('manager'); break;	
		default : roleName = RESOURCE('unknown'); break;	
	}
	return roleName;	
}