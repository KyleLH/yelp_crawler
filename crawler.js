var getYelpData = require('./getYelpData'),
    async = require('async'),
    getDistribution = require('./getDistribution'),
    getCost = require('./getCost'),
    getMenu = require('./getMenu'),
    mongoose = require('mongoose');

var res_len = 0;

/*
try {
    mongoose.connect('mongodb://localhost/yelp_crawler');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}
*/

var Salon = mongoose.model('Salon', {_id: String, location: Object,
                                    rating: Number, price: Number,
                                    keywords: Object, num_reviewers: Number,
                                    distribution: Object, menu: Object })


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



function getYelp (cur_zip) {
    console.log("Fetching businesses...");
    var final = {};
    getYelpData('hair', cur_zip, function (data) {
        //iterate here over data
        console.log("Fetching "+data.total+" entries...");
        businesses = data.businesses;
        async.times(data.total, function (n, next) {
            if (businesses[n]) {
                cur_biz= businesses[n].id;
                console.log("new business: " + cur_biz);
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
                if (businesses[n].rating)
                    temp_rating = businesses[n].rating;
                if (businesses[n].categories) {
                    for (var i = 0; i < businesses[n].categories.length; i++) {
                        businesses[n].categories[i] = businesses[n].categories[i][0];
                    }
                    temp_keywords = businesses[n].categories.join(separator = '; ');
                }
                if (businesses[n].review_count)
                    temp_num_reviewers = businesses[n].review_count;
                final[cur_biz] = {
                    "location": temp_location,
                    "rating": temp_rating,
                    "keywords": temp_keywords,
                    "num_reviewers": temp_num_reviewers
                }

                function getDist(callback) {
                    getDistribution(cur_biz, function (data) {
                        distribution = data;
                        final[cur_biz]["distribution"] = data;
                        setImmediate(function () {
                            callback(null, data);
                        });
                    })
                }

                function getC(callback) {
                    getCost(cur_biz, function (data) {
                        if (data) {
                            price = data.length;
                        } else {
                            price = 0;
                        }
                        final[cur_biz]["price"] = price;
                        setImmediate(function () {
                            callback(null, data.length);
                        });
                    });
                }

                function getM(callback) {
                    getMenu(cur_biz, function (data) {
                        final[cur_biz]["menu"] = data.join('; ');
                        menu = data.join('; ');
                        setImmediate(function () {
                            callback(null, data.join('; '));
                        });
                    });
                }

                async.series([
                    getDist,
                    getC,
                    getM,
                    function (callback) {
                        setImmediate(next);
                        if (n >= data.total-1) {
                            console.log(final);
                            console.log("Done");
                        }
                    }
                ]);
            }
        }); // endof [async.times]
    }); // endof [getYelpData]
} // endof [getYelp]

function save(callback, results) {
    /*
    console.log("\nResults:\n");
    console.log("Location:")
    console.log(location);
    console.log();
    console.log("Rating:")
    console.log(rating);
    console.log();
    console.log("Price:")
    console.log(price);
    console.log();
    console.log("Keywords:");
    console.log(keywords);
    console.log();
    console.log("Number of Reviewers:");
    console.log(num_reviewers);
    console.log();
    console.log("Distribution:");
    console.log(distribution);
    console.log();
    console.log("Menu:");
    console.log(menu);
    console.log();
    console.log("Storing Data...");
    console.log();
    */
    setImmediate(callback);
}
getYelp("02067");
