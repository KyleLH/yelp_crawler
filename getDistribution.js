module.exports = function getDistribution (business, callback){
    var request = require("request");
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
