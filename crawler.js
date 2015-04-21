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
    keywords = [],
    num_reviewers = 0,
    distribution = [0,0,0,0,0],
    menu = [];



var cur_biz = '',
    cur_zip = "83201"; // idaho?

var final = {};

function getYelp () {
    console.log("Fetching businesses...");
    getYelpData('hair', cur_zip, function (data) {
        //iterate here over data
        console.log("Fetching "+data.total+" entries...");
        businesses = data.businesses;
        async.timesSeries(data.total, function (n, next) {
            console.log("Finished fetching data");
            if (n >= data.total-1)
                console.log(final);
            async.series([
                    function (callback) {
                        cur_biz= businesses[n].id;
                        console.log("new business: " + cur_biz);
                        if (businesses[n].location) {
                            location.street = businesses[n].location.display_address.join();
                            location.city = businesses[n].location.city;
                            location.state = businesses[n].location.state_code;
                            location.zip = businesses[n].location.postal_code;
                        }
                        if (businesses[n].rating)
                            rating = businesses[n].rating;
                        if (businesses.categories)
                            keywords = businesses[n].categories.join(separator = '; ');
                        if (businesses[n].review_count)
                            num_reviewers = businesses[n].review_count;
                        final[cur_biz] = {
                            "location": location,
                            "rating": rating,
                            "keywords": keywords,
                            "num_reviewers": num_reviewers
                        }
                        callback();
                    },
                    getDist,
                    getC,
                    getM,
                    save,
                    function () {
                        next();
                    }
                ]
            ); // endof [async.series]

        }); // endof [async.timesSeries]
    }); // endof [getYelpData]
} // endof [getYelp]

function getDist(callback) {
    console.log("Scraping distribution...");
    getDistribution(cur_biz, function (data) {
        distribution = data;
        final[cur_biz]["distribution"] = data;
        callback();
    })
}

function getC(callback) {
    console.log("Scraping price...");
    getCost(cur_biz, function (data) {
        if (data) {
            price = data.length;
        } else {
            price = 0;
        }
        final[cur_biz]["price"] = price;
        callback();
    })
}

function getM(callback) {
    console.log("Scraping menu...");
    getMenu(cur_biz, function (data) {
        final[cur_biz]["menu"] = data.join('; ');
        menu = data.join('; ');
        callback();
    })
}

function save(callback) {
    console.log("Finished fetching data.");
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
    console.log("Done!");
    callback();
}
getYelp();
