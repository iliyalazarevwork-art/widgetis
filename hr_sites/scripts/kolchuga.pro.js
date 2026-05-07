// source: https://kolchuga.pro/
// extracted: 2026-05-07T21:21:43.730Z
// scripts: 3

// === script #1 (length=3891) ===
document.addEventListener("DOMContentLoaded", () => {

    const detectLang = () =>
        window.location.pathname.startsWith("/ru/") ? "ru" : "ua";

    const menuSets = {
        protection: {
            ua: [
                { href: "/typy-tekhnolohii-ta-materialy/", text: "Типи, технології та матеріали" },
                { href: "/nadiinist-ta-harantii/", text: "Надійність та гарантії" },
                { href: "/tochnyi-pidbir/", text: "Точний підбір" },
                { href: "/vstanovlennia-zakhystu/", text: "Встановлення захисту" }
            ],
            ru: [
                { href: "/ru/typy-tekhnolohii-ta-materialy/", text: "Типы, технологии и материалы" },
                { href: "/ru/nadiinist-ta-harantii/", text: "Надежность и гарантии" },
                { href: "/ru/tochnyi-pidbir/", text: "Точный подбор" },
                { href: "/ru/vstanovlennia-zakhystu/", text: "Установка защиты" }
            ]
        },
        client: {
            ua: [
                { href: "/oplata-i-dostavka/", text: "Оплата і доставка" },
                { href: "/obmin-ta-povernennia/", text: "Обмін та повернення" },
                { href: "/znyzhka-dlia-syl-oborony-ta-volonteriv/", text: "Знижки військовим" },
                { href: "/partnerska-prohrama-loialnosti-mizh-kolchuga-ta-prosalon/", text: "Програма лояльності" },
                { href: "/uhoda-korystuvacha/", text: "Угода користувача" }
            ],
            ru: [
                { href: "/ru/oplata-i-dostavka/", text: "Оплата и доставка" },
                { href: "/ru/obmin-ta-povernennia/", text: "Обмен и возврат" },
                { href: "/ru/znyzhka-dlia-syl-oborony-ta-volonteriv/", text: "Скидки военным" },
                { href: "/ru/partnerska-prohrama-loialnosti-mizh-kolchuga-ta-prosalon/", text: "Программа лояльности" },
                { href: "/ru/uhoda-korystuvacha/", text: "Пользовательское соглашение" }
            ]
        }
    };

    const buildDropdown = (anchorSelector, itemsList) => {
        const anchor = document.querySelector(anchorSelector);
        if (!anchor) return;

        const wrapper = anchor.parentElement;
        wrapper.classList.add("nav-item--with-sub");

        const trigger = document.createElement("span");
        trigger.className = "nav-subtoggle";
        trigger.innerHTML = `
            <svg class="icon icon--arrow-down-light">
                <use xlink:href="#icon-arrow-down-light"></use>
            </svg>
        `;
        anchor.after(trigger);

        const list = document.createElement("ul");
        list.className = "nav-submenu";

        itemsList.forEach(entry => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = entry.href;
            link.textContent = entry.text;
            li.appendChild(link);
            list.appendChild(li);
        });

        wrapper.appendChild(list);

        trigger.addEventListener("click", e => {
            e.preventDefault();
            list.classList.toggle("is-open");
        });

        wrapper.addEventListener("mouseenter", () => list.classList.add("is-open"));
        wrapper.addEventListener("mouseleave", () => list.classList.remove("is-open"));
    };

    const activeLang = detectLang();

    buildDropdown(
        activeLang === "ru"
            ? ".site-menu__item a[href*='/ru/typy-tekhnolohii-ta-materialy/']"
            : ".site-menu__item a[href*='/typy-tekhnolohii-ta-materialy/']",
        menuSets.protection[activeLang]
    );

    buildDropdown(
        activeLang === "ru"
            ? ".site-menu__item a[href*='/ru/oplata-i-dostavka/']"
            : ".site-menu__item a[href*='/oplata-i-dostavka/']",
        menuSets.client[activeLang]
    );

});

