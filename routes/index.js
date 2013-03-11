

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

