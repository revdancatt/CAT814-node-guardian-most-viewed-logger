![Screen Shot](http://cattopus23.com/img/panel-CAT814.jpg)

CAT814 Node Guardian Most Viewed Logger
=======================================

A small "cron" like app that polls the Guardian API for the most viewed and Editor's Picks
once every 20mins. Which it then logs into the database and breaks down the tags connected
to each story to give them a "score".

It also exposes an API so you can request the most viewed and picked back out of it again
going back a good few months now.

Finally I've thrown in some quick daft code to shove the tags together into a network to get
an idea of how they change from day to day.

At some point there'll be a front end to all of this.