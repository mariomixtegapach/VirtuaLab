var cheerio = require('cheerio');
var unirest = require('unirest');
var q = require('q');
var fs = require('fs');
var googleKey = "AIzaSyDOIm-Uvi94cgrq_KeeiHjNCVXw88Dn26A";

var compounds = require('./allCompounds.json');

var infos = [];

var normalizeQuery = (name) => {
return name.replace(/\s*/,'%20')
}

var getInfo = (compound,i) => {
    var defer = q.defer();
    console.log("("+(i+1)+"/"+compounds.length+")  => Fetching "+compound.engName);
   unirest.get('http://www.google.com.mx/search?q='+normalizeQuery(compound.engName))
        .encoding('latin1')    
        .end(function (response) {  
            var $ = cheerio.load(response.body);

            var results = $('._tXc');

            var urlData = $(results).text();

            infos.push({
                info: $(results).text(),
                id: compound.formula
            });

            var desc = $(results).text() ? '' : 'No Info';
            console.log(urlData)

             console.log("("+(i+1)+"/"+compounds.length+") <= Fetched "+compound.engName + (desc ? " -> " + desc: ''));

            defer.resolve();
        });
        
   return defer.promise;
};


function getInfoWrapper(i){
   getInfo(compounds[i],i)
    .then(() => {
        if(infos.length == compounds.length){
            console.log("--- Saving info");
            fs.writeFileSync("InfoGoogleTotal.json", JSON.stringify(infos))
        } else {
            getInfoWrapper(i+1);
        }
    });
}

getInfoWrapper(0);