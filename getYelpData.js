module.exports = function (search, zip, final) {

	var keys = require('./keys')

	var	async = require("async"),
		yelp = require('yelp').createClient(keys);

	var total_count = 0,
		local = {};

	async.series([
		function (callback) {
			yelp.search({term: search, location: zip}, function (e, data) {
				if (e)
					console.log(e);
				local = data;
				local.businesses = [];
				total_count = data.total;
				callback();
			});
		},

		function (callback) {
			async.timesSeries(Math.ceil(total_count/20), function (n, next) {
				var offset = n * 20;
				yelp.search({term: search, location: zip, offset: offset}, function (e, data) {
					if (e)
						console.log(e);

					local.businesses = local.businesses.concat(data.businesses);

					next();
					if (offset+20 >= total_count) {
						callback()
					}
				});
			});
		},

		function (callback) {
			final(local);
			callback();
		}
	]);
}
