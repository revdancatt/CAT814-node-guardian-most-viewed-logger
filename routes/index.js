var url  = require('url');
var Canvas = require('canvas');
var fs = require('fs');

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

    ctx.fillStyle = '#90F';       // Make changes to the settings
    ctx.fillRect(15,15,120,120); // Draw a rectangle with new settings

    ctx.save();                  // Save the current state
    ctx.fillStyle = '#FFF';       // Make changes to the settings
    ctx.globalAlpha = 0.5;
    ctx.fillRect(30,30,90,90);   // Draw a rectangle with new settings

    ctx.restore();               // Restore previous state
    ctx.fillRect(45,45,60,60);   // Draw a rectangle with restored settings

    ctx.restore();               // Restore original state
    ctx.fillRect(60,60,30,30);

    var out = fs.createWriteStream(__dirname + '/../state.png');
    var stream = canvas.createPNGStream();

    stream.on('data', function(chunk){
      out.write(chunk);
    });

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('Making image<br />');
    response.end();

};

exports.getImage = function(request, response){

    var img = fs.readFileSync(__dirname + '/../state.png');
    response.writeHead(200, {'Content-Type': 'image/png' });
    response.end(img, 'binary');

};

