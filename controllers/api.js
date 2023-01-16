exports.install = function() {
    //user
    ROUTE('POST   /api/user/login',      			  ['*User/Login-->@exec'] );		
    ROUTE('GET    /api/user', 	   			  	      ['*User-->@get']	      );   
    ROUTE('POST   /api/user',  		 			      ['*User-->@save']	      );   
    ROUTE('GET    /api/user/grid',       			  ['*User-->@grid']       );   
    ROUTE('DELETE /api/user/{id}',      			  ['*User-->@remove']     );   
}