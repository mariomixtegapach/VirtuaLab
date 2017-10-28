const CDP = require('chrome-remote-interface');
const compounds = require('./InfoPubChemTotal.json');
const translate = require('google-translate-api');
const q = require('q');
const fs = require('fs');
const limitCompounds = compounds.length -1;

var infoTotal = [];

function getPageObject(){
    var defer = q.defer();
   
    return defer.promise;
}



function getPage(i){
    console.log("("+(i+1)+"/"+limitCompounds+") Fetching")
    var defer = q.defer();

    var comp = compounds[i];

        CDP((client) => {
        
            const {Network, Page, Runtime} = client;
        
            // enable events then start!
            Promise.all([
                Network.enable(),
                Page.enable()
            ]).then(() => {
    
                Page.loadEventFired(() => {
                    Runtime.evaluate({
                        expression: "var items =[];document.querySelectorAll('.summary-description-item').forEach(x => {items.push(x.innerText)});JSON.stringify(items)"
                    }).then(rs => {
                        //console.log(rs);
            
                        var values = [];
                        try{
                            values = JSON.parse(rs.result.value);
                        } catch(ex){
                            values = [];
                            console.log(ex);
                        }
            
                        try {
                            var infoLocal = [];
                            var inPromises = [];
            
                            values.forEach((val) => {
                                var deff = q.defer();
                                inPromises.push(deff.promise);
            
                                translate(val, {to: 'es'}).then(res => {
                                    infoLocal.push(res.text);
                                    deff.resolve();
                                }).catch(err => {
                                    infoLocal.push(val);
                                    console.error(err);
                                    deff.resolve();
                                });
                            });
            
                            q.allSettled(inPromises)
                                .then(() => {
                                    infoTotal.push({
                                        infos: infoLocal,
                                        formula: comp.formula
                                    });
                                    client.close();
                                    defer.resolve();
                                });
            
                        } catch(ex) { 
                            infoTotal.push({
                                info: values,
                                formula: comp.formula
                            });
                            console.log(ex);
                            defer.resolve();
                        }
                    });
                }); 
            
                Page.navigate({url: comp.url});


            }).catch((err) => {
                console.error('Error ',err);
                client.close();
            });
        }).on('error', (err) => {
            // cannot connect to the remote endpoint
            console.error(err);
        });


    

    return defer.promise;
}

function getInfoWrapper(i){

    if(i == limitCompounds){
        try{
            fs.writeFileSync("InfoTotalDefinitives.json", JSON.stringify(infoTotal));
        } catch(ex){
            console.log(ex)
        }

        console.log("--- Saving info");
        
        return;
    }


        getPage(i)
            .then(() => {
                getInfoWrapper(i+1);
            });
 }
 
 getInfoWrapper(0);