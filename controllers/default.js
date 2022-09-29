exports.install = function() {
    ROUTE('+GET /*'                     );
    ROUTE('GET /login',       view_login);   

    ROUTE('GET  /api/test/{id}',  test_get);   
    ROUTE('POST /api/test',       test_post);   
}

function view_login() {
    var self = this;   
    self.sm = F.sitemap('auth');                      
    self.view('page/login');
}

function test_get(id) {
  var self = this;
  console.log(id);
  console.log(self.query);
  self.plain('Test get response');
}

function test_post() {
  var self = this;
  console.log(self.body);
  self.json(SUCCESS('cool'));
}