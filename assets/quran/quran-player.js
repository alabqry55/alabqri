(function(){
"use strict";
if(window.__ABQ_QURAN_PLAYER_LOADER__)return;window.__ABQ_QURAN_PLAYER_LOADER__=true;
var src="https://raw.githubusercontent.com/alabqry55/alabqri/54dc7cad5c7965f434a2851153e6aa3022ae8d51/assets/quran/quran-player.js";
fetch(src,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("Quran player source unavailable");return r.text()}).then(function(code){window.eval(code)}).catch(function(e){console.error("ABQ Quran player load failed",e)});
})();
