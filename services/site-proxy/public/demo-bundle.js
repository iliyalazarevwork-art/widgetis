(function(){
try{
var BID="1779148268271";
var BUILT="2026-05-18T23:51:18.843Z";
var BASE="/wgts-chunks";
var detect=function(doc){
    var og=(doc.querySelector('meta[property="og:type"]')||{}).content;
    og=og?og.trim().toLowerCase():null;
    if(doc.querySelector('body.checkout,.checkout-page,#checkout-form,[data-checkout],body.b-checkout,.checkout__form'))return 'checkout';
    if(doc.querySelector('body.cart,.cart-page,#cart-page,.j-cart-page,body.b-cart'))return 'cart';
    if(og==='product')return 'product';
    if(og==='product.group')return 'category';
    if(og==='website')return 'home';
    if(og==='article')return 'other';
    if(doc.querySelector('.j-products-list,.catalog__products,.category__products,body.b-category'))return 'category';
    if(doc.querySelector('.product-header,.product__section--header,.j-product-description,#productPage,.product__buy-button,body.b-product'))return 'product';
    if(doc.querySelector('body.home,.home-page,body[data-page="home"],body.main-page,body.b-main,.j-banner-adaptive,.banners-group,.main-banners'))return 'home';
    return 'other';
  };
console.log('%c[widgetis] loader build='+BID+' builtAt='+BUILT,'background:#111827;color:#facc15;padding:2px 6px;border-radius:3px;font-weight:700');
var KEY='wty_demo_build_id';
if(localStorage.getItem(KEY)!==BID){
var P=['wty_','wdg_','wdg-','widgetis','interest:','stw_'];
var del=[];
for(var i=0;i<localStorage.length;i++){
var k=localStorage.key(i);
if(k&&P.some(function(p){return k.indexOf(p)===0;}))del.push(k);
}
del.forEach(function(k){localStorage.removeItem(k);});
localStorage.setItem(KEY,BID);
console.log('[widgetis] loader: build changed, cleared '+del.length+' localStorage keys');
}
var type=detect(document);
(window).__WIDGETIS_PAGE_TYPE__=type;
console.log('[widgetis] page type:',type);
if(type==='other'){console.log('[widgetis] no chunk for this page type — exit');return;}
var s=document.createElement('script');
s.async=true;
s.src=location.origin+BASE+'/'+type+'.js?b='+BID;
s.onerror=function(){console.error('[widgetis] failed to load chunk:',s.src);};
(document.head||document.documentElement).appendChild(s);
}catch(e){console.error("[widgetis] loader failed:",e);}
})();