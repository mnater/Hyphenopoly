//#region Load Hyphenopoly
var Hyphenopoly = {
    require: {
        es: 'anticonstitucionalmente',
        it: 'precipitevolissimevolmente',
        de: 'Silbentrennungsalgorithmus',
        'en-us': 'antidisestablishmentarianism',
    },
    paths: {
        patterndir: './js/hyphenopoly/patterns/', //path to the directory of pattern files
        maindir: './js/hyphenopoly/', //path to the directory where the other ressources are stored
    },
}
window.Hyphenopoly = Hyphenopoly
const hyphenopoly_loader = require('hyphenopoly/Hyphenopoly_Loader')
//#endregion
