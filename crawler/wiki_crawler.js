var compounds = require('./allCompounds.json')
var translate = require('google-translate-api');
var cheerio = require('cheerio');
var unirest = require('unirest');
var fs = require('fs');
var q = require('q');
var promises = [];

var infos = [];


var normalize = (name) => {
    var name = name.split(" ");
    var base = name[0];

    name = name.map(x => {
        return x.toLowerCase();
    });

    name[0] = base;

    return name.join('_');

}

var getInfo = (compound,i) => {
    var defer = q.defer();
    console.log("("+(i+1)+"/"+compounds.length+")  => Fetching "+compound.engName);
    unirest.get("https://en.wikipedia.org/wiki/"+normalize(compound.engName))
        .end(function (response) {   
            var desc = "";
           
            try{
                let $ = cheerio.load(response.body)
                var infoMain = $(".mw-parser-output p");
                var infoFirst = infoMain && infoMain[0];


                var info = infoFirst ? $(infoFirst).text() : 'No Info';
                
                desc = info.length > 8 ? '' : 'No Info';

                infos.push({
                    info: info,
                    id: compound.formula
                });
                defer.resolve();
        } catch(ex){
            infos.push({
                    info: 'No Info',
                    id: compound.formula
                });
            desc =  'No Info';
            defer.resolve();
        }

         console.log("("+(i+1)+"/"+compounds.length+") <= Fetched "+compound.engName + (desc ? " -> " + desc: ''));
        
    });

    return defer.promise;

};

function getInfoWrapper(i){
   getInfo(compounds[i],i)
    .then(() => {
        if(infos.length == compounds.length){
            console.log("--- Saving info");
            fs.writeFileSync("InfoWikiTotal.json", JSON.stringify(infos))
        } else {
            getInfoWrapper(i+1);
        }
    });
}

getInfoWrapper(0);

