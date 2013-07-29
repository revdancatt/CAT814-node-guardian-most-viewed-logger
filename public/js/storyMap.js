storyMap = {

    colourMap: {
            "/": '#D61D16',
            "artanddesign": '#7D1553',
            "books": '#7D1553',
            "business": '#233178',
            "commentisfree": '#0B62A7',
            "culture": '#D1238B',
            "education": '#80110D',
            "environment": '#7DA329',
            "fashion": '#FDA72E',
            "film": '#7D1553',
            "football": '#113D0F',
            "lifeandstyle": '#FEC234',
            "media": '#80110D',
            "money": '#8F2AB6',
            "music": '#7D1553',
            "politics": '#80110D',
            "science": '#80110D',
            "society": '#80110D',
            "sport": '#23801F',
            "stage": '#7D1553',
            "technology": '#80110D',
            "travel": '#65C5FB',
            "tv-and-radio": '#7D1553',
            "uk": '#D61D16',
            "world": '#D61D16'
        },
        weightMap: {},
        nodes: [],
        addedNodes: {},
        labelAnchors: [],
        labelAnchorLinks: [],
        addedLinks: {},
        links: [],
        getSections: {
            '/': false,
            world: false
        },
        stories: [],
        fetchingStories: {},
        storyLimit: 2,
        maxCount: 0,

    init: function() {
        utils.log('Hello world!');
        this.fetchApisBySection();
    },

    fetchApisBySection: function() {

        //  See if we been through all the sections yet
        var thisSection = null;
        for (var key in this.getSections) {
            if (this.getSections[key] === false) {
                thisSection = key;
                break;
            }
        }

        //  if we didn't find a section then we can start fecthing the Stories for
        //  the tag data
        if (thisSection === null) {

            //  refill the stories array
            this.stories = [];
            for (key in this.fetchingStories) {
                this.stories.push(key);
            }
            this.fetchStory();
            return;
        }

        //  Now go and get the stories for this section
        var newSection =  thisSection + '/';
        if (newSection == '//') newSection = '';

        var apiUrl = 'http://revdancatt.cat814-node-most-viewed-logger.jit.su/' + newSection + '2013/07/15/views/json?callback=?';
        console.log('>> Fetching: ' + thisSection);

        $.getJSON(apiUrl, function(json) {
            //  Now add them to the stories array
            for (var i in json.results) {
                if (i > storyMap.storyLimit && newSection != '') break;
                if (!(json.results[i].apiUrl in storyMap.fetchingStories)) {
                    storyMap.fetchingStories[json.results[i].apiUrl] = true;
                    storyMap.stories.push(json.results[i].apiUrl);
                }
            }
            storyMap.getSections[thisSection] = true;
            storyMap.getTagsForStories();

        });
    },

    //  Now we are going to grab a story from the list and go see what tags are
    //  attached to it, so we can figure out if we need to fetch any other sections
    getTagsForStories: function() {

        if (this.stories.length === 0) {
            this.fetchApisBySection();
            return;
        }

        //  Go grab an apiUrl off the list
        var apiUrl = this.stories.pop();

        //  Fetch that from the guardian API
        apiUrl += '?format=json&show-tags=keyword&callback=?';

        $.getJSON(apiUrl, function(json) {
            //  grab the tags
            try {
                var tags = json.response.content.tags;
                var tagNode = null;
                var section = null;
                for (var i in tags) {
                    tagNode = tags[i];
                    section = tagNode.id.split('/')[0];
                    if (!(section in storyMap.getSections)) {
                        storyMap.getSections[section] = false;
                    }
                }
            } catch(er) {
                //  Nowt
            }
            storyMap.getTagsForStories();
        });

    },

    fetchStory: function() {

        if (this.stories.length === 0) {
            utils.log('>> Finished');
            storyMap.plotMap();
            return;
        }

        /*
        if (storyMap.nodes.length > 6) {
            utils.log('>> Quit early')
            storyMap.plotMap();
            return;
        }
        */

        //  Go grab an apiUrl off the list
        var apiUrl = this.stories.pop();

        //  Fetch that from the guardian API
        apiUrl += '?format=json&show-tags=keyword&callback=?';
        console.log('>> Fetching: (' + this.stories.length + ') ' + apiUrl);

        $.getJSON(apiUrl, function(json) {
            //  grab the tags
            try {
                var tags = json.response.content.tags;
            } catch(er) {
                setTimeout(function() {
                    storyMap.fetchStory();
                }, 500);
                return;
            }

            var tag = null;
            var tagNode = null;
            var section = null;
            var miniTagArray = [];
            var miniLinks = {};

            //  loop through them
            for (var i in tags) {
                tagNode = tags[i];
                section = tagNode.id.split('/')[0];
                tag = tagNode.id.split('/')[1];

                //if (section == tag) continue;

                miniTagArray.push(tag);

                //  if we already have this tag then just increase it's count by one
                if (tag in storyMap.addedNodes) {
                    storyMap.addedNodes[tag].count++;
                    if (storyMap.addedNodes[tag].count > storyMap.maxCount) {
                        storyMap.maxCount = storyMap.addedNodes[tag].count;
                    }
                } else {

                    //  Otherwise create a new entry for it, note that we are
                    //  storing an index, that's because we have to do a weird
                    //  thing with linking them up together later (sigh)
                    storyMap.addedNodes[tag] = {
                        count: 1,
                        index: storyMap.nodes.length,
                        webTitle: tagNode.webTitle,
                        colour: '#D61D16'
                    };

                    if (storyMap.addedNodes[tag].count > storyMap.maxCount) {
                        storyMap.maxCount = storyMap.addedNodes[tag].count;
                    }

                    //  If we know the colour for this section then use that instead
                    if (section in storyMap.colourMap) {
                        storyMap.addedNodes[tag].colour = storyMap.colourMap[section];
                    }

                    //  Now we need to put it into the nodes array, mainly so we can keep the
                    //  index value correct (yes I know this is a bit odd, but sometimes having an
                    //  array of the map is useful)
                    storyMap.nodes.push(tag);
                }
            };

            //  Now that we have been thru all the tags we need to go thru them again
            //  linking them together
            var sortMe = null;
            for (var m in miniTagArray) {
                for (var n in miniTagArray) {

                    //  Tiresome way to join the nodes together, yeah I know
                    //  the number of loops could be cut down by half, but 
                    //  this is hardly important rocket science.
                    sortMe = [];
                    sortMe.push(storyMap.addedNodes[miniTagArray[m]].index);
                    sortMe.push(storyMap.addedNodes[miniTagArray[n]].index);
                    if (sortMe[0] == sortMe[1]) {
                        continue;
                    }

                    sortMe.sort();
                    sortMe = sortMe.join('-');

                    //  Now see if we already have it
                    if (!(sortMe in miniLinks)) {
                        miniLinks[sortMe] = 1;
                    }
                }
            }

            //  Phew...
            //  now loop thru the miniLinks throwing them into the links array
            for (var key in miniLinks) {
                if (key in storyMap.addedLinks) {
                    storyMap.addedLinks[key].count++;
                } else {
                    storyMap.addedLinks[key] = {
                        count: 1
                    };
                }
            }

            setTimeout(function() {
                storyMap.fetchStory();
            }, 500);

        });

    },

    plotMap: function() {

        utils.log('>> Plotting Map!');
        utils.log('>> maxCount = ' + storyMap.maxCount);
        utils.log('>> Calculated = ' + Math.pow(storyMap.maxCount, 0.2));
        utils.log('>> Weight = ' + (2 - Math.pow(storyMap.maxCount, 0.2)));

        var w = 2560, h = 2560;
        //var w = 1280, h = 1280;
        var vis = d3.select("#theMap");

        var nodes = [];
        var links = [];
        var labelAnchors = [];
        var labelAnchorLinks = [];


        var node = null;
        for (var i = 0; i < storyMap.nodes.length; i++) {
            node = storyMap.nodes[i];
            var n = {
                label : storyMap.addedNodes[node].webTitle,
                fill: storyMap.addedNodes[node].colour,
                fontSize: 14,
                fontWeight: 800,
                index: i,
                r: (storyMap.addedNodes[node].count / storyMap.maxCount * 60) + 15
            };
            if (isNaN(n.r) || n.r < 5) n.r = 5;
            nodes.push(n);
            //  Make the label Anchors
            labelAnchors.push({
                node : n
            });
            labelAnchors.push({
                node : n
            });
        }

        for (var key in storyMap.addedLinks) {
            links.push({
                source: parseInt(key.split('-')[0], 10),
                target: parseInt(key.split('-')[1], 10),
                weight: 2 - Math.pow((storyMap.addedNodes[storyMap.nodes[parseInt(key.split('-')[0], 10)]].count + storyMap.addedNodes[storyMap.nodes[parseInt(key.split('-')[1], 10)]].count) / 2, 0.2)
            });
            if (isNaN(links[links.length-1].weight)) {
                links[links.length-1].weight = 1;
            }
        }

        for(var i = 0; i < nodes.length; i++) {
            labelAnchorLinks.push({
                source : i * 2,
                target : i * 2 + 1,
                weight : 1
            });
        }


        var force = d3.layout.force().size([w, h]).nodes(nodes).links(links).gravity(1).linkDistance(120).charge(-4000).linkStrength(function(x) {
            return x.weight;
        });
        force.start();

        var force2 = d3.layout.force().nodes(labelAnchors).links(labelAnchorLinks).gravity(0).linkDistance(0).linkStrength(8).charge(-10).size([w, h]);
        force2.start();


        var link = vis.selectAll("line.link").data(links).enter().append("svg:line").attr("class", "link").style("stroke-width", 1).style("stroke", "#000");

        var node = vis.selectAll("g.node").data(force.nodes()).enter().append("svg:g").attr("class", "node");
        node.append("svg:circle").attr("r", function(d) {
            return d.r;
        }).style("fill", function(d) {
            return d.fill;
        }).style("stroke", "#666")
        .style("stroke-width", 2)
        .style("z-index", 50);

        node.call(force.drag);


        var anchorLink = vis.selectAll("line.anchorLink").data(labelAnchorLinks);
        var anchorNode = vis.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
        
        //  add the node
        anchorNode.append("svg:circle").attr("r", 0).style("fill", function(d, i) {
            return "#555";
            // return d.node.fill;
        });

        //  Add the text
        anchorNode.append("svg:text").text(function(d, i) {
            return i % 2 == 0 ? "" : d.node.label;
        }).style("fill", function(d, i) {
            return "#111";
        }).style("font-family", "Arial")
        .style("font-size", function(d, i) {
            return d.node.fontSize + 'px';
        })
        .style("font-weight", function(d, i) {
            return d.node.fontWeight;
        })
        .style("z-index", 100)
        .style('text-shadow', '1px 1px 0px #FFF, 1px -1px 0px #FFF, -1px 1px 0px #FFF, -1px -1px 0px #FFF');


        var updateNode = function() {
            this.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        };

        var updateLink = function() {
            this.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });
        };

        force.on("tick", function() {

            force2.start();

            node.call(updateNode);

            anchorNode.each(function(d, i) {
                if(i % 2 == 0) {
                    d.x = d.node.x;
                    d.y = d.node.y;
                } else {
                    var b = this.childNodes[1].getBBox();

                    var diffX = d.x - d.node.x;
                    var diffY = d.y - d.node.y;

                    var dist = Math.sqrt(diffX * diffX + diffY * diffY);

                    var shiftX = b.width * (diffX - dist) / (dist * 2);
                    shiftX = Math.max(-b.width, Math.min(0, shiftX));
                    var shiftY = 5;
                    this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
                }
            });


            anchorNode.call(updateNode);

            link.call(updateLink);
            anchorLink.call(updateLink);

        });
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