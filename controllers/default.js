exports.install = function() {
    ROUTE('+GET /*'                     );
    ROUTE('GET /login',      view_login);  
    ROUTE('GET /logout', logout)
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
  