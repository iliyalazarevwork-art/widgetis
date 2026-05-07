// source: https://hillary.com.ua/
// extracted: 2026-05-07T21:19:50.169Z
// scripts: 2

// === script #1 (length=580) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://'+hS.organization+'.widget.helpcrunch.com/';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)

// === script #2 (length=667) ===
document.addEventListener('DOMContentLoaded', function (event) {
		var receiveMessage = function (event) {

			if (event.data.hasOwnProperty('toCart')) {
console.log(event.data);
                              event.data.toCart.items.forEach((element) => {
                                   AjaxCart.getInstance().appendProduct({type: 'product', id: element.id}, undefined, true); 
                              });
			}
		
			//Redirect to cart if agree
			if (event.data.hasOwnProperty('toCartLink')) {
				window.open(
					event.data.toCartLink,
					'_blank'
				);
			}
		};
	
		window.addEventListener('message', receiveMessage, true);
	});
