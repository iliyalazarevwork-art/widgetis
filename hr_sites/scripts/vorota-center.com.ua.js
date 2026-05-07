// source: https://vorota-center.com.ua/
// extracted: 2026-05-07T21:18:54.416Z
// scripts: 1

// === script #1 (length=619) ===
document.oncopy = function () { 
		var bodyElement = document.body; 
		var selection = getSelection(); 
		var href = document.location.href; 
		var copyright = "<br><br>Источник: <a href='"+ href +"'>" + href + "</a><br>© Vorota Center"; 
		var text = selection + copyright; 
		var divElement = document.createElement('div'); 
		divElement.style.position = 'absolute'; 
		divElement.style.left = '-99999px'; 
		divElement.innerHTML = text; 
		bodyElement.appendChild(divElement); 
		selection.selectAllChildren(divElement); 
		setTimeout(function() { 
			bodyElement.removeChild(divElement);
		}, 0);
	};
