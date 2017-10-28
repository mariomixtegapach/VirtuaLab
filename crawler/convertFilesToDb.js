const sqlite3 = require('sqlite3').verbose();
const compounds = require('./allCompounds.json');
const info = require('./InfoTotalDefinitives.json').filter(x => { return x.infos.length > 0});
const _ = require('underscore');
const fs = require('fs')
    var sql = 'INSERT INTO compounds(id,name,formula) VALUES ';

    compounds.forEach((compound,i) => {
        sql += "("+(i+1)+",'"+compound.name+"','"+compound.formula+"')";

        sql += i == (compounds.length-1) ? '' : ','

    }, this);

    

// open the database
let db = new sqlite3.Database('./db/virtualab.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the virtualab database.');
});
 
db.serialize(() => {
    db.run('CREATE TABLE compounds(id integer, name text, formula text)')
      .run('CREATE TABLE compoundsInfo(formula text, info text, name text)')
      .run(sql);


      console.log("Added component")
      
      info.forEach((compound,i) => {
        var sqlInfo = 'INSERT INTO compoundsInfo(formula,info, name) VALUES ';
          compound.infos.forEach((inf,o) => {
            sqlInfo += "(\""+inf.replace(/"/gmi,'”')+"\",\""+compound.formula+"\", \"" + _.findWhere(compounds, { formula : compound.formula}).name + "\")";
            sqlInfo += o == (compound.infos.length -1)? '' : ','
          });

          //console.log(sqlInfo);
          //console.log('-----------------------------------------------');
          if(compound.infos.length){
            fs.writeFileSync("sql/"+compound.formula+".sql", sqlInfo);
            db.run(sqlInfo);            
          }
      }, this);
});
 
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Close the database connection.');
});