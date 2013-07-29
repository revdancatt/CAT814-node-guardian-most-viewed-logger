var url  = require('url');
var Canvas = require('canvas');
var MongoDb = require("mongodb");
var fs = require('fs');

require('./api.js');
exports.api = api;

exports.index = function(request, response){

    var templateValues = {
        count: control.count.toString()
    };

    response.render('index', templateValues);

    control.count++;

};

exports.fetchMostViewed = function(request, response){

    //  For the moment go and fetch the latest articles here
    //  this will normally be on an interval
    control.fetchViews();

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('Fetching most viewed<br />');
    response.write('<p>');
    response.write('<a href="/">Go Back</a>');
    response.write('</p>');
    response.end();

};


exports.getDay = function(request, response){

    //  For the moment go and fetch the latest articles here
    //  this will normally be on an interval
    control.getDay(request.params);

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('Getting day information<br />');
    response.write('<p>');
    response.write('<a href="/">Go Back</a>');
    response.write('</p>');
    response.end();

};

exports.cullOldRecords = function(request, response){

    //  For the moment go and fetch the latest articles here
    //  this will normally be on an interval
    control.cullOldRecords();
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('Culling old records<br />');
    response.write('<p>');
    response.write('<a href="/">Go Back</a>');
    response.write('</p>');
    response.end();

};

exports.getMostX = function(request, response){

    control.getMostX(response, request.params, url.parse(request.url,true).query);

};

exports.getMostXGlobal = function(request, response){

    request.params.searchSection = '/';
    control.getMostX(response, request.params, url.parse(request.url,true).query);

};

exports.storeImage = function(request, response){

    var canvas = new Canvas(150, 150);
    var ctx = canvas.getContext('2d');

    ctx.fillRect(0,0,150,150);   // Draw a rectangle with default settings
    ctx.save();                  // Save the default state

    ctx.fillStyle = '#0F0';       // Make changes to the settings
    ctx.fillRect(15,15,120,120); // Draw a rectangle with new settings

    ctx.save();                  // Save the current state
    ctx.fillStyle = '#FFF';       // Make changes to the settings
    ctx.globalAlpha = 0.5;
    ctx.fillRect(30,30,90,90);   // Draw a rectangle with new settings

    ctx.restore();               // Restore previous state
    ctx.fillRect(45,45,60,60);   // Draw a rectangle with restored settings

    ctx.restore();               // Restore original state
    ctx.fillRect(60,60,30,30);

    //  Turn the ctx into a buffer object
    canvas.toBuffer(function(err, buffer){

        //  Now turn it into a buffer and put it into the database
        var item = {
            msg: 'hello world',
            image: new MongoDb.Binary(buffer)
        };

        control.imageCollection.insert(item, {safe: true, keepGoing: true}, function(err, result) {
            if(err) {
                console.log('>> Error when putting image into the imageCollection database.'.error);
                console.log(err);
            } else {
                console.log(('>> added just fine').info);
            }
            response.writeHead(200, {'Content-Type': 'image/png' });
            response.end(buffer, 'binary');
        });

    });


};

exports.getImage = function(request, response){

    control.imageCollection.findOne({}, function(err, result) {
        if(err) {
            console.log('>> Error when getting image into the imageCollection database.'.error);
            console.log(err);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write('Error getting image');
            response.end();
        } else {
            console.log(('>> got image just fine').info);
            response.writeHead(200, {'Content-Type': 'image/png' });
            response.end(result.image.buffer, 'binary');
        }

    });

    /*
    var img = fs.readFileSync(__dirname + '/../state.png');
    response.writeHead(200, {'Content-Type': 'image/png' });
    response.end(img, 'binary');
    */

};

exports.fillPool = function(request, response){

    control.fillPool(response, response);

};

exports.pool = function(request, response){

    var templateValues = {
        msg: 'pool'
    };

    control.poolCollection.find({}, {position: 1, 'json.webTitle': 1, 'json.webPublicationDate': 1, 'json.webUrl': 1}).sort({position: 1}).toArray(function(err, records) {
        for (var i in records) {
            records[i].json.webPublicationDate = records[i].json.webPublicationDate.split('T')[0];
        }
        templateValues.items = records;
        response.render('pool', templateValues);
    });

};

exports.poolAll = function(request, response){

    var templateValues = {
        msg: 'pool'
    };

    var bestImage = {};
    var maxSize = 0;

    control.poolCollection.find({}).sort({position: 1}).toArray(function(err, records) {
        for (var i in records) {
            bestImage = {};
            maxSize = 0;
            records[i].json.webPublicationDate = records[i].json.webPublicationDate.split('T')[0];
            if ('mediaAssets' in records[i].json) {
                var thisPicture = null;
                for (var j in records[i].json.mediaAssets) {
                    thisPicture = records[i].json.mediaAssets[j];
                    if ('fields' in thisPicture && 'width' in thisPicture.fields) {
                        if (parseInt(thisPicture.fields.width, 10) > maxSize) {
                            bestImage = thisPicture;
                        }
                    }
                }
            }
            records[i].json.mediaAssets = bestImage;
        }
        templateValues.items = records;
        response.render('poolAll', templateValues);
    });

};

exports.poolItem = function(request, response){

    var templateValues = {
        msg: 'pool'
    };

    control.poolCollection.findOne({position: parseInt(request.params.position, 10)}, function(err, result) {

        var bestImage = {};
        var maxSize = 0;
        if ('mediaAssets' in result.json) {
            var thisPicture = null;
            for (var i in result.json.mediaAssets) {
                thisPicture = result.json.mediaAssets[i];
                if ('fields' in thisPicture && 'width' in thisPicture.fields) {
                    if (parseInt(thisPicture.fields.width, 10) > maxSize) {
                        bestImage = thisPicture;
                    }
                }
            }
        }
        result.json.mediaAssets = bestImage;

        templateValues.item = result;
        response.render('poolItem', templateValues);
    });

};

exports.showScript = function(request, response){

    var year = parseInt(request.params.year, 10);
    var month = parseInt(request.params.month, 10);
    var day = parseInt(request.params.day, 10);

    var searchDate = year + '-';
    if (month < 10) {
        searchDate += '0' + month + '-';
    } else {
        searchDate += month + '-';
    }
    if (day < 10) {
        searchDate += '0' + day;
    } else {
        searchDate += day;
    }

    var templateValues = {
        searchDate: searchDate
    };
    response.render('showScript', templateValues);

};

exports.map = function(request, response){

    var templateValues = {};

    response.render('map', templateValues);

};

exports.storyMap = function(request, response){

    var templateValues = {
        msg: 'storyMap'
    };

    control.poolCollection.find({}, {position: 1, 'json.webTitle': 1, 'json.apiUrl': 1}).sort({position: 1}).toArray(function(err, records) {
        templateValues.items = records;
        response.render('storyMap', templateValues);
    });

};



