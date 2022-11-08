exports.name = "Utilit";
const fs = require('fs');

/**
 * Redefining the standard response function success()  
 */
global.SUCCESS = function(success, value, dop) {
    if (success === false) return { success: false, error : value, value: dop };
     return { success: true, value : value };
};
/**
 * Check the value for an integer type
 * @param {*} val Variable to be checked.
 * @returns {Boolean} Результат.
 */
global.isNum = function isNum(val) {
    if (isFinite(val) && val !== null) return true
     else return false 
}
/**
 * Inverting the val to key object
 * @param {Object} foo object for investment
 * @return {Object} inverted object
 */
global.objInvert = function objInvert(foo) {
    return Object.keys(foo).reduce((obj, key) => Object.assign({}, obj, { [foo[key]]: key }), {});
}
/** 
 * setting up global constants
 */
exports.setConstant = function() {
    global._c = require('../definitions/constant');
}
/** 
 * setting up params company
 */
exports.setCompany = function() {	
	F.global.company = U.parseJSON(CONF.company)||{};          	
}
/** 
 * set CDN
 */
exports.setCDN = function() {
    MAIN.cdn = {};    
    CONF.cdn = U.parseJSON(CONF.cdn)||{};        
    MAIN.cdn.upload = CONF.cdn.host+'/upload?key='+CONF.cdn.key;    
}
/**
 * Type of root directory depending on the role
 * @param {Number} role role type
 * @return {String} the path for the redirect
 */
global.rootPath = function rootPath(role) {        
    var redirect;
    switch(role) {
        case 1 : redirect = "/admin"; break;
        case 2 : redirect = "/"; break;
    }   
    return redirect;
}