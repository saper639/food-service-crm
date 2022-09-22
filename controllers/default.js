exports.install = function() {
    ROUTE('+GET /*'                     );
    ROUTE('GET /login',      view_login);   
}

function view_login() {
    var self = this;   
    self.sm = F.sitemap('auth');                      
    self.view('page/login');
}