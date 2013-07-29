control = {

    searchMinute: 0,
    slices: {},
    globalTags: {
        maximum: 0,
        topLevel: {}
    },
    oldGlobalTags: {
        maximum: 0,
        topLevel: {}
    },
    frame: {
        topLevel: {}
    },
    oldFrame: {
        topLevel: {}
    },
    tags: {},
    script: null,
    oldScript: null,
    canvas: null,
    gCtx: null,
    dates: [
        '2013-06-03',
        '2013-06-04',
        '2013-07-05',
        '2013-07-06',
        '2013-07-07',
        '2013-07-08',
        '2013-07-09'
    ],

    init: function() {

        _SEARCHDATE = this.dates.pop();
        this.canvas = document.getElementById('flow');
        this.gCtx = this.canvas.getContext('2d');
        this.fetchMinute();

    },


    fetchMinute: function() {

        //  if we have gone though all the minutes
        //  move onto the next day
        if (control.searchMinute >= 1440) {
            if (control.dates.length > 0) {
                control.searchMinute = 0;
                _SEARCHDATE = control.dates.pop();
            } else {
                console.log('finished!');
                return;
            }
        }

        var params = {
            searchDate: _SEARCHDATE,
            searchMinute: control.searchMinute
        };

        $('.searchMinute').html(_SEARCHDATE + '<br />' + control.searchMinute);

        //  TODO, trap errors here
        $.getJSON("/api/logger.scripts.getByMinute?callback=?", params)
        .success(
            function(data) {

                if ('status' in data && data.status == 'ok') {
                    //  lets go thru all the tags
                    var topLevelTag = null;
                    var secondLevelTag = null;
                    //control.frame = {topLevel: {}};
                    //control.script = data.record.script.tags;

                    for (var key in data.record.script.tags) {
                        //  split the key to get the first and second level tags
                        topLevelTag = key.split('/')[0];
                        secondLevelTag = key.split('/')[1];

                        //  see if the topLevelTag already exists in the globalTags
                        if (topLevelTag in control.globalTags.topLevel) {
                            control.globalTags.topLevel[topLevelTag].totalScore += data.record.script.tags[key].score;
                            control.globalTags.topLevel[topLevelTag].count++;
                            control.globalTags.topLevel[topLevelTag].aveScore = control.globalTags.topLevel[topLevelTag].totalScore / control.globalTags.topLevel[topLevelTag].count;
                            if (data.record.script.tags[key].score > control.globalTags.topLevel[topLevelTag].maxScore) {
                                control.globalTags.topLevel[topLevelTag].maxScore = data.record.script.tags[key].score;
                            }
                        } else {
                            control.globalTags.topLevel[topLevelTag] = {
                                totalScore: data.record.script.tags[key].score,
                                count: 1,
                                aveScore: data.record.script.tags[key].score,
                                maxScore: data.record.script.tags[key].score,
                                tags: {}
                            };
                        }

                        //  And put it into the frame
                        /*
                        if (topLevelTag in control.frame.topLevel) {
                            control.frame.topLevel[topLevelTag].totalScore += data.record.script.tags[key].score;
                            control.frame.topLevel[topLevelTag].count++;
                            control.frame.topLevel[topLevelTag].aveScore = control.frame.topLevel[topLevelTag].totalScore / control.frame.topLevel[topLevelTag].count;
                        } else {
                            control.frame.topLevel[topLevelTag] = {
                                totalScore: data.record.script.tags[key].score,
                                count: 1,
                                aveScore: data.record.script.tags[key].score,
                                maxScore: data.record.script.tags[key].score,
                                tags: {}
                            };
                        }
                        */


                        //  update the maxScore
                        if (data.record.script.tags[key].score > control.globalTags.maximum) {
                            control.globalTags.maximum = data.record.script.tags[key].score;
                        }

                        //  Now we need to put the secondLevelTag into all of that
                        if (secondLevelTag in control.globalTags.topLevel[topLevelTag].tags) {
                            control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].totalScore += data.record.script.tags[key].score;
                            control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].count++;
                            control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].aveScore = control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].totalScore / control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].count;
                            if (data.record.script.tags[key].score > control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].maxScore) {
                                control.globalTags.topLevel[topLevelTag].tags[secondLevelTag].maxScore = data.record.script.tags[key].score;
                            }
                        } else {
                            control.globalTags.topLevel[topLevelTag].tags[secondLevelTag] = {
                                totalScore: data.record.script.tags[key].score,
                                count: 1,
                                aveScore: data.record.script.tags[key].score,
                                maxScore: data.record.script.tags[key].score
                            };
                        }
                    }

                    //  Now we've done that let's draw the lines
                    //control.plotLines();

                } else {
                    //  Something went wrong, lets go and get the
                    //  next record
                }

                //  store the old globals
                //  dirty cheap deep copy.
                /*
                control.oldGlobalTags = JSON.parse(JSON.stringify(control.globalTags));
                control.oldFrame = JSON.parse(JSON.stringify(control.frame));
                control.oldScript = JSON.parse(JSON.stringify(control.script));
                */
                //  next minute
                control.searchMinute++;

                //  and lets do it again
                setTimeout(function() {
                    control.fetchMinute();
                }, 100);

            }
        )
        .error(
            function() {
                //  TODO, handle error condition here
                utils.log('Something went wrong');

                //  next minute
                control.searchMinute++;

                //  and lets do it again
                setTimeout(function() {
                    control.fetchMinute();
                }, 10);

            }
        );
    },

    plotLines: function() {

        //  DRAW ON THE CANVAS!

        //  if this is the first round then don't do anything
        if (this.searchMinute === 0) {
            return;
        }

        //  Now we want to look through all the top level tags
        //  and see if there's a previous entry
        for (var tag in this.script) {
            if (tag in this.oldScript) {
                this.gCtx.moveTo(this.searchMinute-1, 400 - (this.oldScript[tag].score * 4));
                this.gCtx.lineTo(this.searchMinute, 400 - (this.script[tag].score * 4));
                this.gCtx.stroke();
            }
        }

    }


};

utils = {

    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  NOWT
        }
    }

};