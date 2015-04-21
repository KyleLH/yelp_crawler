module.exports = function getCost (business, callback) {
    var request = require("request")
    request(
        "http://www.yelp.com/biz/" + business,
        function (err, res) {
            res = res.body

            var pattern = /priceRange\">(.+)<\/span>/g;
            var match;

            var matches = [];
            while ( match = pattern.exec(res) ){
                matches.push (match[1]);
            }
            callback (matches[0]);
        }
    )
}
