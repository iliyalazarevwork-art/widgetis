// source: https://riksi.ua/
// extracted: 2026-05-07T21:19:23.566Z
// scripts: 2

// === script #1 (length=1274) ===
const mainCircle = document.getElementById('main-circle');
        const subCircleContainer = document.getElementById('sub-circle-container');

        mainCircle.addEventListener('click', () => {
            subCircleContainer.classList.toggle('show');
        });

        const socialMediaLinks = [
            { name: 'Instagram', iconClass: 'fab fa-instagram', link: 'https://instagram.com/riksi_ua/', color: 'rgb(225, 49, 178)' },
            { name: 'Viber', iconClass: 'fab fa-viber', link: 'viber://add?number=380932478447', color: '#8a5897' },
            { name: 'Telegram', iconClass: 'fab fa-telegram-plane', link: 'https://telegram.me/riksi_ua', color: 'rgb(80, 162, 221)' },
            { name: 'Messenger', iconClass: 'fab fa-facebook-messenger', link:
'https://m.me/riksi.ua', color: 'rgb(0 159 255)' }
        ];

        socialMediaLinks.forEach(socialMedia => {
            const subCircle = document.createElement('div');
            subCircle.classList.add('sub-circle');
            subCircle.style.backgroundColor = socialMedia.color;
            subCircle.innerHTML = `<a href="${socialMedia.link}" target="_blank"><i class="${socialMedia.iconClass}"></i></a>`;
            subCircleContainer.appendChild(subCircle);
        });

// === script #2 (length=749) ===
document.addEventListener('DOMContentLoaded', () => {
  const ibanButton = document.getElementById('ibanButton');
  const ibanElement = document.getElementById('iban');

  if (ibanButton && ibanElement) {
    ibanButton.addEventListener('click', () => {
      const ibanText = ibanElement.textContent.trim();
      navigator.clipboard.writeText(ibanText).then(() => {
        console.log('IBAN скопійовано в буфер обміну');
      }).catch(err => {
        console.error('Не вдалося скопіювати текст: ', err);
      });
    });
  } else {
    console.error('Кнопка або елемент IBAN не знайдені');
  }
});
const setting_form_nb = {
    summ_cart: 5000,
    color_one: 'black',
    color_two: '#daa520',
    color_text: '#fff',
};
