var request = require("request");

module.exports = function getDistribution (business, callback){
    request(
        "http://www.yelp.com/biz/" + business + "/ratings_histogram/",
        function (err, res) {
            try {
                res = JSON.parse(res.body).body;
            } catch (err) {
                //console.log("http://www.yelp.com/biz/" + business + "/ratings_histogram/");
                res = res.body;
                var pattern = /(Error 404|400 Bad request)/g;
                var matches = [];
                matches = res.match(pattern);

                if (matches) {
                    if (matches.length > 0) {
                        if (matches[0] == "Error 404") {
                            console.log(res);
                            throw "Unable to get Distribution";
                        } else if (matches[0] == "400 Bad request") {
                            throw "Unable to contact Yelp";
                        }
                    }
                } else {
                    callback (null, {'1': '0', '2': '0', '3': '0' ,'4': '0' ,'5': '0'});
                    return;
                }
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

            if (final) {
                setImmediate(function () {
                    callback (null, final);
                });
            } else {
                setImmediate(callback);
            }
        }
    );
}
