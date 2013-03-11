var express = require('express');
var exphbs  = require('express3-handlebars');
var routes  = require('./routes');
var http = require('http');
var path = require('path');

var app = express();
var hbs = exphbs.create({
    helpers: {
        foo: function(x) {
            return 'FOO! ' + (x*2);
        }
    },
    extname: ".html"
});

app.configure(function(){
    app.engine('html', hbs.engine);
    app.set('view engine', 'html');
});

app.get('/', routes.index);

http.createServer(app).listen(3000);
