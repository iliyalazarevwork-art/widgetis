// source: https://prohobby.ua/
// extracted: 2026-05-07T21:20:35.383Z
// scripts: 1

// === script #1 (length=2899) ===
(function(){
    const threshold = 1500; // Сумма для бесплатной доставки

    function parseTotal(text){
        return parseFloat(text.replace(/[^\d]/g,'')) || 0;
    }

    function createCounter(targetBlock){
        if(targetBlock.querySelector('.free-shipping-counter'))
            return targetBlock.querySelector('.free-shipping-counter');

        const counter = document.createElement('div');
        counter.className = 'free-shipping-counter';
        counter.style.cssText = 'margin-top:10px; font-size:14px; text-align:right;';

        counter.innerHTML = `
            <span class="free-shipping-text">До безкоштовної доставки залишилось </span>
            <span class="free-shipping-amount" style="color:#e74c3c; font-weight:700;">0</span> грн
            <div style="background:#eee; border-radius:5px; margin-top:4px; height:8px; overflow:hidden;">
                <div class="free-shipping-bar" style="background:#e74c3c; height:100%; width:0%; transition: width 0.3s;"></div>
            </div>
        `;
        targetBlock.appendChild(counter);
        return counter;
    }

    function updateCounter(counter){
        const totalElem = document.querySelector('.j-total-sum');
        if(!totalElem || !counter) return;

        const total = parseTotal(totalElem.textContent);
        const remaining = threshold - total;

        const textElem = counter.querySelector('.free-shipping-text');
        const amountElem = counter.querySelector('.free-shipping-amount');
        const barElem = counter.querySelector('.free-shipping-bar');

        if(remaining <= 0){
            textElem.textContent = 'У вас безкоштовна доставка';
            amountElem.style.display = 'none';
            barElem.style.width = '100%';
        } else {
            textElem.textContent = 'До безкоштовної доставки залишилось ';
            amountElem.style.display = 'inline';
            amountElem.textContent = remaining.toFixed(0);
            barElem.style.width = Math.min((total/threshold)*100,100)+'%';
        }
    }

    function initFreeShippingCounter(){
        const targetBlock = document.querySelector('.order-summary'); // <<< ПРИВЯЗКА СЮДА
        if(!targetBlock) return;

        const counter = createCounter(targetBlock);
        updateCounter(counter);

        const totalElem = document.querySelector('.j-total-sum');
        if(totalElem && !totalElem.dataset.observerAttached){
            const observer = new MutationObserver(()=> updateCounter(counter));
            observer.observe(totalElem, { childList:true, subtree:true, characterData:true });
            totalElem.dataset.observerAttached = "true";
        }
    }

    document.addEventListener('DOMContentLoaded', function(){
        initFreeShippingCounter();
        setInterval(initFreeShippingCounter, 500);
    });
})();