// === script #2 (length=1439) ===
document.addEventListener("DOMContentLoaded", function() {
if (window.location.pathname.includes("/pytannia-vidpovidi/")) {

    const article =
        document.querySelector('.page-faq .article-text') ||
        document.querySelector('.page-faq .blog__inner .text');
    if (!article) return;

    const headers = article.querySelectorAll('h2');

    headers.forEach((h2) => {
        const arrow = document.createElement('span');
        arrow.classList.add('faq-arrow');
        arrow.innerHTML = `
            <svg class="icon icon--arrow-down-light">
                <use xlink:href="#icon-arrow-down-light"></use>
            </svg>`;
        h2.appendChild(arrow);

        const answerWrapper = document.createElement('div');
        answerWrapper.classList.add('faq-answer');

        let next = h2.nextElementSibling;
        while (next && next.tagName !== 'H2') {
            const toMove = next;
            next = next.nextElementSibling;
            answerWrapper.appendChild(toMove);
        }

        h2.insertAdjacentElement('afterend', answerWrapper);

        h2.addEventListener('click', () => {
            h2.classList.toggle('active');

            const isOpen = h2.classList.contains('active');
            answerWrapper.style.maxHeight = isOpen ? answerWrapper.scrollHeight + 'px' : '0px';
        });

        document.body.classList.add('faq-ready');
    });

}
});

