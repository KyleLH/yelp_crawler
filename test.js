var request = require ("request");

function getDistribution (business, callback){

	request(
		"http://www.yelp.com/biz/" + business + "/ratings_histogram/",
		function (err, res) {
			res = JSON.parse(res.body).body;

			var pattern = /text\-[^\"]+\"\>(\d+)/g;
			var match;

			var matches = [];
			while ( match = pattern.exec(res) ){
				matches.push (match[1]);
			}

			callback (matches);
		}
	);
}

function getCost (business, callback) {

	request(
		"http://www.yelp.com/biz/" + business,
		function (err, res) {
			res = res.body

			var pattern = /priceRange\">(\$+)/g;
			var match;

			var matches = [];
			while ( match = pattern.exec(res) ){
				matches.push (match[1]);
			}

			callback (matches);
		}
	)
}

getCost ("fine-lines-hair-salon-newton-u-f", function (price) {
	console.log(price);
});

/*
async.series([
		function (callback) {
			getDistribution ("fine-lines-hair-salon-newton-u-f", function(ratings) {
				console.log ( ratings );
				callback ()
			});
		},
		function (callback) {
			callback ()
		}

	])
*/
