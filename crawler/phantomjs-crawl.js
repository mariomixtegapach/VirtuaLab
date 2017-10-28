
var cheerio = require('cheerio');
var _ = require('underscore');

var phantomJsCloud = require("phantomjscloud");
var browser = new phantomJsCloud.BrowserApi();

browser.requestSingle({ url: 'https://pubchem.ncbi.nlm.nih.gov/compound/962', renderType: "plainText" }, (err, userResponse) => {
    //can use a callback like this example, or a Promise (see the Typescript example below) 
    if (err != null) {
        throw err;
    }
    (userResponse.content.data);
});




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
            fs.writeFileSync("InfoPubTotal.json", JSON.stringify(infos))
        } else {
            getInfoWrapper(i+1);
        }
    });
}

getInfoWrapper(0);



/*var page = require('webpage').create();
page.settings.loadImages = false;
page.open('https://pubchem.ncbi.nlm.nih.gov/compound/962', function(status) {
  console.log("Status: " + status);

  var descriptions = page.evaluate(function(s) {
    return document.querySelector(s).innerText;
  }, '.summary-description-item');

   
  descriptions.forEach(i => {
      console.log(i.innerText)
  });

  phantom.exit();
});*/