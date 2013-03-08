var http = require('http');

control = {

    count: 1,
    guardian: {
            key: null
        },
    sections: {
        keys: [
            "artanddesign","books","business","commentisfree",
            "culture","education","environment","fashion","film",
            "football","lifeandstyle","media","money","music",
            "politics","science","society","sport","stage",
            "technology","travel","tv-and-radio",
            "uk","world"
        ],
        dict:{
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
    fetchSectionsPicks: [],
    fetchSectionsViews: [],

    mdb: null,
    viewsCollection: null,
    editorpicksCollection: null,

    init: function(key) {

        //  set up all the things
        this.guardian.key = key;
        this.count = 6;

        //  Check to see if there are any items in the fetchSections array
        //  if not then we need to populate it and then set a timer interval
        //  to go off on either the hour, 20 minutes past or 40 minutes past
        if (this.fetchSectionsViews.length === 0) {

            this.fetchSectionsViews = this.sections.keys.slice();

        }

    },

    //  This will pop a section off the fetchSectionsViews array and
    //  go grab the data from the guardian for it
    fetchViews: function() {

    }

};
