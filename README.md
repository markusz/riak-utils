# psd-profile-service

A service to store and provide misc. user meta data (e.g. favorites / video watchlists / activities / ...).

## Overview

The subscription service tracks interests and activities of a user in a data store

## API design

The current API design can be accessed here: http://profile-int01.sim-technik.de:3000/swagger/


## EPG Crawler

* EPG json: http://epg.kabeleins.de/api/connect/epg.json?channel_id=2
* Channels: http://epg.sat1.de/api/channels.txt

## CRMEvents 

For CRM purposes, it is necessary to track and aggregate activities of users. 

If events in the service are relevant for CRM, they can be tracked with the so-called "CRMEvents".
Currently, it is requested to track events from client interaction with the followings endpoints:

* History
* Watchlists
* Receipts

A CRM event should record the event type, timestamp of the event as Epoch, the action of a client
and the ID of the client (user ID).

As an example, the following attributes represent the CRMEvent of a user with ID 42 for a new history entry
at timestamp 5:

 { action: "create", timestamp: 5, type: "history", id: 42 }

It is necessary to aggregate and list events of a user. For this, CRMEvent.listBySlice(from, until, cb) can be used.

For the listing, Riak's secondary index on the timestamp is used. These timestamps are the same as the timestamp in the objects.

## FAQ

_Service does not start because it can't find 'log' module?_
Make sure lib is in your NODE\_PATH so we can require from it without the added
./lib

    $ export NODE_PATH=lib

will do the trick.

_Riak is not installed on my system?_
Riak is handled via a vagrant based vm, provisioned by puppet, to get up and
running with the correct version for development first run

    $ vagrant up

which will install the vm and setup riak inside, which will be bound to a local
port so test etc. should simply work in development now.

_The oauth access test user.spec.js fails?_
Make sure a valid token is set in spec/factory.js see the top of the file for
further instructions


tests can be run like this:

    $ JENKINS_URL=test NODE_PATH=lib ./node_modules/.bin/nodemon ./node_modules/.bin/jasmine-node spec


## Interest Aggregator

	NODE_ENV=development  NODE_PATH=lib node services/interest_id/interest_id_service.js 
	NODE_ENV=development  NODE_PATH=lib node tools/epg-crawler.js
	NODE_ENV=development NODE_PATH=lib node services/interest_aggregator/seed_events.js

Reference Commit for latest production commit