// === script #3 (length=4748) ===
const replacements = [
  ["/content/images/25/300x200e80nn0/yak-samostiino-vstanovyty-zakhyst-kolchuga-pokrokova-instruktsiia-38581763984013", "/content/images/25/300x200e80nn0/yak-samostiino-vstanovyty-zakhyst-kolchuga-pokrokova-instruktsiia-96025790666967"],
  ["/content/images/25/1200x400e80nn0/yak-samostiino-vstanovyty-zakhyst-kolchuga-pokrokova-instruktsiia-26303948662749", "/content/images/25/1200x400e80nn0/yak-samostiino-vstanovyty-zakhyst-kolchuga-pokrokova-instruktsiia-33917733948803"],
  ["/content/images/24/300x200e80nn0/chym-vidrizniaietsia-kholodnokatana-stal-vid-hariachekatanoi-i-chomu-tse-vazhlyvo-dlia-vashoho-avto-89566234896749", "/content/images/24/300x200e80nn0/chym-vidrizniaietsia-kholodnokatana-stal-vid-hariachekatanoi-i-chomu-tse-vazhlyvo-dlia-vashoho-avto-12210983175098"],
  ["/content/images/24/1200x400e80nn0/chym-vidrizniaietsia-kholodnokatana-stal-vid-hariachekatanoi-i-chomu-tse-vazhlyvo-dlia-vashoho-avto-77654607926753", "/content/images/24/1200x400e80nn0/chym-vidrizniaietsia-kholodnokatana-stal-vid-hariachekatanoi-i-chomu-tse-vazhlyvo-dlia-vashoho-avto-31338520169356"],
  ["/content/images/23/300x200e80nn0/pokryttia-standart-whitecover-zipoflex-aluox-yake-obraty-73569443277735", "/content/images/23/300x200e80nn0/pokryttia-standart-whitecover-zipoflex-aluox-yake-obraty-11693181224072"],
  ["/content/images/23/1200x400e80nn0/pokryttia-standart-whitecover-zipoflex-aluox-yake-obraty-91739336606674", "/content/images/23/1200x400e80nn0/pokryttia-standart-whitecover-zipoflex-aluox-yake-obraty-54051341779117"],
  ["/content/images/22/300x200e80nn0/tsynkove-pokryttia-kolchuga-yak-vono-pratsiuie-i-chomu-podovzhuie-zhyttia-metalu-73065661882125", "/content/images/22/300x200e80nn0/tsynkove-pokryttia-kolchuga-yak-vono-pratsiuie-i-chomu-podovzhuie-zhyttia-metalu-46356859097834"],
  ["/content/images/22/1200x400e80nn0/tsynkove-pokryttia-kolchuga-yak-vono-pratsiuie-i-chomu-podovzhuie-zhyttia-metalu-76849397035688", "/content/images/22/1200x400e80nn0/tsynkove-pokryttia-kolchuga-yak-vono-pratsiuie-i-chomu-podovzhuie-zhyttia-metalu-69528936336698"],
  ["/content/images/21/300x200e80nn0/yak-pereviryty-oryhinalnist-zakhystu-kolchuga-ta-unyknuty-pidrobky-77975298518814", "/content/images/21/300x200e80nn0/yak-pereviryty-oryhinalnist-zakhystu-kolchuga-ta-unyknuty-pidrobky-94121435700489"],
  ["/content/images/21/1200x400e80nn0/yak-pereviryty-oryhinalnist-zakhystu-kolchuga-ta-unyknuty-pidrobky-52328921326973", "/content/images/21/1200x400e80nn0/yak-pereviryty-oryhinalnist-zakhystu-kolchuga-ta-unyknuty-pidrobky-17145676441231"],
  ["/content/images/20/300x200e80nn0/chomu-zakhyst-dvyhuna-kolchuga-koshtuie-dorozhche-i-chomu-tse-vypravdano-52487716938842", "/content/images/20/300x200e80nn0/chomu-zakhyst-dvyhuna-kolchuga-koshtuie-dorozhche-i-chomu-tse-vypravdano-92790164921563"],
  ["/content/images/20/1200x400e80nn0/chomu-zakhyst-dvyhuna-kolchuga-koshtuie-dorozhche-i-chomu-tse-vypravdano-48017510117180", "/content/images/20/1200x400e80nn0/chomu-zakhyst-dvyhuna-kolchuga-koshtuie-dorozhche-i-chomu-tse-vypravdano-76612761064116"],
  ["/content/images/19/300x200e80nn0/zakhyst-dvyhuna-koly-vin-potriben-i-yakyi-obraty-63177790506413", "/content/images/19/300x200e80nn0/zakhyst-dvyhuna-koly-vin-potriben-i-yakyi-obraty-18307030810600"],
  ["/content/images/19/1200x400e80nn0/zakhyst-dvyhuna-koly-vin-potriben-i-yakyi-obraty-97090345050442", "/content/images/19/1200x400e80nn0/zakhyst-dvyhuna-koly-vin-potriben-i-yakyi-obraty-93001616552597"],
  ["/content/images/26/300x200e80nn0/partnerska-prohrama-loialnosti-mizh-kolchuga-ta-prosalon-30706018909143", "/content/images/1/300x200e80nn0/partnerska-prohrama-loialnosti-mizh-kolchuga-ta-prosalon-15956606532806"],
  ["/content/images/26/1200x400e80nn0/partnerska-prohrama-loialnosti-mizh-kolchuga-ta-prosalon-65786349906242", "/content/images/1/1200x400e80nn0/partnerska-prohrama-loialnosti-mizh-kolchuga-ta-prosalon-76669243546412"],
  ["/content/images/27/300x200e80nn0/znyzhka-dlia-syl-oborony-ta-volonteriv-66483554914323", "/content/images/1/300x200e80nn0/znyzhka-dlia-syl-oborony-ta-volonteriv-36480285018603"],
  ["/content/images/27/1200x400e80nn0/znyzhka-dlia-syl-oborony-ta-volonteriv-36538172737545", "/content/images/1/1200x400e80nn0/znyzhka-dlia-syl-oborony-ta-volonteriv-68588441601687"],
];
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("ru-RU")) return;
  document.querySelectorAll("img").forEach((img) => {
    let src = img.getAttribute("src");
    if (!src) return;
    for (const [oldUrl, newUrl] of replacements) {
      if (src.includes(oldUrl)) {
        src = src.replace(oldUrl, newUrl);
      }
    }
    img.setAttribute("src", src);
  });
});
