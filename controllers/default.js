exports.install = function() {
    ROUTE('+GET /*'                     );
    ROUTE('GET /login',      view_login);  

    ROUTE('GET  /api/lab3/{id}',  get);   
    ROUTE('POST /api/lab3',       post); 
}

function view_login() {
    var self = this;   
    self.sm = F.sitemap('auth');                      
    self.view('page/login');
}

function get(id) {
    var self = this;
    console.log(id);
    console.log(self.query);
    self.plain('Successfull getting response');
  }
  
  function post() {
    var self = this;
    console.log(self.body);
    self.json(SUCCESS('success'));
  }