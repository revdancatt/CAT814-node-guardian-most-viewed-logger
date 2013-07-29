/*jshint loopfunc: true */
var url  = require('url');

require('./apis/scripts.js');

api = {

    scripts: scripts,

    parseGet: function(request, response) {

        var queryObject = url.parse(request.url,true).query;
        api.parse(request, response, queryObject);

    },

    //  TODO, lots of error trapping here.
    parsePost: function(request, response) {

        var queryObject = request.body;
        api.parse(request, response, queryObject);

    },

    //  TODO, lots of error trapping here.
    parse: function(request, response, queryObject) {

        //  We want to remove the callback and _ properties from the
        //  display version of the queryObject. This isn't for any
        //  functional reason other then cleaning up thw API output
        var displayQueryObject = {};
        for (var item in queryObject) {
            displayQueryObject[item] = queryObject[item];
        }
        delete displayQueryObject.callback;
        delete displayQueryObject._;

        //  Build up an empty return stub, that will still
        //  hold some useful information, such as the
        //  method called, user and passed over parameters
        var returnJSON = {
            status: 'ok',
            err: '',
            results: [],
            params: displayQueryObject,
            method: request.params.method
        };

        //  check to see if we have the methods defined we need
        //  If we have something that can handle the api method
        //  called then we just hand off to that, otherwise
        //  mark is as an error and send it back.
        var method = request.params.method.split('.');

        if (method.length != 3 || !(method[1] in api) || !(method[2] in api[method[1]])) {
            returnJSON.status = 'error';
            returnJSON.msg ='Method "' + request.params.method + '" not found';
            api.closeAndSend(returnJSON, queryObject, response);
        } else {
            //  call the method we now know to exists
            api[method[1]][method[2]](request, returnJSON, queryObject, response);
        }


    },

    //  we can (and should) call this to write the data out and close it down.
    closeAndSend: function(returnJSON, queryObject, response) {

        response.writeHead(200, {'Content-Type': 'text/html'});
        if ('callback' in queryObject) response.write(queryObject.callback + '(');
        response.write(JSON.stringify(returnJSON));
        if ('callback' in queryObject) response.write(')');
        response.end();

    }

};