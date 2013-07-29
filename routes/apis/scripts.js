/*jshint loopfunc: true */
var url  = require('url');

scripts = {

    getByMinute: function(request, returnJSON, queryObject, response) {

        control.scriptCollection.findOne({searchDate: queryObject.searchDate, searchMinute: parseInt(queryObject.searchMinute, 10)}, function(err, record) {
            if (err || record === null) {
                returnJSON.status = 'error';
                returnJSON.msg = 'Record not found';
            } else {
                returnJSON.status = 'ok';
                returnJSON.record = record;
            }
            api.closeAndSend(returnJSON, queryObject, response);
        });

    }

};
