//  pull in all the stuff we need
var mongodb = require('mongodb');
var colours = require('colors');
var http = require('http');
var url  = require('url');

console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);

colours.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  haiku: 'magenta'
});

//  ############################################################################
//  Check to see if the guardian API key exists in the enviroment vars
//  If not then we need to tell the user they need to set the var
if (!('GUARDIANAPI' in process.env)) {
    console.log('>> You need to set you Guardian API key in your enviroment vars.'.error.bold);
    console.log('>> GUARDIANAPI=[your guardian api key]'.error);
    console.log('>> See: https://groups.google.com/forum/?fromgroups=#!topic/nodejs/1CnOzd352JE for more information'.error);
    process.exit(0);
}

if (!('MONGOHQ_URL' in process.env)) {
    console.log('>> You need to set you MONGOHQ_URL connection thingy in your enviroment vars.'.error.bold);
    console.log('>> MONGOHQ_URL=[your mongodb connection thingy]'.error);
    console.log('>> See: https://groups.google.com/forum/?fromgroups=#!topic/nodejs/1CnOzd352JE for more information'.error);
    process.exit(0);
}

//  ############################################################################

//  We're not actually doing any of this at the moment
var connectionUri = url.parse(process.env.MONGOHQ_URL);
var dbName = connectionUri.pathname.replace(/^\//, '');

mongodb.Db.connect(process.env.MONGOHQ_URL, function(err, mdb) {

  if(err) {

    console.log('Error opening database connection'.error);
    process.exit(0);

  } else {

    require('./control.js');
    control.init(process.env.GUARDIANAPI);
    console.log('Connected just fine'.info);

    control.mdb = mdb;

    mdb.collection('views', function(err, collection) {
      if (!err) {
        control.viewsCollection = collection;
      } else {
        console.log('Error connecting to views collection'.error);
        process.exit(0);
      }
    });

    mdb.collection('editorpicks', function(err, collection) {
      if (!err) {
        control.editorpicksCollection = collection;
      } else {
        console.log('Error connecting to editorpicks collection'.error);
        process.exit(0);
      }
    });

  }

});


//  Now that we have safely got here we can carry on as though nothing is wrong

//  ############################################################################
//  
//  Server stuff
//
//  ############################################################################

http.createServer(function (request, response) {


    //  ########################################################################
    //
    //  tell the favicon to sod off
    //
    //  ########################################################################
    if (request.url === '/favicon.ico') {
        response.writeHead(200, {'Content-Type': 'image/x-icon'} );
        response.end();
        return;
    }


    //  Force a fetch of most viewed
    if (request.url === '/fetchMostViewed') {

        //  For the moment go and fetch the latest articles here
        //  this will normally be on an interval
        control.fetchViews();

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('Fetching most viewed<br />');
        response.write('<p>');
        response.write('<a href="/">Go Back</a>');
        response.write('</p>');
        response.end();
        return;

    }


    //  ########################################################################
    //
    //  THIS IS THE ONE WE REALLY CARE ABOUT, as it will...
    //  Let the user know the current status of the server.
    //
    //  ########################################################################
    request.on('end', function () {

        control.count++;

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<!DOCTYPE html>');
        response.write('<html lang="en">');
        response.write('<head>');
        response.write('  <meta charset="utf-8" />');
        response.write('  <title>Guardian Logger</title>');
        response.write('</head>');
        response.write('<body>');

        response.write('Counter : ' + control.count.toString() + '<br />');

        response.write('</body>');
        response.write('</html>');

        response.end();

    });

}).listen(1337);


console.log('Server running at http://127.0.0.1:1337/'.info);
console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
