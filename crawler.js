var getYelpData = require('./getYelpData'),
    async = require('async'),
    getDistribution = require('./getDistribution'),
    getCost = require('./getCost'),
    getMenu = require('./getMenu'),
    mongoose = require('mongoose'),
    csv = require('fast-csv');

var http = require("http");
http.globalAgent.maxSockets = Infinity;

try {
    mongoose.connect('mongodb://localhost/yelp_crawler');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}

var Business = mongoose.model('Business', {_id: String, location: Object,
                                    rating: Number, price: Number,
                                    keywords: Object, num_reviewers: Number,
                                    distribution: Object, menu: Object,
                                    scraped: Boolean});


function getDist(cur_biz, callback) {
    getDistribution(cur_biz, function (data) {
        setImmediate(function () {
            callback(null, data);
        });
    });
}

function getC(cur_biz, callback) {
    getCost(cur_biz, function (data) {
        if (data) {
            price = data.length;
        } else {
            price = 0;
        }
        setImmediate(function () {
            callback(null, price);
        });
    });
}

function getM(cur_biz, callback) {
    getMenu(cur_biz, function (data) {
        setImmediate(function () {
            try {
                callback(null, data.join('; '));
            } catch (err) {
                callback(null, '');
            }
        });
    });
}
var count = 0;

function getYelp (cur_zip, callback) {
    console.log("Connecting to Yelp...");
    getYelpData('hair', cur_zip, function (err, data) {
        console.log("Fetched "+data.length+" entries");
        if (err) {

        }
        //iterate here over data
        async.eachLimit(data, 500, function (item, next) {
        		var final = {};

                var cur_biz = item.id;

                var temp_location = {},
                    temp_rating = 0,
                    temp_keywords = "",
                    temp_num_reviewers = 0;

                if (item.location) {
                    temp_location.street = item.location.display_address.join();
                    temp_location.city = item.location.city;
                    temp_location.state = item.location.state_code;
                    temp_location.zip = item.location.postal_code;
                }

                if (item.rating) {
                    temp_rating = item.rating;
                }

                if (item.categories) {
                    for (var i = 0; i < item.categories.length; i++) {
                        item.categories[i] = item.categories[i][0];
                    }
                    temp_keywords = item.categories.join(separator = '; ');
                }

                if (item.review_count) {
                    temp_num_reviewers = item.review_count;
                }

                final = {
                    "location": temp_location,
                    "rating": temp_rating,
                    "keywords": temp_keywords,
                    "num_reviewers": temp_num_reviewers
                };

                final["distribution"] = {'1':'0', '2': '0', '3':'0', '4': '0', '5': '0'};
                final["price"] = 0;
                final["menu"] = '';
                final._id = cur_biz;
                var to_save = new Business(final);
                (function (cur_biz) {
                    Business.update({_id: cur_biz}, to_save.toObject(), {upsert: true}, function (err) {
                        if (err) { console.log(err);
                        } else {
                            console.log("saved "+cur_biz);
                            next();
                        }
                        ;
                    });
                })(cur_biz);

                /*
                (function (cur_biz) {
                    async.parallel(
                        [
                            getDist,
                            getC,
                            getM
                        ],
                        function (err, results) {
                            final["distribution"] = results[0];
                            final["price"] = results[1];
                            final["menu"] = results[2];
                            final._id = cur_biz;
                            var to_save = new Business(final);
                            Business.update({_id: cur_biz}, to_save.toObject(), {upsert: true}, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    //console.log("saved "+n);
                                }
                                next();
                            });
                        }
                    );
                })(cur_biz);
                */
            },
            function (err, results) {
                console.log("Finished "+cur_zip);
                setImmediate(callback);
            }
        ); // endof [async.times]
    }); // endof [getYelpData]
} // endof [getYelp]

function zipData() {
    var zips = [],
        seen = {};
    console.log("Reading zips...");
    csv
    .fromPath ("zbp12totals.csv", {headers: true})
    .on ('data', function (data) {
        if (seen[data.name] != 1) {
            zips.push(data.zip);
        }
        seen[data.name] = 1;
    })
    .on ('end', function () {
        async.eachSeries(zips, function (item, callback) {
            getYelp(item, callback);
        }, function () {
            console.log("All doen")
            mongoose.connection.close();
        });
    });
}

function asyncData() {
    var business_names = [];
    console.log("Fetching businesses");
    Business.find({'scraped': {'$exists': false}}, '_id', function (err, data) {
        console.log("Fetched "+data.length+" businesses");
        console.log("Compiling businesses");
        for (i in data) {
            business_names.push(data[i]._id);
        }

        async.eachLimit(business_names, 10, function (cur_biz, finished){
            console.log("Fetching data for "+cur_biz);
            async.parallel([
                    function (done) {
                        getDistribution(cur_biz, function (err, data) {
                            done(null, data);
                        });
                    },
                    function (done) {
                        getMenu(cur_biz, function (err, data) {
                            done(null, data);
                        });
                    },
                    function (done) {
                        getCost(cur_biz, function (err, data) {
                            done(null, data);
                        });
                    }
                ],
                function (err, results) {
                    console.log("Updating "+cur_biz);
                    Business.find({_id: cur_biz}, function (err, data) {
                        if (err) throw err;
                        if (data.length > 1) throw "Duplicate business";

                        data = data[0];
                        data["distribution"] = results[0];
                        data["price"] = results[1];
                        data["menu"] = results[2];
                        if (results[0] == 0){
                            data["scraped"] = false;
                        } else {
                            data["scraped"] = true;
			}
                        Business.update({_id: cur_biz}, data.toObject(), function (err) {
                            console.log("Saved "+cur_biz);
                            finished(null);
                        });
                    });
                }
            );
        },
        function (err) {
            console.log("Finished updating "+business_names.length+" businesses");
            mongoose.connection.close();
        });
    });
}


asyncData();
