var request = require("request");

module.exports = function getDistribution (business, callback){
    request(
        "http://www.yelp.com/biz/" + business + "/ratings_histogram/",
        function (err, res) {
            try {
                res = JSON.parse(res.body).body;
            } catch (err) {
                console.log("http://www.yelp.com/biz/" + business + "/ratings_histogram/");
                throw "Unable to get Distribution";
            }

            var pattern = /text\-[^\"]+\"\>(\d+)/g;
            var match;

            var matches = [];
            while ( match = pattern.exec(res) ){
                matches.push (match[1]);
            }
            matches.reverse();
            final = {}
            for (var i=1; i <= matches.length; i++) {
                final[i] = matches[i-1];
            }

            if (final)
                setImmediate(function () {
                    callback (final);
                })
            else{
                setImmediate(callback);
            }
        }
    );
}
