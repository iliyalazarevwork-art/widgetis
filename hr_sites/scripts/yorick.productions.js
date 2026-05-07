// source: https://yorick.productions/
// extracted: 2026-05-07T21:19:01.690Z
// scripts: 1

// === script #1 (length=940) ===
(function(d, w, s) {
	var widgetHash = 'hvzscucad21gtm7rlvnc', gcw = d.createElement(s); gcw.type = 'text/javascript'; gcw.async = true;
	gcw.src = '//widgets.binotel.com/getcall/widgets/'+ widgetHash +'.js';
	var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(gcw, sn);
  })(document, window, 'script');

const catalogLeft = document.querySelector(".catalog__middle-col--left")
const catalogRight = document.querySelector(".catalog__middle-col--shifted-right")
const catalogGrid = document.querySelector(".catalogGrid.catalog-grid.catalog-grid--s.catalog-grid--sidebar")
const catalogList = catalogGrid.querySelectorAll("li")
const filter = document.querySelector(".filter.__listScroll")

if (filter === null) {
  catalogLeft.style.display = "none"
  catalogRight.style.flexBasis = "100%"
  catalogRight.style.maxWidth = "100%"
  for(i=0; i<catalogList.length;i++)
  catalogList[i].style.width='16.666%';
}
