/**
 * Авторизация пользователей и создание сессии
 */
 var roles = objInvert(_c.Role);

 MAIN.session = SESSION();
 
 MAIN.session.ondata = function(meta, next) {	
    //$$$('Manager').get({'id': meta.id}, next)
 };	
 
 AUTH(function($) {
     var opt = {};
     opt.name = CONF.cookie;
     opt.key = CONF.cookie_secret;
     opt.expire = '1 day';
     opt.removecookie = true;    // Removes cookie if isn't valid (default: true)
     opt.extendcookie = true;    // Extends cookie expiration (default: true)	

     MAIN.session.getcookie($, opt, function(err, user, meta, init) {							
	 //console.log(err);
	 //console.log(user);
	 //console.log(meta);
	 //console.log(init);
         $.success({id:1, first_name: 'Pechenegov', last_name: 'Ivan', login: 'ivan.p', role: 2});
         /*if (user) {						
             $.roles(roles[user.role]);			
             $.success(user);
         } else $.invalid();*/
     })
 })