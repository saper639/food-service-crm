exports.install = function() {
    ROUTE('+GET /*'                                        );
    ROUTE('GET  /login',              view_login           );   
    ROUTE('GET  /logout'	,         logout               );    
    ROUTE('#401',                     view_error           );           
    ROUTE('#404',                     view_error           ); 
    ROUTE('#408',                     view_error           );
    ROUTE('#431',                     view_error           );
    ROUTE('#500',                     view_error           );
    ROUTE('#501',                     view_error           );            
}

function view_login() {
    var self = this;   
    self.sm = F.sitemap('auth');                      
    self.view('page/login');
}

function logout() {
    var self = this;        
    MAIN.session.remove(self.sessionid);    
    self.cookie(CONF.cookie, '', '-1 day');                
    self.redirect('/');	
}

function custom() {
    console.log('404');
}

function view_error() {
    var self = this;        
    var err = self.route.name;      
    self.sm = F.sitemap('error');        
    var code = err.slice(1);    
    
    //API
    if (/^\/api\//.test(self.req.url)) {        
        self.status = code;
        self.success(false, RESOURCE('!error_'+code));       
        return;        
    }     
    //VIEW
    switch (err) {   
        case '#401':                      
        case '#403': 
            self.redirect('/login'); 
            return;                                                     
        default :             
            self.redirect('/'); 
            self.view('error', {'code': code}); 
            return;           
    }
}        
