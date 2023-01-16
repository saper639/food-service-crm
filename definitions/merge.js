/**
 * Optimization resource for client
 */

 var p={ vn : 'vendor/',          
 ap : 'app/' };
MERGE('js/vendor.min.js',   [ p.vn+'spa/spa.min.js',						                              
                              p.vn+'bootstrap/bootstrap.min.js',
                              p.vn+'AdminLTE/js/adminlte.js',
                              p.vn+'bootstrap-table/bootstrap-table.min.js',
                              p.vn+'bootstrap-table/bootstrap-table-ru-RU.js',
                              p.vn+'bootstrap-table/export/table-export.js',                                                                    
                              p.vn+'bootstrap-table/export/bootstrap-table-export.js',
                              p.vn+'bootstrap-table/print/table-print.js',
                              p.vn+'bootstrap-table/refresh/table-auto-refresh.js',                                  
                              p.vn+'bootstrap-table/cookie/table-cookie.js',
                              p.vn+'fastclick/fastclick.min.js',
                              p.vn+'datepicker/datepicker.min.js', 
                              p.vn+'datepicker/i18n/datepicker.en.js',                               
]);

MERGE('css/vendor.min.css', [ p.vn+'bootstrap/bootstrap.css',
                              p.vn+'bootstrap/indent.css',                                       
                              p.vn+'AdminLTE/css/AdminLTE.css',     
                              p.vn+'AdminLTE/css/skin-purple.css',                                     
                              p.vn+'bootstrap-table/bootstrap-table.css',                                
                              p.vn+'font-awesome/css/all.css',
                              p.vn+'datepicker/datepicker.css',                                  
]);

MERGE('css/app.min.css',    [   p.ap+'css/style.css',             
                                p.ap+'css/ui.css' 
                            ]);

MERGE('js/app.min.js',      [ p.ap+'js/ui.js',   
                              p.ap+'js/const.js',  
                              p.ap+'js/utilit.js']);

//Fonts
MAP('fonts', p.vn+'font-awesome/fonts/', ['.otf', '.eot', '.svg', '.ttf', '.woff', '.woff2']);
