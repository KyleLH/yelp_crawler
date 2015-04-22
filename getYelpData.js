var keys = require('./keys')
var yelp = require('yelp');
var	async = require("async"),
	yelp = require('yelp').createClient(keys);

var total_count = 0,
	local = {};

module.exports = function (search, zip, final) {


	async.series([
		function (callback) {
			yelp.search({term: search, location: zip}, function (e, data) {
				if (e)
					console.log(e);
				total_count = data.total;
				local = data;
				local.businesses = [];
				setImmediate(callback);
			});
		},

		function (callback) {
			async.times(Math.ceil(total_count/20), function (n, next) {
				var offset = n * 20;
				if (offset > 1000) {
					setImmediate(callback);
					return
				} else {
					yelp.search({term: search, location: zip, offset: offset}, function (e, data) {
						if (e) {
							console.log(e);
						}

						// local.businesses = local.businesses.concat(data.businesses);

						setImmediate(function () {
							next(null, data.businesses);
						});
					});
				}
			},
			function (err, results) {
				for (var i = 0; i < results.length; i++) {
					local.businesses = local.businesses.concat(results[i]);
				}
				final(local);
			});
		}
	]);
}
