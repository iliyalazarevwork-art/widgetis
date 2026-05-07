// source: https://tac-postel.com.ua/
// extracted: 2026-05-07T21:22:54.410Z
// scripts: 1

// === script #1 (length=2638) ===
(function() {
    const successSection = document.querySelector('.checkout.__success');
    if (!successSection) return;

    const orderTitle = document.querySelector('.checkout-complete .h2')?.textContent.trim() || '';
    const orderId = orderTitle.replace(/[^\d]/g, '');

    if (!orderId) return;

    if (sessionStorage.getItem('sent_order_' + orderId)) {
        return;
    }

    const getValueByKeywords = (keywords) => {
        const dts = Array.from(document.querySelectorAll('#order-customer-data dt.check-h'));
        const targetDt = dts.find(dt => {
            const text = dt.textContent.toLowerCase().trim();
            return keywords.some(kw => text.includes(kw.toLowerCase()));
        });
        
        if (targetDt && targetDt.nextElementSibling) {
            return targetDt.nextElementSibling.textContent.replace(/\s+/g, ' ').trim();
        }
        return '';
    };

    const orderData = {
        order_id: orderId,
        customer: {
            name:     getValueByKeywords(['Ім\'я', 'Имя', 'Прізвище', 'Фамилия']),
            email:    getValueByKeywords(['пошта', 'почта', 'email']),
            phone:    getValueByKeywords(['Телефон']),
            city:     getValueByKeywords(['Місто', 'Город']),
             address:  getValueByKeywords(['Адреса', 'Адрес', 'Відділення', 'Отделение']),
            delivery: getValueByKeywords(['Спосіб доставки', 'Способ доставки']),
            payment:  getValueByKeywords(['Спосіб оплати', 'Способ оплаты'])
        },
        products: [],
        total_sum: document.querySelector('.order-summary-b')?.textContent.trim() || ''
    };

    document.querySelectorAll('.order-list .order-i').forEach(item => {
        const titleEl = item.querySelector('.order-i-title');
        orderData.products.push({
            title: titleEl?.textContent.trim(),
            url: titleEl?.querySelector('a')?.href,
            price_info: item.querySelector('.order-i-price')?.textContent.trim(),
            row_total: item.querySelector('.order-i-cost')?.textContent.trim()
        });
    });

    fetch("https://mdt.com.ua/api/order_receive.php?api_key=30f082cc43f84b226cd2a6097f5c8c8823c2bbed163ae7c3c48a8e03c32203c0", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (response.ok) {
            sessionStorage.setItem('sent_order_' + orderId, 'true');
 
        }
    })
    .catch(error => console.error('Ошибка:', error));
})();
