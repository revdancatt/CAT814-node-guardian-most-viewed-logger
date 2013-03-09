var http = require('http');

control = {

    count: 1,
    guardian: {
            key: null
        },
    sections: {
        keys: [
            "/","artanddesign","books","business","commentisfree",
            "culture","education","environment","fashion","film",
            "football","lifeandstyle","media","money","music",
            "politics","science","society","sport","stage",
            "technology","travel","tv-and-radio",
            "uk","world"
        ],
        dict:{
            "/":{"sectionName":"Global"},
            "artanddesign":{"sectionName":"Art and design"},
            "books":{"sectionName":"Books"},
            "business":{"sectionName":"Business"},
            "commentisfree":{"sectionName":"Comment is free"},
            "culture":{"sectionName":"Culture"},
            "education":{"sectionName":"Education"},
            "environment":{"sectionName":"Environment"},
            "fashion":{"sectionName":"Fashion"},
            "film":{"sectionName":"Film"},
            "football":{"sectionName":"Football"},
            "lifeandstyle":{"sectionName":"Life and style"},
            "media":{"sectionName":"Media"},
            "money":{"sectionName":"Money"},
            "music":{"sectionName":"Music"},
            "politics":{"sectionName":"Politics"},
            "science":{"sectionName":"Science"},
            "society":{"sectionName":"Society"},
            "sport":{"sectionName":"Sport"},
            "stage":{"sectionName":"Stage"},
            "technology":{"sectionName":"Technology"},
            "travel":{"sectionName":"Travel"},
            "tv-and-radio":{"sectionName":"Television &amp; radio"},
            "uk":{"sectionName":"UK news"},
            "world":{"sectionName":"World news"}
        }
    },
    fetchSectionsViews: [],
    fetchSectionsPicks: [],

    mdb: null,
    viewsCollection: null,
    picksCollection: null,

    init: function(key) {

        //  set up all the things
        this.guardian.key = key;
        this.count = 6;

        var msTillNextChunk = utils.msTillNextChunk();
        console.log(('>> set next picks fetch to be: ' + msTillNextChunk/1000/60 + 'mins time').info);

        if (this.fetchSectionsViews.length === 0) {
            this.fetchSectionsViews = this.sections.keys.slice();
        }

        if (this.fetchSectionsPicks.length === 0) {
            this.fetchSectionsPicks = this.sections.keys.slice();
        }

        setTimeout( function() {
            control.fetchViews();
            control.fetchPicks();
        }, msTillNextChunk + 1);

    },

    //  This will pop a section off the fetchSectionsViews array and
    //  go grab the data from the guardian for it
    fetchViews: function() {

        //  check to see if any still exists
        if (this.fetchSectionsViews.length === 0) {

            //  if not repopulate the array and set it to go again in
            //  a short while.

            this.fetchSectionsViews = this.sections.keys.slice();
            var msTillNextChunk = utils.msTillNextChunk();

            console.log('>> All view sections fetched'.info);
            console.log(('>> set next view fetch to be: ' + msTillNextChunk/1000/60 + 'mins time').info);

            setTimeout( function() {
                control.fetchViews();
            }, msTillNextChunk + 1);

            return;
        }

        var section = this.fetchSectionsViews.pop();

        //  make the URL
        var url = 'http://content.guardianapis.com/' + section + '?format=json&show-tags=keyword&page-size=1&order-by=newest&show-most-viewed=true&api-key=' + this.guardian.key;

        //  Go fetch it
        //  Go and fetch the results
        http.get(url, function(response) {

            var output = '';

            response.on('data', function(chunk) {
                output += chunk;
            });

            response.on('end', function() {

                //  TODO: put error checking here
                var json = JSON.parse(output);

                //  TODO: handle any of the below failing so we can just carry on
                if ('response' in json && 'status' in json.response && json.response.status == 'ok' && 'mostViewed' in json.response && json.response.mostViewed.length > 0) {
                    control.saveItems(json.response.mostViewed, 'views');
                } else {
                    console.log('>> Didn\'t find results in response'.warn);
                }

                //  Do this again in no time at all
                setTimeout( function() {
                    control.fetchViews();
                }, 200);
            });

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log("Got error: " + e.message);

            //  Do this again in no time at all
            setTimeout( function() {
                control.fetchViews();
            }, 200);

        });


    },

    //  This will pop a section off the fetchSectionsViews array and
    //  go grab the data from the guardian for it
    fetchPicks: function() {

        //  check to see if any still exists
        if (this.fetchSectionsPicks.length === 0) {

            //  if not repopulate the array and set it to go again in
            //  a short while.

            this.fetchSectionsPicks = this.sections.keys.slice();
            var msTillNextChunk = utils.msTillNextChunk();

            console.log('>> All pick sections fetched'.info);
            console.log(('>> set next pick fetch to be: ' + msTillNextChunk/1000/60 + 'mins time').info);

            setTimeout( function() {
                control.fetchPicks();
            }, msTillNextChunk + 1);

            return;
        }

        var section = this.fetchSectionsPicks.pop();

        //  make the URL
        var url = 'http://content.guardianapis.com/' + section + '?format=json&show-tags=keyword&page-size=1&order-by=newest&show-editors-picks=true&api-key=' + this.guardian.key;

        //  Go fetch it
        //  Go and fetch the results
        http.get(url, function(response) {

            var output = '';

            response.on('data', function(chunk) {
                output += chunk;
            });

            response.on('end', function() {

                var json = JSON.parse(output);
                if ('response' in json && 'status' in json.response && json.response.status == 'ok' && 'editorsPicks' in json.response && json.response.editorsPicks.length > 0) {
                    control.saveItems(json.response.editorsPicks, 'picks');
                } else {
                    console.log('>> Didn\'t find results in response'.warn);
                }

                setTimeout( function() {
                    control.fetchPicks();
                }, 200);

            });

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log("Got error: " + e.message);

            //  Do this again in no time at all
            setTimeout( function() {
                control.fetchPicks();
            }, 200);

        });


    },

    saveItems: function(json, where) {

        //  Loop over the results throwing each on at the database in the hope
        //  that they stick
        //
        //  First thought figure out the current time so 
        var d = new Date();
        var hourMins = d.getHours();
        if (hourMins < 10) {
            hourMins = '0' + hourMins;
        }
        if (d.getMinutes() < 10) {
            hourMins += ':0' + d.getMinutes();
        } else {
            hourMins += ':' + d.getMinutes();
        }
        var minsSinceMidnight = d.getHours() * 60 + d.getMinutes();
        var shortDate = null;
        var tagKeysFull = [];
        var tagKeysShort = [];
        var tagsDict = {};
        var item = null;

        //  Now get the first 5 items
        for (var i in json) {

            if (i > 4) break;
            item = json[i];

            tagKeysFull = [];
            tagKeysShort = [];
            tagDict = {};

            //  loop thru the tags making the tags arrays
            for (var t in item.tags) {
                tagKeysFull.push(item.tags[t].id);
                tagKeysShort.push(item.tags[t].id.split('/')[1]);
                tagDict[item.tags[t].id] = item.tags[t].webTitle;
            }

            //  Put the back into the item
            item.position = parseInt(i, 10);
            item.tagKeysFull = tagKeysFull;
            item.tagKeysShort = tagKeysShort;
            item.tagDict = tagDict;
            item.hourMins = hourMins;
            item.minsSinceMidnight = minsSinceMidnight;
            item.shortDate = item.webPublicationDate.split('T')[0];

            //  remove the tags node (to save space)
            delete item.tags;

            this.pushItem(item, where);

        }
    },

    pushItem: function(item, where) {

        if (where == 'views') {
            //  Pop this into the database, we don't really care what happens unless there's an error
            this.viewsCollection.insert(item, {safe: true, keepGoing: true}, function(err, result) {
                if(err) {
                    console.log('>> Error when putting content into the viewsCollection database.'.error);
                    console.log(err);
                } else {
                    //console.log(('>> view record added: ' + item.id).info);
                }
            });
        }

        if (where == 'picks') {
            //  Pop this into the database, we don't really care what happens unless there's an error
            this.picksCollection.insert(item, {safe: true, keepGoing: true}, function(err, result) {
                if(err) {
                    console.log('>> Error when putting content into the picksCollection database.'.error);
                    console.log(err);
                } else {
                    //console.log(('>> picks record added: ' + item.id).info);
                }
            });
        }


    }

};

utils = {

    msTillNextChunk: function() {

            var d = new Date();
            var e = new Date(d);
            var msSinceMidnight = e - d.setHours(0,0,0,0);

            var lastTimeChunk = Math.floor(msSinceMidnight / 1200000);
            var nextTimeChunk = (lastTimeChunk + 1) * 1200000;
            var msTillNextChunk = nextTimeChunk - msSinceMidnight;

            return msTillNextChunk;

    }
};
