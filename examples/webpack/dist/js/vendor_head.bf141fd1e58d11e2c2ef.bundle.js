(window.webpackJsonp=window.webpackJsonp||[]).push([[3],[function(e,t,s){"use strict";window.Hyphenopoly={require:{es:"anticonstitucionalmente",it:"precipitevolissimevolmente",de:"Silbentrennungsalgorithmus","en-us":"antidisestablishmentarianism"},paths:{patterndir:"./js/hyphenopoly/patterns/",maindir:"./js/hyphenopoly/"}};s(1)},function(e,t){
/**
 * @license Hyphenopoly_Loader 4.3.0 - client side hyphenation
 * ©2020  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */
((e,t,s,n)=>{"use strict";const i=sessionStorage,a="Hyphenopoly_Loader.js",o=new Map,r=()=>n.create(null),l="appendChild",p="createElement",c="createTextNode",h=(e,t)=>n.keys(e).forEach(t);s.cacheFeatureTests&&i.getItem(a)?s.cf=JSON.parse(i.getItem(a)):s.cf={langs:r(),pf:!1},(()=>{const e=t.currentScript.src.replace(a,""),n=e+"patterns/";s.paths?(s.paths.maindir=s.paths.maindir||e,s.paths.patterndir=s.paths.patterndir||n):s.paths={maindir:e,patterndir:n}})(),s.setup?(s.setup.CORScredentials=s.setup.CORScredentials||"include",s.setup.hide=s.setup.hide||"all",s.setup.selectors=s.setup.selectors||{".hyphenate":{}},s.setup.timeout=s.setup.timeout||1e3):s.setup={CORScredentials:"include",hide:"all",selectors:{".hyphenate":{}},timeout:1e3},s.setup.hide=new Map([["all",1],["element",2],["text",3]]).get(s.setup.hide)||0,h(s.require,e=>{const t=s.fallbacks&&s.fallbacks[e]||e;o.set(e.toLowerCase(),new Map([["fn",t],["wo",s.require[e]]]))}),s.defProm=()=>{let e=null,t=null;const s=new Promise((s,n)=>{e=s,t=n});return s.resolve=e,s.reject=t,s},s.hide=(e,n)=>{const i="H9Y_Styles";if(0===e){const e=t.getElementById(i);e&&e.remove()}else{const e="{visibility:hidden!important}",a=t[p]("style");let o="";a.id=i,1===n?o="html"+e:h(s.setup.selectors,t=>{o+=2===n?t+e:t+"{color:transparent!important}"}),a[l](t[c](o)),t.head[l](a)}};const d=(()=>{let e=null;const n="hyphens:auto",i=`visibility:hidden;-webkit-${n};-ms-${n};${n};width:48px;font-size:12px;line-height:12px;border:none;padding:0;word-wrap:normal`;return{ap:()=>e?(t.documentElement[l](e),e):null,cl:()=>{e&&e.remove()},cr:n=>{if(s.cf.langs[n])return;e=e||t[p]("body");const a=t[p]("div");a.lang=n,a.style.cssText=i,a[l](t[c](o.get(n).get("wo").toLowerCase())),e[l](a)}}})();s.res=new Map([["he",new Map]]);const u=new Map;function m(t){const n=o.get(t).get("fn")+".wasm";if(s.cf.pf=!0,s.cf.langs[t]="H9Y",u.has(n)){const e=s.res.get("he").get(u.get(n));e.c+=1,s.res.get("he").set(t,e)}else s.res.get("he").set(t,{c:1,w:e.fetch(s.paths.patterndir+n,{credentials:s.setup.CORScredentials})}),u.set(n,t)}o.forEach((e,t)=>{"FORCEHYPHENOPOLY"===e.get("wo")||"H9Y"===s.cf.langs[t]?m(t):d.cr(t)});const f=d.ap();if(f){f.querySelectorAll("div").forEach(e=>{var t;"auto"===((t=e.style).hyphens||t.webkitHyphens||t.msHyphens)&&e.offsetHeight>12?s.cf.langs[e.lang]="CSS":m(e.lang)}),d.cl()}const y=s.handleEvent;if(s.cf.pf){s.res.set("DOM",new Promise(e=>{"loading"===t.readyState?t.addEventListener("DOMContentLoaded",e,{once:!0,passive:!0}):e()})),1===s.setup.hide&&s.hide(1,1),0!==s.setup.hide&&(s.timeOutHandler=e.setTimeout(()=>{s.hide(0,null),console.info(a+" timed out.")},s.setup.timeout)),s.res.get("DOM").then(()=>{s.setup.hide>1&&s.hide(1,s.setup.hide)});const n=t[p]("script");n.src=s.paths.maindir+"Hyphenopoly.js",t.head[l](n),s.hyphenators=r(),h(s.cf.langs,e=>{"H9Y"===s.cf.langs[e]&&(s.hyphenators[e]=s.defProm())}),s.hyphenators.HTML=s.defProm(),y&&y.polyfill&&y.polyfill()}else y&&y.tearDown&&y.tearDown(),e.Hyphenopoly=null;s.cacheFeatureTests&&i.setItem(a,JSON.stringify(s.cf))})(window,document,Hyphenopoly,Object)}],[[0,0]]]);