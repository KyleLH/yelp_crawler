module.exports = function (business, callback) {
	var request = require('request');
	request(
        "http://www.yelp.com/menu/" + business,
        function (err, res) {
        	res = res.body;

            var pattern = /<div class=\"menu-item-details.+\">\n<h3>\n(.+)\n<\/h3>/g;
            pattern = /menu-item-details.+\s<h3>(.+)\s<\/h3>/g;
            pattern = /<h3>\n\s+([^\n]+)/g
            var match;

            var matches = [];
            while ( match = pattern.exec(res) ){
                matches.push (match[1]);
            }
			matches = matches.join('; ');
            callback (null, matches);
        }
    )

}
