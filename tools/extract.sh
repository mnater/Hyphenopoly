#!/bin/sh
# -*- coding: utf-8 -*-

# license.txt characters.txt patterns.txt [exceptions.txt]
#node tex2hpb ../texPatterns/hyph-en-us.lic.txt ../texPatterns/hyph-en-us.chr.txt ../texPatterns/hyph-en-us.pat.txt ../texPatterns/hyph-en-us.hyp.txt en

#node tex2hpb ../texPatterns/hyph-de-1996.lic.txt ../texPatterns/hyph-de-1996.chr.txt ../texPatterns/hyph-de-1996.pat.txt ../texPatterns/hyph-de-1996.hyp.txt de

texName[1]='de-1996'
hpbName[1]='de'

texName[2]='en-us'
hpbName[2]='en-us'

texName[3]='hy'
hpbName[3]='hy'

texName[4]='hu'
hpbName[4]='hu'

texName[5]='cs'
hpbName[5]='cs'

texName[6]='da'
hpbName[6]='da'

texName[7]='fr'
hpbName[7]='fr'

texName[8]='nl'
hpbName[8]='nl'

texName[9]='es'
hpbName[9]='es'

texName[10]='sv'
hpbName[10]='sv'

texName[11]='it'
hpbName[11]='it'

texName[12]='fi'
hpbName[12]='fi'

texName[13]='pl'
hpbName[13]='pl'

texName[14]='pt'
hpbName[14]='pt'

texName[15]='tr'
hpbName[15]='tr'

texName[16]='lt'
hpbName[16]='lt'

texName[17]='sl'
hpbName[17]='sl'

texName[18]='la-x-classic'
hpbName[18]='la'

texName[19]='nb'
hpbName[19]='nb-no'

texName[20]='lv'
hpbName[20]='lv'

texName[21]='ca'
hpbName[21]='ca'

texName[22]='sk'
hpbName[22]='sk'

texName[23]='eo'
hpbName[23]='eo'

texName[24]='sh-latn'
hpbName[24]='sh-latn'

texName[25]='ro'
hpbName[25]='ro'

texName[26]='et'
hpbName[26]='et'

texName[27]='ga'
hpbName[27]='ga'

texName[28]='be'
hpbName[28]='be'

texName[29]='ru'
hpbName[29]='ru'

texName[30]='sr-cyrl'
hpbName[30]='sr-cyrl'

texName[31]='uk'
hpbName[31]='uk'


pt='../texPatterns/'
px='hyph-'

for i in {1..1}; do {
    node tex2hpb.js ${pt}${px}${texName[${i}]}.lic.txt ${pt}${px}${texName[${i}]}.chr.txt ${pt}${px}${texName[${i}]}.pat.txt ${pt}${px}${texName[${i}]}.hyp.txt ${hpbName[${i}]}
}
done
