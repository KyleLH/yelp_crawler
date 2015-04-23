var getYelpData = require('./getYelpData'),
    async = require('async'),
    getDistribution = require('./getDistribution'),
    getCost = require('./getCost'),
    getMenu = require('./getMenu'),
    mongoose = require('mongoose'),
    csv = require('fast-csv');

try {
    mongoose.connect('mongodb://localhost/yelp_crawler');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}

var Business = mongoose.model('Business', {_id: String, location: Object,
                                    rating: Number, price: Number,
                                    keywords: Object, num_reviewers: Number,
                                    distribution: Object, menu: Object });


function getDist(callback) {
    getDistribution(cur_biz, function (data) {
        setImmediate(function () {
            callback(null, data);
        });
    });
}

function getC(callback) {
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

function getM(callback) {
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
        //iterate here over data
        businesses = data;
        async.times(data.length, function (n, next) {
        		var final = {};
                if (businesses[n]) {

                    cur_biz= businesses[n].id;


                    var temp_location = {},
                        temp_rating = 0,
                        temp_keywords = "",
                        temp_num_reviewers = 0;

                    if (businesses[n].location) {
                        temp_location.street = businesses[n].location.display_address.join();
                        temp_location.city = businesses[n].location.city;
                        temp_location.state = businesses[n].location.state_code;
                        temp_location.zip = businesses[n].location.postal_code;
                    }

                    if (businesses[n].rating) {
                        temp_rating = businesses[n].rating;
                    }

                    if (businesses[n].categories) {
                        for (var i = 0; i < businesses[n].categories.length; i++) {
                            businesses[n].categories[i] = businesses[n].categories[i][0];
                        }
                        temp_keywords = businesses[n].categories.join(separator = '; ');
                    }

                    if (businesses[n].review_count) {
                        temp_num_reviewers = businesses[n].review_count;
                    }

                    final = {
                        "location": temp_location,
                        "rating": temp_rating,
                        "keywords": temp_keywords,
                        "num_reviewers": temp_num_reviewers
                    };
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

                } else {
                    next();
                }
            },
            function (err, results) {
                console.log("Finished "+cur_zip);
                setImmediate(callback);
            }
        ); // endof [async.times]
    }); // endof [getYelpData]
} // endof [getYelp]


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
