var express = require('express');
var mongodb = require('mongodb');
var colours = require('colors');
var exphbs  = require('express3-handlebars');
var routes  = require('./routes');
var http = require('http');
var path = require('path');
var url  = require('url');

console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);

colours.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  alert: 'magenta'
});


var app = express();
var hbs = exphbs.create({
    extname: ".html"
});

app.configure(function(){
    app.engine('html', hbs.engine);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/templates');
    app.use(express.static(__dirname + '/public'));
    app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(function(request, response, next) {
        throw new Error(request.url + ' not found');
    });
    /*
    app.use(function(err, request, response, next) {
        console.log(('>> ' + err).error);
        response.send(err.message);
    });
    */
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

console.log(('>> Connecting to: ' + process.env.MONGOHQ_URL).info);
console.log(('>> dbName: ' + dbName).info);

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

    mdb.collection('picks', function(err, collection) {
      if (!err) {
        control.picksCollection = collection;
      } else {
        console.log('Error connecting to picks collection'.error);
        process.exit(0);
      }
    });

    mdb.collection('script', function(err, collection) {
      if (!err) {
        control.scriptCollection = collection;
      } else {
        console.log('Error connecting to script collection'.error);
        process.exit(0);
      }
    });

    control.startTimers();

  }

});


app.get('/', routes.index);
app.get('/fetchMostViewed', routes.fetchMostViewed);
app.get('/getDay/:year/:month/:day?', routes.getDay);

/*
app.get('/pet/*', function(request, response) {
    console.log(request.params);
});
*/


http.createServer(app).listen(1337);
