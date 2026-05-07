// source: https://roow.com.ua/
// extracted: 2026-05-07T21:20:23.666Z
// scripts: 1

// === script #1 (length=5169) ===
// Створюємо елементи модального вікна та затемнення фону
const overlay = document.createElement('div');
overlay.id = 'overlay';
 
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.18)';
overlay.style.zIndex = '1000';

const modal = document.createElement('div');
modal.id = 'modal';
modal.style.display = 'none';
modal.style.position = 'fixed';
modal.style.top = '50%';
modal.style.left = '50%';
modal.style.transform = 'translate(-50%, -50%)';
modal.style.backgroundColor = '#fff';
modal.style.padding = '20px';
modal.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.5)';
modal.style.zIndex = '1001';
modal.style.backgroundColor = 'color(srgb 0.5635 0.5549 0.895)';
modal.style.backgroundSize = 'cover';
modal.style.textAlign = 'center';
modal.style.color = 'white';

const modalContent = document.createElement('div');
modalContent.id = 'myBlock';
overlay.style.display = 'none';
const closeButton = document.createElement('button');
closeButton.id = 'close-btn';
closeButton.textContent = 'Х';
closeButton.style.padding = '5px 8px';
closeButton.style.backgroundColor = 'rgb(0, 123, 255)';
closeButton.style.color = 'black';
closeButton.style.border = 'medium';
closeButton.style.cursor = 'pointer';
closeButton.style.position = 'absolute';
closeButton.style.background = 'white';
closeButton.style.fontWeight = '700';
closeButton.style.borderRadius = '50%';
closeButton.style.right = '0';
closeButton.style.top = '0';
closeButton.style.marginTop = '-10px';
closeButton.style.marginRight = '-9px';

const modalTitle = document.createElement('h2');
modalTitle.textContent = 'Не впевнені в покупці?';
modalTitle.style.fontSize = '23px';  // Додаємо стиль заголовку

const modalText = document.createElement('p');
modalText.textContent = 'Заощаджуйте з нашою знижкою і зробіть вибір легшим!';
modalText.style.fontSize = '18px';  // Додаємо стиль тексту

const modalTitle4 = document.createElement('h4');
modalTitle4.textContent = 'Промокод на знижку 5%. Активується в кошику під час оформлення замовлення';
modalTitle4.style.fontSize = '11px';  // Додаємо стиль заголовку

const saleCode = document.createElement('div');
saleCode.className = 'block_sale';
saleCode.textContent = 'SHOP5SAVE';
saleCode.style.fontSize = '33px';  // Додаємо стиль коду знижки
saleCode.style.marginTop = '25px';

const modalTitle5 = document.createElement('h5');
modalTitle5.textContent = 'Щоб активувати промокод, скопіюйте його і використайте у відповідному полі під час оформлення замовлення';
modalTitle5.style.fontSize = '11px';  // Додаємо стиль заголовку

// Додаємо елементи до документа
modalContent.appendChild(closeButton);
modalContent.appendChild(modalTitle);
modalContent.appendChild(modalText);
modalContent.appendChild(modalTitle4);
modalContent.appendChild(saleCode);
modalContent.appendChild(modalTitle5);
modal.appendChild(modalContent);
document.body.appendChild(overlay);
document.body.appendChild(modal);

// Створюємо круглий блок для відкриття модального вікна
const openModalButton = document.createElement('div');
openModalButton.id = 'open-modal-btn';
openModalButton.textContent = '-5%';
openModalButton.style.width = '51px';
openModalButton.style.height = '51px';
openModalButton.style.backgroundColor = 'rgb(102 99 178)';
openModalButton.style.color = 'white';
openModalButton.style.borderRadius = '50%';
openModalButton.style.position = 'fixed';
openModalButton.style.left = '2.6%';
openModalButton.style.bottom = '10px';
openModalButton.style.display = 'none';  // Спочатку приховано
openModalButton.style.alignItems = 'center';
openModalButton.style.justifyContent = 'center';
openModalButton.style.textAlign = 'center';
openModalButton.style.lineHeight = '50px';
openModalButton.style.cursor = 'pointer';
openModalButton.style.zIndex = '1002';
openModalButton.style.fontWeight = '700';
openModalButton.style.fontSize = '22px';

document.body.appendChild(openModalButton);

// Функція для показу модального вікна
function showModal() {
    overlay.style.display = 'none';
    modal.style.display = 'none';
    openModalButton.style.display = 'none';
}

// Функція для закриття модального вікна
function closeModal() {
    overlay.style.display = 'none';
    modal.style.display = 'none';
    openModalButton.style.display = 'none';  // Не показуємо круглий блок після закриття модального вікна
}

// Функція для відкриття модального вікна при натисканні на круглий блок
openModalButton.addEventListener('click', showModal);

// Таймер на 15 хвилин (900000 мілісекунд)
setTimeout(showModal, 120000);

// Закриття вікна при натисканні кнопки
closeButton.addEventListener('click', closeModal);

// Закриття вікна при натисканні поза межами вікна
overlay.addEventListener('click', function(event) {
    if (event.target === overlay) {
        closeModal();
        openModalButton.style.display = 'flex';  // Показуємо круглий блок після натискання поза межами модального вікна
    }
});
