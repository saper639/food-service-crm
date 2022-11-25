exports.install = function() {
    //user
    ROUTE('POST   /api/user/login',      			  ['*User/Login-->@exec'] );		
    ROUTE('GET    /api/user', 	   			       	  ['*User-->@get']	      );   
    ROUTE('POST   /api/user',  		 			      ['*User-->@save']	      );   
    ROUTE('GET    /api/user/grid',       			  ['*User-->@grid']       );   
    ROUTE('DELETE /api/user/{id}',      			  ['*User-->@remove']     );

    //product   
    ROUTE('POST   /api/product',                      ['*Product-->@save']    );        
    ROUTE('GET    /api/product',                      ['*Product-->@get']     );        
    ROUTE('DELETE /api/product/{id}',                 ['*Product-->@remove']  );
    ROUTE('GET    /api/product/grid',                 ['*Product-->@grid']    );        

    //product category
    ROUTE('POST   /api/product/category',             ['*Product/Category-->@save'] );        
    ROUTE('GET    /api/product/category',             ['*Product/Category-->@get']  );        
    ROUTE('GET    /api/product/category/query',       ['*Product/Category-->@query']);        

    //proxy
    PROXY('/cdn/upload',    MAIN.cdn.upload                                   );
    FILE('/cdn/image/',     img_proxy     ,           ['.jpg', '.jpeg', '.png', '.gif']);
}

function img_proxy(req, res) {         
    var query = (req.uri.query) ? '?'+req.uri.query : '';
    res.proxy(CONF.cdn.host+'/'+req.path.slice(-2).join('/')+query, NOOP);
    return;
}
