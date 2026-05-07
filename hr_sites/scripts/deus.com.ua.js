// source: https://deus.com.ua/
// extracted: 2026-05-07T21:21:09.054Z
// scripts: 1

// === script #1 (length=905) ===
//$(".product__block.product__block--user-discount").html("<b style='background: yellow;   padding: 3px 5px;'>"+$(".yellow-m2").html()+"</b>");
//$(".product-card__price-box").after("<b style='background: yellow;   padding: 3px 5px;'>"+$(".yellow-m2").html()+"</b>");
//.cart__container .cart__box
//$(".cart__container .cart__box").html("<b style='background: yellow;   padding: 3px 5px;'>"+$(".yellow-m2").html()+"</b>");

$(".product-card__discount, .cart__content .cart__box, .product__block.product__block--user-discount").hide();


 
// перебір корзини
var yellowm2text = '<b style="font-size: 10px;">Точне значення м2 вкажіть у коментарі до замовлення</b>';
$( ".cart__item" ).each(function() {
var one_unit = $( this ).find(".counter__units").text();
//alert(one_unit);



if(one_unit== 'м²' || one_unit== 'м2'){
$( this ).find(".cart-item__buttons").after(yellowm2text);
}
});
