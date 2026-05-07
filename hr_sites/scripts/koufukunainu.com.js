// source: https://koufukunainu.com/
// extracted: 2026-05-07T21:20:14.053Z
// scripts: 1

// === script #1 (length=3022) ===
(()=>{

var pricePattern = '0 грн', //основной паттерн сверки текста
    pricePatternLang = (() => {
        let lang = document.documentElement.lang; // дополнительный паттерн сверки текста
            switch (lang) {
                case 'ru' : return 'Цена: 0 грн';
                case 'uk' : return 'Ціна: 0 грн';
                case 'en' : return '€0';
                default : return '0 грн';
            }
    })(),
        langText = (() => {
        let lang = document.documentElement.lang;
            switch (lang) {
                case 'ru' : return '';
                case 'uk' : return '';
                case 'en' : return '';
                default : return '-';
            }
    })();

//================================== Функция изменения цены для миникарточки (кнопка купить не удаляется)

const miniCardPriceChage = () => {
    let priceItemsList = document.querySelectorAll('.j-catalog-card,.catalog-card,.productsSlider-i,.recentProducts-i');
    
    priceItemsList.forEach((el,i)=>{
        let price = el.querySelector('.catalogCard-price,.catalog-card__price,.productsSlider-price,.recentProducts-price');
        if(price.textContent.trim() == pricePattern.trim() || price.textContent.trim() == pricePatternLang.trim()){
        price.innerHTML = langText;

        } 
    });

}

//================================== Функция изменения цены для карточки товара (кнопка удаляется)

const productPagePriceChange = () => {
    let priceItemsList = document.querySelectorAll('.catalogCard-price,.product-price__item,.product-card__price,.productsSlider-price,.recentProducts-price,.cart-item__price,.cart__total-price,.order-item__price,.order-item__cost,.order-details__total,.cart-cost,.order-i-price,.order-i-cost,.order-summary-b,.cart-price,.j-price-p');

    priceItemsList.forEach((el,i)=>{
        if(el.textContent.trim() == pricePattern.trim() || el.textContent.trim() == pricePatternLang.trim()){

            el.innerHTML = langText;

        } 
    });

}

//================================== Функция для изменения цены

const priceChange = () => {

     miniCardPriceChage();
     productPagePriceChange();
    console.log('changed');
}


//================================== Ниже обсервер который следит за DOM и в случае изменения вызывает функцию priceChange() PS. остановить обсервер нельзя из-за пределов автономной функции ниже

(() => {

        var target = document.documentElement;
        
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        }; 
        
        const callback = function(mutationsList, observer) {
            priceChange();
        };
        
        const observer = new MutationObserver(callback);
        
        observer.observe(target, config);
        

})();

//================================== При готовности DOM вызвать функцию priceChange()
window.onload = priceChange();
})();
