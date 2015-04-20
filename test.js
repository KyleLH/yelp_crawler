var keys = require('./keys')

var	async = require("async"),
	getCost = require("./getCost"),
	getDistribution = require("./getDistribution"),
	yelp = require('yelp').createClient(keys);


function getFLCost(callback) {
	getCost ("fine-lines-hair-salon-newton-u-f", function (price) {
		console.log(price);
		callback();
	});
}

function getFLDistribution(callback) {
	getDistribution ("fine-lines-hair-salon-newton-u-f", function (distribution) {
		console.log(distribution);
		callback();
	});
}

function apiTest (callback) {
	yelp.search({term: 'hair', location: 'Boston'}, function (e, data) {
		if (e)
			console.log(e);
		console.log(data);
		res_len = data['businesses'].length;
		callback();
	});
}

async.series([
		getFLCost,
		getFLDistribution
		//apiTest
	]);
