var getYelpData = require('./getYelpData'),
    async = require('async'),
    getDistribution = require('./getDistribution'),
    getCost = require('./getCost'),
    getMenu = require('./getMenu');


var res_len = 0;

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



var cur_biz = 'fine-lines-hair-salon-newton-u-f';

function getYelp (callback) {
    console.log("Fetching businesses...");
    getYelpData('hair', '02067', function (e, data) {
        // here you iterate
        businesses = data.businesses
        location.street = businesses[0].location.display_address.join();
        location.city = businesses[0].location.city;
        location.state = businesses[0].location.state_code;
        location.zip = businesses[0].location.postal_code;
        rating = businesses[0].rating;
        keywords = businesses[0].categories[0].join(separator = '; ');
        num_reviewers = businesses[0].review_count;

        callback();
    });
}

function getDist(callback) {
    console.log("Scraping distribution...");
    getDistribution(cur_biz, function (data) {
        distribution = data;
        callback();
    })
}

function getC(callback) {
    console.log("Scraping price...");
    getCost(cur_biz, function (data) {
        price = data.length;
        callback();
    })
}

function getM(callback) {
    console.log("Scraping menu...");
    getMenu(cur_biz, function (data) {
        menu = data.join('; ');
        callback();
    })
}

function save(callback) {
    console.log("Finished fetching data.");

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
    console.log("Done!");
}

async.series([
    getYelp,
    getDist,
    getC,
    getM,
    save
]);
