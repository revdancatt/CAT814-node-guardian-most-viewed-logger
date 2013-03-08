var http = require('http');
var https = require('https');

control = {

    count: 1,
    guardian: {
            key: null
        },

    mdb: null,
    viewsCollection: null,
    editorpicksCollection: null,

    init: function(key) {

        //  set up all the things
        this.guardian.key = key;
        this.count = 6;

    }

}
