var keys = {
   consumer_key:'i84kAFyAN9kD2D5b5vlfjw',
   consumer_secret: 'LEWRyhW0pxxCpxBXS-_kUI2ej_w',
   token: 'd8zR4ytH5C8bTT17aM3Gu-bHDCY1Kq6W',
   token_secret: 'WC4dt6cRzui3Thx23EpAMffBgWg'
};


var yelp = require('yelp').createClient(keys);

yelp.search({term: 'hair', location: 'Boston'}, function (e, data) {
   console.log(e);
   console.log(data);
   console.log(data['businesses'].length);
});
