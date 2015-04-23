var keys = require('./keys'),
	yelp = require('yelp').createClient( keys );

var until = function(n, cb){
	return function(){  (--n) > 0 || cb(); };
};

module.exports = function (search, zip, cb) {

	function search(offset, cb, arr){
		yelp.search({ term: search, location: zip, offset: offset }, function (err, data) {
			if( err ){ throw err; }
			if( arr ){ [].splice.apply(arr, [0,0].concat(data.businesses)); }
			cb(offset, data);
		});
	}

	search(0, function (offset, data){

		// Create counter
		var maxN = (data.total - data.businesses.length) > 1000 ? 1000 : data.total;

		var done = until(Math.ceil((maxN-data.businesses.length)/20), function(){
			cb(null, data.businesses);
		});

		// If only 1 page
		if( data.businesses.length === data.total ){ return done(); }

		// Else, crawl all pages
		for( var i = data.businesses.length; i < maxN; i += 20 ){
			search(i, done, data.businesses);
		}
	});
};
