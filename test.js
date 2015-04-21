var async = require('async');

async.timesSeries(10, function (n, next) {
	console.log(n);
	next();
})
