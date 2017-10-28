var compounds = require('./InfoWikiTotal.json');
var _ = require('underscore')

module.exports = function(... atoms){
    var res = {};
    console.log(atoms)

    atoms.forEach(atom => {
        res[atom] = res[atom] ? res[atom]+1 : 1;
    });

    var resString = "";

    Object.keys(res)
        .forEach(key => {
            resString += key + (res[key] > 1 ? res[key] : '');
        });

    return _.where(compounds, { id: resString});
}