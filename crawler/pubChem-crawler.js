var cheerio = require('cheerio');
var unirest = require('unirest');
var q = require('q');
var fs = require('fs');
var googleKey = "AIzaSyDOIm-Uvi94cgrq_KeeiHjNCVXw88Dn26A";
var phjsKey = "ak-p1yjt-9dhge-rv35w-qskqd-nhg67";
var compounds = require('./allCompounds.json');


var phantomJsCloud = require("phantomjscloud");
var browser = new phantomJsCloud.BrowserApi(phjsKey);

var infos = [];

var normalizeQuery = (name) => {
return name.replace(/\s*/,'+')
}

var getInfo = (compound,i) => {
    var defer = q.defer();
    console.log("("+(i+1)+"/"+compounds.length+")  => Fetching "+compound.engName);
   unirest.get('https://www.ncbi.nlm.nih.gov/pccompound/?term='+normalizeQuery(compound.engName))
        .encoding('latin1')    
        .end(function (response) { 
            var innerProms = [];

            if(response.body)
                try{
                    var $ = cheerio.load(response.body);

                    var results = $('.rprt').find(".rsltimg img")
                    var imageCompound = $(results).attr('src');
                    results = $('.rprt').find(".rsltimg")
                    var urlData = $(results).attr('href');

                    var desc = urlData ? '' : 'No Info';
                    if(urlData)
                        infos.push({
                            url:urlData,
                            formula:compound.formula
                        });
                
                    console.log("("+(i+1)+"/"+compounds.length+") <= Fetched "+compound.engName + (desc ? " -> " + desc: ''));
                    
                    if(imageCompound){
                        var inProm = q.defer();
                        innerProms.push(inProm.promise);
                        unirest.get(imageCompound).encoding(null).end(function(res) {
                            fs.writeFile('images/'+compound.formula+'.png', res.raw_body, "binary", (err) => {
                                if (err) console.log(err);
                                inProm.resolve();
                            });
                        });
                    }

                   

                } catch(ex){
                    console.log("Exception - - - - - - ");
                    console.log(ex);
                    fs.writeFileSync("logerror/"+compound.engName+".log",JSON.stringify(ex));
                }


            q.allSettled(innerProms)
                .then(()=>{
                    defer.resolve();
                })
            
        });
        
   return defer.promise;
};


function getInfoWrapper(i){
   getInfo(compounds[i],i)
    .then(() => {
        if(i == compounds.length-1){
            console.log("--- Saving info");
            fs.writeFileSync("InfoPubChemTotal.json", JSON.stringify(infos))
        } else {
            getInfoWrapper(i+1);
        }
    });
}

getInfoWrapper(0);