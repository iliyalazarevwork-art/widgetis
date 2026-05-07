// source: https://alarm-systems.com.ua/
// extracted: 2026-05-07T21:20:41.755Z
// scripts: 1

// === script #1 (length=587) ===
<!--
iS='http'+(window.location.protocol=='https:'?'s':'')+
'://r.i.ua/s?u112123&p4&n'+Math.random();
iD=document;if(!iD.cookie)iD.cookie="b=b; path=/";if(iD.cookie)iS+='&c1';
iS+='&d'+(screen.colorDepth?screen.colorDepth:screen.pixelDepth)
+"&w"+screen.width+'&h'+screen.height;
iT=iR=iD.referrer.replace(iP=/^[a-z]*:\/\//,'');iH=window.location.href.replace(iP,'');
((iI=iT.indexOf('/'))!=-1)?(iT=iT.substring(0,iI)):(iI=iT.length);
if(iT!=iH.substring(0,iI))iS+='&f'+escape(iR);
iS+='&r'+escape(iH);
iD.write('<img src="'+iS+'" border="0" width="88" height="31" />');
//-->
