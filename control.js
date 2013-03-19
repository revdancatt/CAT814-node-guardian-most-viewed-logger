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
    scriptCollection: null,

    fetchViewsTmr: null,
    fetchPicksTmr: null,
    makeScriptTmr: null,

    dayScript: {},
    currentMinute: 0,

    init: function(key) {


        //  set up all the things
        this.guardian.key = key;
        this.count = 6;

    },

    startTimers: function() {

        var msTillNextChunk = utils.msTillNextChunk();
        console.log(('>> set next pick and views fetch to be: ' + msTillNextChunk/1000/60 + 'mins time').info);

        if (this.fetchSectionsViews.length === 0) {
            this.fetchSectionsViews = this.sections.keys.slice();
        }

        if (this.fetchSectionsPicks.length === 0) {
            this.fetchSectionsPicks = this.sections.keys.slice();
        }

        clearInterval(control.fetchViewsTmr);
        control.fetchViewsTmr = setTimeout( function() {
            clearInterval(control.fetchViewsTmr);
            console.log('>> Starting fetchViewsTmr interval timer now'.info);
            control.fetchViewsTmr = setInterval( function() {
                console.log(('>> called fetchViews at ' + utils.msSinceMidnight()).info);
                control.fetchViews();
            }, 1000 * 60 * 20);
            console.log(('>> called fetchViews at ' + utils.msSinceMidnight()).info);
            control.fetchViews();
        }, msTillNextChunk + 1);


        clearInterval(control.fetchPicksTmr);
        control.fetchPicksTmr = setTimeout( function() {
            console.log('>> Starting fetchPicksTmr interval timer now'.info);
            clearInterval(control.fetchPicksTmr);
            control.fetchPicksTmr = setInterval( function() {
                console.log(('>> called fetchPicks at ' + utils.msSinceMidnight()).info);
                control.fetchPicks();
            }, 1000 * 60 * 20);
            console.log(('>> called fetchPicks at ' + utils.msSinceMidnight()).info);
            control.fetchPicks();
        }, msTillNextChunk + 1);



        //  Set up the makeScriptTmr to start half way through the next minute
        var d = new Date();
        var e = new Date(d);
        var msSinceMidnight = e - d.setHours(0,0,0,0);
        var minsSinceMidnight = Math.floor(msSinceMidnight / (60 * 1000));
        var futureMs = ((minsSinceMidnight * 60 * 1000) + (90 * 1000)) - msSinceMidnight;
        console.log(('>> setting makeScriptTmr in ' + futureMs / 1000 + 's').info);
        setTimeout(function() {
            clearInterval(control.makeScriptTmr);
            console.log(('>> starting makeScriptTmr interval timer').info);
            control.makeScriptTmr = setInterval(function() {
                control.startGetMinute();
            }, 1000 * 60);
            control.startGetMinute();
        }, futureMs);

    },

    //  This will pop a section off the fetchSectionsViews array and
    //  go grab the data from the guardian for it
    fetchViews: function() {

        //  if there are no sections left then we are done this time round.
        if (this.fetchSectionsViews.length === 0) {
            //  re-populate the views
            this.fetchSectionsViews = this.sections.keys.slice();
            console.log(('>> finished fetchViews at ' + utils.msSinceMidnight()).info);
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
                try {
                    var json = JSON.parse(output);

                    //  TODO: handle any of the below failing so we can just carry on
                    if ('response' in json && 'status' in json.response && json.response.status == 'ok' && 'mostViewed' in json.response && json.response.mostViewed.length > 0) {
                        control.saveItems(json.response.mostViewed, section, 'views');
                    } else {
                        //  Do Nowt
                        //console.log(('>> Didn\'t find results in response for ' + section + ', views').warn);
                    }
                } catch(er) {
                    console.log(('>> Threw an error when converting output to JSON:').warn);
                    console.log(('>> ' + url).warn);
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

        //  check to see if any still exists, if not then we are done
        if (this.fetchSectionsPicks.length === 0) {
            //  re-populate the views
            this.fetchSectionsPicks = this.sections.keys.slice();
            console.log(('>> finished fetchPicks at ' + utils.msSinceMidnight()).info);
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

                try {
                    var json = JSON.parse(output);
                    if ('response' in json && 'status' in json.response && json.response.status == 'ok' && 'editorsPicks' in json.response && json.response.editorsPicks.length > 0) {
                        control.saveItems(json.response.editorsPicks, section, 'picks');
                    } else {
                        //  Do Nowt
                        //console.log(('>> Didn\'t find results in response for ' + section + ', picks').warn);
                    }
                } catch(er) {
                    console.log(('>> Threw an error when converting output to JSON:').warn);
                    console.log(('>> ' + url).warn);
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

    saveItems: function(json, searchSection, where) {

        //  Loop over the results throwing each on at the database in the hope
        //  that they stick
        //
        //  First thought figure out the current time so we can stamp the
        //  record with the day/time
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

        var searchDate = (d.getYear() + 1900) + '-';
        if (d.getMonth() + 1 < 10) {
            searchDate += '0' + (d.getMonth() + 1) + '-';
        } else {
            searchDate += (d.getMonth() + 1) + '-';
        }
        if (d.getDate() < 10) {
            searchDate += '0' + d.getDate();
        } else {
            searchDate += d.getDate();
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
            item.searchSection = searchSection;
            item.tagKeysFull = tagKeysFull;
            item.tagKeysShort = tagKeysShort;
            item.tagDict = tagDict;
            item.hourMins = hourMins;
            item.minsSinceMidnight = minsSinceMidnight;
            item.shortDate = item.webPublicationDate.split('T')[0];
            item.searchDate = searchDate;

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

    },








    //  ####################################################################################
    //  ####################################################################################
    //  ####################################################################################
    //
    //  Below is all about saving the script
    //
    //  ####################################################################################
    //  ####################################################################################
    //  ####################################################################################










    //  This kicks off everything we need for grabbing everything for a day
    getDay: function(dateObj) {

        if (dateObj.month < 10) dateObj.month = '0' + dateObj.month;
        if (dateObj.day < 10) dateObj.day = '0' + dateObj.day;
        var searchDate = dateObj.year + '-' + dateObj.month + '-' + dateObj.day;

        //  we want to start the whole day from scratch so lets clear out the day
        //this.dayScript = {};
        //this.currentMinute = 0;

        console.log(('>> searchDate: ' + searchDate).info);

        //  TODO:
        //  Don't blow away the whole table *just* the one for the
        //  day we are populating
        this.scriptCollection.drop(function() {
            console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
            console.log('>> START'.info);
            control.getMinute(searchDate, '/', 0, [], {}, 'views', true);
        });

    },


    //  This starts the process of getting the data for a minute
    startGetMinute: function() {

        //  Get the time one minute ago
        var d = new Date(new Date()-60000);
        var dateObj = {
            year: d.getYear() + 1900,
            month: d.getMonth() + 1,
            day: d.getDate(),
            lastMinute: d.getHours() * 60 + d.getMinutes()
        };

        if (dateObj.month < 10) dateObj.month = '0' + dateObj.month;
        if (dateObj.day < 10) dateObj.day = '0' + dateObj.day;
        var searchDate = dateObj.year + '-' + dateObj.month + '-' + dateObj.day;

        control.getMinute(searchDate, '/', dateObj.lastMinute, [], {}, 'views', false);

    },


    //  Do the calculations to record the "hotness" of tags
    getMinute: function(searchDate, searchSection, searchMinute, otherSectionsKey, otherSectionsDict, mode, backfill) {



        //  Check to see if we have a dayscript for this day already
        control.scriptCollection.find({searchDate: searchDate, searchMinute: searchMinute}).toArray(function(err, records) {

            var dayScript = {
                tags: {}
            };

            //  if we don't have one then we need to look for a previous
            //  record that we can crib from
            if(err || records.length === 0) {

                control.scriptCollection.find({searchDate: searchDate, searchMinute: {"$lt": searchMinute}}).sort({searchMinute: -1}).limit(1).toArray(function(err, records) {
                    if(err || records.length === 0) {
                        control.getMinuteCont(searchDate, searchSection, searchMinute, otherSectionsKey, otherSectionsDict, dayScript, mode, backfill);
                    } else {

                        var newAge = null;
                        var newScore = null;
                        var record = records[0];

                        for (var t in record.script.tags) {
                            newAge = ++record.script.tags[t].age;
                            newScore = record.script.tags[t].score;

                            //  If we are over 20 mins then start to decay the values
                            if (newAge > 20) {
                                newScore = newScore * 0.99;
                            }
                            //  Only add it back in if it's above a useful threshold,
                            //  this will make them vanish off
                            if (newScore >= 1) {
                                dayScript.tags[t] = {
                                    score: newScore,
                                    age: newAge
                                };
                            }
                        }
                        control.getMinuteCont(searchDate, searchSection, searchMinute, otherSectionsKey, otherSectionsDict, dayScript, mode, backfill);

                    }
                });

            } else {

                //  Otherwise we can use it
                dayScript.tags = records[0].script.tags;
                control.getMinuteCont(searchDate, searchSection, searchMinute, otherSectionsKey, otherSectionsDict, dayScript, mode, backfill);

            }


        });

    },

    getMinuteCont: function(searchDate, searchSection, searchMinute, otherSectionsKey, otherSectionsDict, dayScript, mode, backfill) {


        //  use either the picks or views database
        var dbToUse = control.picksCollection;
        if (mode == 'views') {
            dbToUse = control.viewsCollection;
        }


        //  This goes and gets the 1st set of "global" most viewed for the date
        dbToUse.find({searchDate: searchDate, searchSection: searchSection, minsSinceMidnight: searchMinute}).toArray(function(err, views) {

            //  Go store the views and what have you and get back
            //  a new list of section keys
            var sectionsObj = control.storeViews(views, searchMinute, otherSectionsKey, otherSectionsDict, dayScript);
            otherSectionsKey = sectionsObj.otherSectionsKey;
            otherSectionsDict = sectionsObj.otherSectionsDict;
            dayScript = sectionsObj.dayScript;

            //  Throw the data into the database
            var scriptNode = {
                searchDate: searchDate,
                searchMinute: searchMinute,
                script: dayScript
            };

            control.scriptCollection.update({searchDate: searchDate, searchMinute: searchMinute}, scriptNode, {upsert: true, safe: true, keepGoing: true}, function(err, result) {
                if(err) {
                    console.log('>> Error when putting content into the scriptCollection database.'.error);
                    console.log(err);
                }

                //  if there are any sections left then we need to process them...
                if (otherSectionsKey.length > 0) {
                    var newSearchSection = otherSectionsKey.pop();
                    setTimeout(function() {
                        control.getMinute(searchDate, newSearchSection, searchMinute, otherSectionsKey, otherSectionsDict, mode, backfill);
                    }, 10);
                } else {

                    //  Write the dayscript to the db

                    //  TODO
                    //  MAKE THIS WORK IF WE ARE BACKFILLING!

                    //searchMinute++;

                    //if (searchMinute < 1440) {
                    //    setTimeout(function() {
                    //        control.getMinute(searchDate, '/', searchMinute, otherSectionsKey, mode, backfill);
                    //    });
                    //} else {

                    //    //  If we have just finished the "views" mode we need
                    //    //  to do the whole thing again but with picks
                    //    if (mode == 'views') {
                    //        console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
                    //        console.log('>> moving onto picks'.alert.bold);
                    //        console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
                    //        searchMinute = 0;
                    //        setTimeout(function() {
                    //            control.getMinute(searchDate, '/', searchMinute, otherSectionsKey, 'picks', backfill);
                    //        });
                    //    } else {
                    //        console.log('>> FINISHED'.info);
                    //        console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'.rainbow);
                    //    }
                    //}
                    //

                }

            });




        });

    },

    storeViews: function(views, searchMinute, otherSectionsKey, otherSectionsDict, dayScript) {

        //  Now that we have them we are going to do two things
        //  throw the sections into an array so we can go and fetch those too
        var thisView = null;
        var thisTag = null;

        for (var i in views) {

            thisView = views[i];

            //  Build up the other sections array
            if (!(thisView.sectionId in otherSectionsDict)) {
                otherSectionsDict[thisView.sectionId] = true;
                otherSectionsKey.push(thisView.sectionId);
                //console.log(('>> Found section: ' + thisView.sectionId).info);
            }

            //  And also go thru the tags
            for (var t in thisView.tagKeysFull) {
                thisTag = thisView.tagKeysFull[t];

                //  Now we want to reject any tags where the first hald
                //  and second half are the same
                if (thisTag.split('/')[0] != thisTag.split('/')[1]) {

                    //  If we already have this tag then we need 
                    if (thisTag in dayScript.tags) {
                        dayScript.tags[thisTag].score = dayScript.tags[thisTag].score * 1.01;
                        dayScript.tags[thisTag].age = 1; // <<< - reset the age as we have just spotted it
                    } else {
                        dayScript.tags[thisTag] = {
                            score: 1.6 - ((thisView.position+1) / 10),
                            age: 1
                        };
                    }
                }
            }

        }

        // TODO:
        //  NEED TO RETURN otherSectionsKey AND otherSectionsDict SO THEY CAN BE UPDATED.
        return {otherSectionsKey: otherSectionsKey, otherSectionsDict: otherSectionsDict, dayScript: dayScript};


    }

};

utils = {

    msSinceMidnight: function() {

        var d = new Date();
        var e = new Date(d);
        var msSinceMidnight = e - d.setHours(0,0,0,0);

        return msSinceMidnight;

    },

    msTillNextChunk: function() {

            var msSinceMidnight = this.msSinceMidnight();
            var lastTimeChunk = Math.floor(msSinceMidnight / 1200000);
            var nextTimeChunk = (lastTimeChunk + 1) * 1200000;
            var msTillNextChunk = nextTimeChunk - msSinceMidnight;

            return msTillNextChunk;

    }
};

//  How to find results in a section, in a time range...
//  db.views.find( {shortDate: '2013-03-10', searchSection: '/', minsSinceMidnight: {"$gte": 219, "$lte": 221}}, {id: true, searchSection: true, minsSinceMidnight: true, position: true} ).sort({position: 1})
