var config = require('./config.json')
var translate = require('google-translate-api');
var cheerio = require('cheerio');
var unirest = require('unirest');
var fs = require('fs');
var q = require('q');

var letters = config.letters.split(',');

var promises = [];
 var elements = [];

letters.forEach(letter => {
   
    let defer = q.defer();
    console.log("=> Fetching "+letter);
    unirest.get(config.baseUrl+letter).end(function (response) {   
        console.log("<= Fetched "+letter);
        let $ = cheerio.load(response.body)
        var items = $('a[href^="/molar"]');
        let temp = {};
        items.each(function(i) {
            if(i != 0)
            switch((i) % 2){
                case 1:
                    temp.name = $(this).text();
                    temp.engName = $(this).text();
                    break;
                case 0:
                    temp.formula = $(this).text();
                    elements.push(temp);
                    temp = {};
                    break;
            }
                //console.log(elements.length)
        }, this);

        fs.writeFileSync("compounds/"+letter+".json",JSON.stringify(elements))
        defer.resolve();
    });

    //console.log(elements.length)
    promises.push(defer.promise);
});

q.allSettled(promises)
    .then(() => {
        console.log("--- Joining all compounds");
        console.log("  --- Traslating to spanish...")
        var tProms = [];
        elements.forEach(element => {
            var defer = q.defer();
            try{
            translate(element.name, {to: 'es'}).then(res => {
                console.log(element.name + " => "+  res.text)
                element.name = res.text;
                defer.resolve();
            }).catch(err => {
                console.error(err);
                defer.reject();
            });
            } catch(ex) { console.log(ex)}

            tProms.push(defer.promise);
        })

        q.all(tProms)
            .then(()=>{
                fs.writeFileSync("allCompounds.json",JSON.stringify(elements));
            })
    
        

    })