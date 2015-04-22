var getYelpData = require('./getYelpData'),
    async = require('async'),
    getDistribution = require('./getDistribution'),
    getCost = require('./getCost'),
    getMenu = require('./getMenu'),
    mongoose = require('mongoose');

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


// storing values
var location = {
        'street': '',
        'city': '',
        'state': '',
        'zip': ''
    },
    rating = 0.0,
    price = 0,
    keywords = '',
    num_reviewers = 0,
    distribution = [0,0,0,0,0],
    menu = [];

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
            callback(null, data.join('; '));
        });
    });
}


function getYelp (cur_zip) {
    var final = {};
    console.log("Connecting to Yelp...");
    getYelpData('hair', cur_zip, function (data) {
        //iterate here over data
        console.log("Fetching "+data.total+" entries...");
        businesses = data.businesses;
        async.times(data.total, function (n, next) {

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

                    final[cur_biz] = {
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
                                final[cur_biz]["distribution"] = results[0];
                                final[cur_biz]["price"] = results[1];
                                final[cur_biz]["menu"] = results[2];
                                final[cur_biz]._id = cur_biz;
                                var to_save = new Business(final[cur_biz]);

                                Business.update({_id: cur_biz}, to_save.toObject(), {upsert: true}, function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        //console.log("saved "+cur_biz);
                                    }
                                    setImmediate(next);
                                });
                            }
                        );
                    })(cur_biz);

                } // endif
            },
            function (err, results) {
                mongoose.connection.close();
            }
        ); // endof [async.times]
    }); // endof [getYelpData]
} // endof [getYelp]

getYelp("02067");
