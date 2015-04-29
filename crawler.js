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
    Business.find({scraped: false}, '_id', function (err, data) {
        console.log("Fetched "+data.length+" businesses");
        console.log("Compiling businesses");
        for (i in data) {
            business_names.push(data[i]._id);
        }
        var counter = 0

        async.eachSeries(business_names, function (cur_biz, finished){
            getDistribution(cur_biz, function (err, dist) {
                counter++;
                if (counter % 500 == 0) {
                    console.log("Processed "+counter+" businesses");
                }
                Business.find({_id: cur_biz}, function (err, data) {
                    if (err) throw err;
                    if (data.length > 1) throw "Duplicate business";

                    data = data[0];
                    //data["price"] = results[2];
                    //data["menu"] = results[1];
                    data.distribution = dist;
                    data["scraped"] = true;
                    Business.update({_id: cur_biz}, data.toObject(), function (err) {
                        finished();
                    });
                });
            });
        },
        function (err) {
            console.log("Finished updating "+business_names.length+" businesses");
            mongoose.connection.close();
        });
    });
}
asyncData();


var keys = require('./keys');
var yelp = require('yelp').createClient(keys);

/*
yelp.business('fine-lines-hair-salon-newton-u-f',  function (err, data) {
    if( err ){throw err; }
    console.log(data);
});
*/

function getAddresses() {
    Business.find({}, function (err, data) {
        if (err) console.log(err);
        var counter = 0;
        console.log("Processing "+data.length+" businesses")
        async.eachLimit(data, 100, function (item, done) {
            yelp.business(item._id, function (err, loc) {
                if (err) {
                    done();
                } else {
                    item.num_reviewers = loc.num_reviewers;
                    item.rating = loc.rating;
                    var to_save = new Business(item);
                    Business.update({_id: item._id}, to_save.toObject(), function (err) {
                        counter++;
                        if (counter % 5000 == 0) {
                            console.log(counter+" businesses processed");
                        }
                        done();
                    });
                }
            });
        },
        function (err) {
            console.log("done");
        });
    })
}

function updateDistribution() {
    Business.find({}, function (err, data) {
        if (err) console.log(err);
        var counter = 0;
        console.log("Processing "+data.length+" businesses")
        async.eachLimit(data, 100, function (item, done) {
            if (err) {
                done();
            } else {
                var tmp = [];
                for (key in item.distribution) {
                    tmp.push(item.distribution[key]);
                }
                item.distribution = tmp.join(';');
                var to_save = new Business(item);
                Business.update({_id: item._id}, to_save.toObject(), function (err) {
                    counter++;
                    if (counter % 5000 == 0) {
                        console.log(counter+" businesses processed");
                    }
                    done();
                });
            }
        },
        function (err) {
            console.log("done");
            mongoose.connection.close();
        });
    })
}
//updateDistribution();

function fixes() {
    Business.find({}, function (err, data) {
        if (err) console.log(err);
        console.log("Processing "+data.length+" businesses")
        var counter = 0;
        async.eachLimit(data, 100, function (item, done) {
            if (item.distribution == '1;2;3;4;5') {
                getDistribution(item._id, function (err, data) {
                    item.distribution = data;
                    Business.update({_id: item._id}, item.toObject(), function (err) {
                        counter++;
                        if (counter % 1000 == 0) {
                            console.log(counter+" businesses processed");
                        }
                        done();
                    });
                });
            }
        },
        function (err) {
            console.log("done");
            mongoose.connection.close();
        });
    })
}

function test() {
    Business.find({}, function (err, data) {
        var counter =0;
        data.forEach(function (item) {
            if (eval(item.distribution.replace(/;/g, '+')) != item.num_reviewers) {
                counter++;
                //console.log("ERROR ERROR");
                console.log(eval(item.distribution.replace(/;/g, '+')), item.num_reviewers);
                console.log(item._id);
            }
        });
        console.log(counter);
        mongoose.connection.close();
    });
}

//test();
