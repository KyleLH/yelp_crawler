module.exports = function (search, zip, callback) {

	var keys = require('./keys')

	var	async = require("async"),
		yelp = require('yelp').createClient(keys);

	yelp.search({term: search, location: zip}, function (e, data) {
		if (e)
			console.log(e);
		callback(e, data);
	});

}