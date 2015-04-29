var request = require("request");

module.exports = function getDistribution (business, callback){
    request(
        "http://www.yelp.com/biz/" + business + "/ratings_histogram/",
        function (err, res) {
            try {
                res = res.body;
            } catch (err) {
                console.log("http://www.yelp.com/biz/" + business);
                res = res.body;
                var pattern = /(Error 404|500 error|400 Bad request)/g;
                var matches = [];
                matches = res.match(pattern);
                if (matches) {
                    if (matches.length > 0) {
                        if (matches[0] == "Error 404") {
                            callback (null, false);
                            return;
                        } else if (matches[0] == "400 Bad request") {
                            callback (null, false);
                            return;
                        } else if (matches[0] == "500 error") {
                            callback (null, false);
                            return;
                        }
                    }
                } else {
                    console.log(res.body);
                    console.log("http://www.yelp.com/biz/" + business);
                    throw "Unknown error"
                    return;
                }
            }

            var pattern = /Yelpers report this location has closed/g;
            var match;

            var matches = [];
            while ( match = pattern.exec(res) ){
                matches.push (match[1]);
            }
            callback(null, matches.length>=1);
        }
    );
}
