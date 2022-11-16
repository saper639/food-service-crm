exports.install = function() {
    //user
    ROUTE('POST /api/user/login', ['*user/Login-->@exec']);
    ROUTE('GET /api/user', ['*User-->@get']);
    ROUTE('GET /api/user', ['*User-->@save']);
    ROUTE('GET /api/user', ['*User-->@grid']);
    ROUTE('GET /api/user', ['*User-->@remove']);
}