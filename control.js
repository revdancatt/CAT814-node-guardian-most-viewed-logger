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
    imageCollection: null,
    poolCollection: null,

    fetchViewsTmr: null,
    fetchPicksTmr: null,
    makeScriptTmr: null,
    cullOldRecordsTmr: null,
    fillPoolTmr: null,

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

        //  Set up cullOldRecords to run every 3 hours, which should cull the records
        //  soon enough. We could work out how to run it at 1 hour past midnight each
        //  day, but what the heck, this means it'll cull within 3 hours of midnight 
        //  happening, and if something goes wrong it'll try again 8 times during the day
        clearInterval(control.cullOldRecordsTmr);
        control.cullOldRecordsTmr = setInterval( function() {
            control.cullOldRecords();
        }, 1000 * 60 * 60 * 3);
        control.cullOldRecords();

        //  Refill the pool every 3 hours or so too, starting 45mins after the cullOldRecords.
        clearInterval(control.fillPoolTmr);
        setTimeout(function() {
            console.log(('>> starting fillPoolTmr interval timer').info);
            control.fillPoolTmr = setInterval( function() {
                control.fillPool();
            }, 1000 * 60 * 60 * 3);
        }, 1000*60*45);


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
                    console.log(er);
                    return;
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
        var tmpd = utils.makeSearchDate(d);
        var searchDate = tmpd.searchDate;
        var hourMins = tmpd.hourMins;

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
                    console.log('>> Error when putting content into the viewsCollection database (' + item.searchSection + ').'.error);
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
                    console.log('>> Error when putting content into the picksCollection database (' + item.searchSection + ').'.error);
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


    },

    cullOldRecords: function() {

        var d = new Date();
        d.setHours(0,0,0,0);
        d = new Date(d - (1000 * 60 * 60 * 24 * 8)); // <--- this will keep a weeks worth of data.
        var searchDate = utils.makeSearchDate(d).searchDate;

        console.log(('>> Culling records for ' + searchDate).info);

        //  Go extract the latest minsSinceMidnight, which is most likely 1,420 but you can never tell
        this.viewsCollection.find({searchDate: searchDate, searchSection: '/', position: 0}, {minsSinceMidnight: true}).sort({minsSinceMidnight: -1}).limit(1).toArray(function(err, records) {

            //  just to make sure we don't kill anything if we rolled over a
            //  minute, let's give ourselves a buffer. We want to kill
            //  anything from before here...
            if (records.length > 0) {
                var cullViewsFromMinutes = records[0].minsSinceMidnight - 10;
                control.viewsCollection.remove({searchDate: searchDate, minsSinceMidnight: {$lt: cullViewsFromMinutes}}, {safe: true}, function(err, result) {
                    if (err) {
                        console.log('>> FAIL when removing views Collection'.error);
                    }
                });
            } else {
                console.log('>> No collections to find'.error);
            }

        });

        //  Go extract the latest minsSinceMidnight, which is most likely 1,420 but you can never tell
        this.picksCollection.find({searchDate: searchDate, searchSection: '/', position: 0}, {minsSinceMidnight: true}).sort({minsSinceMidnight: -1}).limit(1).toArray(function(err, records) {

            //  just to make sure we don't kill anything if we rolled over a
            //  minute, let's give ourselves a buffer. We want to kill
            //  anything from before here...
            if (records.length > 0) {
                var cullPicksFromMinutes = records[0].minsSinceMidnight - 10;
                control.picksCollection.remove({searchDate: searchDate, minsSinceMidnight: {$lt: cullPicksFromMinutes}}, {safe: true}, function(err, result) {
                    if (err) {
                        console.log('>> FAIL when removing picks Collection'.error);
                    }
                });
            } else {
                console.log('>> No picks to find'.error);
            }

        });


        //  and now the scripts
        control.scriptCollection.remove({searchDate: searchDate}, {safe: true}, function(err, result) {
            if (err) {
                console.log('>> FAIL when removing scripts Collection'.error);
            }
        });

    },

    //  This will return a JSON object for the most viewed or most picked for
    //  a date
    getMostX: function(response, params, queryObject) {

        returnJSON = {
            status: 'ok',
            err: '',
            results: []
        };

        //  TODO: add validation here
        var dbToUse = this.viewsCollection;
        if (params.data == 'picks') dbToUse = this.picksCollection;
        var year = parseInt(params.year, 10);
        var month = parseInt(params.month, 10);
        var day = parseInt(params.day, 10);
        if (month < 10) month = '0' + month;
        if (day < 10) day = '0' + day;

        dbToUse.find({searchDate: year + '-' + month + '-' + day, searchSection: params.searchSection},
            {
                searchSection: false,
                tagKeysShort: false,
                tagDict: false,
                hourMins: false,
                minsSinceMidnight: false,
                shortDate: false,
                searchDate: false,
                tagKeysFull: false,
                _id: false
            })
            .sort({minsSinceMidnight: -1, position: 1}).limit(5).toArray(function(err, records)
                {
                    returnJSON.results = records;
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    if ('callback' in queryObject) response.write(queryObject.callback + '(');
                    response.write(JSON.stringify(returnJSON));
                    if ('callback' in queryObject) response.write(')');
                    response.end();
                });

    },

    //  ####################################################################################
    //  ####################################################################################
    //  ####################################################################################
    //
    //  Populate the pool and work out what's the best stuff
    //
    //  ####################################################################################
    //  ####################################################################################
    //  ####################################################################################

    emptyPool: function() {

        console.log('>> In emptyPool'.info);
        control.poolCollection.drop();

    },

    fillPool: function() {


        //  And clear the fetchThese array, we are going to
        //  fill this up with the things we want to check.
        var tmpPool = {
            keys: [],
            urls: {}
        };

        //  Ok, now we want to start filling the pool, to do that we'll
        //  take a number of steps, one after the other
        //  First we need to work out what time of day it is
        var timeOfDay = 'morning';
        console.log('>>in fillPool()'.info);

        this.fillPoolWithPicks('picks', tmpPool, timeOfDay, 6, 6, ['technology', 'lifeandstyle', 'business', 'culture', 'science', '/'], 0);

    },

    fillPoolWithPicks: function(mode, tmpPool, timeOfDay, initialDaysAgo, daysAgo, sectionArray, sectionPointer) {

        //  pick the right collection
        var thisCollection = control.picksCollection;
        if (mode == 'views') {
            thisCollection = control.viewsCollection;
        }

        //  Work out the day we should be looking for.
        //  find the most recent Picks record we have for today
        var searchDate = utils.makeSearchDate(new Date(new Date() - (1000*60*60*24*daysAgo))).searchDate;
        var section = sectionArray[sectionPointer];

        //  Do a sort and limit(1) so we can get the highest value for minsSinceMidnight
        thisCollection.find({searchDate: searchDate, searchSection: section}).sort({minsSinceMidnight: -1}).limit(1).toArray(function(err, records) {

            //  TODO: put error checking in here
            var result = records[0];
            var minsSinceMidnight = result.minsSinceMidnight;

            //  Now the actual search, give and take a few minutes for what we want
            thisCollection.find({searchDate: searchDate, searchSection: section, minsSinceMidnight: {"$gt": minsSinceMidnight - 5, "$lt": minsSinceMidnight + 5 }}).sort({position: 1}).toArray(function(err, records) {

                //  loop through all the records
                for (var r in records) {

                    //  double check the date, trying to take into account the possible rollover in time at midnight
                    if (records[r].shortDate == searchDate || records[r].webPublicationDate.split('T')[1].split(':')[0] == 23) {

                        //  if this isn't the global section, only take things in position 0
                        if (!(section != '/' && records[r].position > 0)) {
                            //  if we already have this url then we update the record, otherwise we add it
                            if (records[r].apiUrl in tmpPool.urls) {

                                //  note that we've just seen this *another* time.
                                tmpPool.urls[records[r].apiUrl].count++;

                                //  If it's moved into a higher position use the higher one.
                                if (records[r].position < tmpPool.urls[records[r].apiUrl].position) {
                                    tmpPool.urls[records[r].apiUrl].position = records[r].position;
                                }

                            } else {

                                //  Record the count and position
                                tmpPool.urls[records[r].apiUrl] = {
                                    count: 1,
                                    position: records[r].position
                                };
                                //  push the key
                                tmpPool.keys.push(records[r].apiUrl);

                            }
                        }
                    }
                }

                //  reduce the daysAgo so we can check the next day
                daysAgo--;

                //  if the days ago hasn't gone into negative numbers
                //  then we need to go through this all over again
                if (daysAgo >= 0) {
                    control.fillPoolWithPicks(mode, tmpPool, timeOfDay, initialDaysAgo, daysAgo, sectionArray, sectionPointer);
                } else {

                    //  lets move the sectionsPointer up one
                    sectionPointer++;

                    //  if we haven't gone off the end of the sections array, lets go back to the first day
                    //  and the next item in the sections array
                    if (sectionPointer < sectionArray.length) {
                        daysAgo = initialDaysAgo;
                        control.fillPoolWithPicks(mode, tmpPool, timeOfDay, initialDaysAgo, daysAgo, sectionArray, sectionPointer);
                    } else {

                        //  Oh no, we've run out of sections, now if we are in 'picks' mode we start
                        //  back at the begining

                        //  we have finished the current collection maybe we need to move onto the next one
                        if (mode == 'picks') {
                            mode = 'views';
                            sectionPointer = 0;
                            daysAgo = initialDaysAgo;
                            control.fillPoolWithPicks(mode, tmpPool, timeOfDay, initialDaysAgo, daysAgo, sectionArray, sectionPointer);
                            return;
                        }

                        //  if we are in 'views' mode then we are done and we can move onto
                        //  parsing the urls to check them
                        if (mode == 'views') {
                            control.fetchUrls(tmpPool);
                        }
                    }

                }

            });

        });

    },

    cleanPool: function() {

        console.log('>> Now cleaning pool'.info);

    },


    fetchUrls: function(tmpPool) {


        //  if there's nothing left to get move onto the next function in the
        //  chain. Bit of an odd way to do it, but there you go
        if (tmpPool.keys.length === 0) {
            control.cullPool(tmpPool);
            return;
        }

        //  grab the apiUrl by popping it off the keys array
        var apiUrl = tmpPool.keys.pop();
        var rawUrl = apiUrl;
        apiUrl += '?format=json&show-tags=keyword&show-fields=publication,wordcount&api-key=' + this.guardian.key;

        //  Go fetch it
        //  Go and fetch the results
        http.get(apiUrl, function(response) {

            var output = '';

            response.on('data', function(chunk) {
                output += chunk;
            });

            response.on('end', function() {

                //  TODO: put error checking here
                try {
                    var json = JSON.parse(output);
                    var isValid = false;

                    //  TODO: handle any of the below failing so we can just carry on
                    if ('response' in json && 'status' in json.response && json.response.status == 'ok') {
                        //  Check to see if we have the fields, and if so check the wordcount and the publication

                        if ('content' in json.response && 'fields' in json.response.content) {

                            //  Check the wordcount
                            if ('wordcount' in json.response.content.fields && parseInt(json.response.content.fields.wordcount, 10) > 900) {

                                //  We have the words
                                isValid = true;

                            }

                        }

                    } else {
                        //  Do Nowt
                        console.log(('>> Didn\'t find a matching result').warn);
                    }

                    //  if it's not valid then we need to remove it from the
                    //  urls
                    if (!isValid) {
                        delete tmpPool.urls[rawUrl];
                    }

                } catch(er) {
                    console.log(('>> Threw an error when converting output to JSON:').warn);
                    console.log(('>> ' + apiUrl).warn);
                    console.log(er);
                    return;
                }

                //  AGAIN! AGAIN!
                setTimeout(function() {
                    control.fetchUrls(tmpPool);
                }, 200);

            });

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log("Got error: " + e.message);

            //  AGAIN! AGAIN!
            setTimeout(function() {
                control.fetchUrls(tmpPool);
            }, 200);

        });

    },

    //  Now pick out 10 items from the pool
    cullPool: function(tmpPool) {

        var newPool = {
            keys: [],
            urls: {}
        };

        //  do the most count thingy
        for (var key in tmpPool.urls) {
            if (tmpPool.urls[key].count >= 4 && newPool.keys.length < 16) {
                newPool.keys.push(key);
                newPool.urls[key] = tmpPool.urls[key];
            }
        }
        //  remove them from the tmpPool
        for (var i in newPool.keys) {
            delete tmpPool.urls[newPool.keys[i]];
        }

        //  again for count == 3
        for (key in tmpPool.urls) {
            if (tmpPool.urls[key].count >= 3 && newPool.keys.length < 16) {
                newPool.keys.push(key);
                newPool.urls[key] = tmpPool.urls[key];
            }
        }
        //  remove them from the tmpPool
        for (i in newPool.keys) {
            delete tmpPool.urls[newPool.keys[i]];
        }

        //  and for count == 2
        for (key in tmpPool.urls) {
            if (tmpPool.urls[key].count >= 2 && newPool.keys.length < 16) {
                newPool.keys.push(key);
                newPool.urls[key] = tmpPool.urls[key];
            }
        }
        //  remove them from the tmpPool
        for (i in newPool.keys) {
            delete tmpPool.urls[newPool.keys[i]];
        }

        //  and for position == 0
        for (key in tmpPool.urls) {
            if (tmpPool.urls[key].position === 0 && newPool.keys.length < 16) {
                newPool.keys.push(key);
                newPool.urls[key] = tmpPool.urls[key];
            }
        }
        //  remove them from the tmpPool
        for (i in newPool.keys) {
            delete tmpPool.urls[newPool.keys[i]];
        }

        //  empty the pool, hopefully this will complete before
        //  we start the next part.
        control.poolCollection.drop();
        control.fetchFullContentAndPutIntoDatabase(newPool);

    },

    fetchFullContentAndPutIntoDatabase: function(newPool) {

        //  if we have run out of urls then we are done.
        if (newPool.keys.length === 0) {
            console.log('>>out fillPool()'.info);
            return;
        }


        //  get the last URL and therefor the position of it, we are
        //  going to get *all* the information from the content API and pop it
        //  into the pool database
        var apiUrl = newPool.keys.pop();
        var position = newPool.keys.length;
        var rawUrl = apiUrl;
        apiUrl += '?format=json&show-tags=all&show-fields=all&show-media=picture&api-key=' + this.guardian.key;


        //  Go fetch it
        //  Go and fetch the results
        http.get(apiUrl, function(response) {

            var output = '';

            response.on('data', function(chunk) {
                output += chunk;
            });

            response.on('end', function() {

                //  TODO: put error checking here
                try {
                    var json = JSON.parse(output);
                    var isValid = false;

                    //  TODO: handle any of the below failing so we can just carry on
                    if ('response' in json && 'status' in json.response && json.response.status == 'ok') {
                        //  Check to see if we have the fields, and if so check the wordcount and the publication

                        var newRecord = {
                            position: position,
                            json: json.response.content
                        };

                        //  Pop it into the database...
                        control.poolCollection.insert(newRecord, {safe: true, keepGoing: true}, function(err, result) {
                            //  and now load up this function again...
                            setTimeout(function() {
                                control.fetchFullContentAndPutIntoDatabase(newPool);
                            }, 500);
                        });


                    } else {
                        //  Do Nowt
                        console.log(('>> Didn\'t find a matching result in fetchFullContentAndPutIntoDatabase').warn);
                        setTimeout(function() {
                            control.fetchFullContentAndPutIntoDatabase(newPool);
                        }, 500);
                    }

                } catch(er) {
                    console.log(('>> Threw an error when converting output to JSON in fetchFullContentAndPutIntoDatabase:').warn);
                    console.log(('>> ' + apiUrl).warn);
                    console.log(er);
                    setTimeout(function() {
                        control.fetchFullContentAndPutIntoDatabase(newPool);
                    }, 500);
                    return;
                }

            });

        }).on('error', function(e) {
            //  TODO: Make sure this doesn't stop everything from ticking over.
            console.log("Got error in fetchFullContentAndPutIntoDatabase: " + e.message);

            //  AGAIN! AGAIN!
            setTimeout(function() {
                control.fetchFullContentAndPutIntoDatabase(newPool);
            }, 200);

        });


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
            msTillNextChunk += 2000; // Add on 1 extra seconds to make sure we start in the minute

            return msTillNextChunk;

    },

    makeSearchDate: function(d) {

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

        return {
            hourMins: hourMins,
            searchDate: searchDate
        };
    }
};

//  How to find results in a section, in a time range...
//  db.views.find( {shortDate: '2013-03-10', searchSection: '/', minsSinceMidnight: {"$gte": 219, "$lte": 221}}, {id: true, searchSection: true, minsSinceMidnight: true, position: true} ).sort({position: 1})
