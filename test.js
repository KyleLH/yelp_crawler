var	async = require("async"),
	getCost = require("./getCost"),
	getDistribution = require("./getDistribution")


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

async.series([
		getFLCost,
		getFLDistribution
	]);
