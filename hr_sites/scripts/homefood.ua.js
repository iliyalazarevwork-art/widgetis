// source: https://homefood.ua/
// extracted: 2026-05-07T21:18:54.232Z
// scripts: 1

// === script #1 (length=5372) ===
(function () {
        // Захист від повторної ініціалізації, якщо скрипт випадково підключили двічі
        if (window.__HF_POPULAR_SCRIPT_INITED) return;
        window.__HF_POPULAR_SCRIPT_INITED = true;
    
        const POPULAR_URL = "/popular.html";
        const SENTINEL_ID = "hf-popular-sentinel";
        let popularLoaded = false;
    
        // Розставляємо блоки котів/собак по місцях
        function placePopularBlocks() {
        const cats = document.getElementById("cats-popular");
        const dogs = document.getElementById("dogs-popular");
    
        if (!cats || !dogs) return;
    
        const frontInfo = document.querySelector("section.frontInfo");
        const about = document.querySelector("section.about");
        const isMobile = window.matchMedia("(max-width: 599.98px)").matches;
    
        // Мобільна версія: ставимо ПЕРЕД about (спочатку коти, потім собаки)
        if (isMobile && about) {
            about.parentElement.insertBefore(cats, about);
            about.parentElement.insertBefore(dogs, about);
        }
        // Десктоп / планшет: ставимо ПЕРЕД frontInfo, якщо він є
        else if (frontInfo) {
            frontInfo.insertAdjacentElement("beforebegin", cats);
            frontInfo.insertAdjacentElement("beforebegin", dogs);
        }
        // Якщо frontInfo немає, але є about — запасний варіант для десктопу
        else if (about) {
            about.parentElement.insertBefore(cats, about);
            about.parentElement.insertBefore(dogs, about);
        }
        }
    
        // Вставляємо HTML з popular.html у документ
        function insertPopularHtml(html) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
    
        // 1) Переносимо стилі з popular.html у <head>
        const styles = wrapper.querySelectorAll("style");
        styles.forEach(function (styleEl) {
            document.head.appendChild(styleEl);
        });
    
        // 2) Якщо секції вже є у DOM — не дублюємо їх
        let cats = document.getElementById("cats-popular");
        let dogs = document.getElementById("dogs-popular");
    
        if (!cats) {
            const catsFromHtml = wrapper.querySelector("#cats-popular");
            if (catsFromHtml) {
            document.body.appendChild(catsFromHtml);
            cats = catsFromHtml;
            }
        }
    
        if (!dogs) {
            const dogsFromHtml = wrapper.querySelector("#dogs-popular");
            if (dogsFromHtml) {
            document.body.appendChild(dogsFromHtml);
            dogs = dogsFromHtml;
            }
        }
    
        // Якщо хоч одного блоку немає — далі робити нічого
        if (!cats || !dogs) return;
    
        // Після вставлення — розставити блоки по місцях
        placePopularBlocks();
        }
    
        // Ліниве завантаження popular.html
        function loadPopular() {
        // Якщо вже завантажували — не дублюємо
        if (popularLoaded) return;
    
        // Додатковий захист: якщо блоки вже є в DOM, не тягнемо HTML
        if (document.getElementById("cats-popular") || document.getElementById("dogs-popular")) {
            popularLoaded = true;
            placePopularBlocks();
            return;
        }
    
        popularLoaded = true;
    
        fetch(POPULAR_URL, { credentials: "same-origin" })
            .then(function (res) {
            if (!res.ok) throw new Error("Помилка завантаження " + POPULAR_URL);
            return res.text();
            })
            .then(insertPopularHtml)
            .catch(function (err) {
            console.error("HF popular error:", err);
            });
        }
    
        // Стартуємо тільки після ПОВНОГО завантаження сторінки
        window.addEventListener("load", function () {
        const frontInfo = document.querySelector("section.frontInfo");
        const about = document.querySelector("section.about");
    
        // Опорний елемент для scroll-спостереження
        const anchor = frontInfo || about || document.body;
        if (!anchor || !anchor.parentElement) {
            // якщо щось пішло не так — просто завантажити одразу
            loadPopular();
            return;
        }
    
        // Створюємо "маячок", до якого користувач має доскролити
        const sentinel = document.createElement("div");
        sentinel.id = SENTINEL_ID;
        sentinel.style.width = "100%";
        sentinel.style.height = "1px";
        sentinel.style.pointerEvents = "none";
    
        anchor.parentElement.insertBefore(sentinel, anchor);
    
        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(
            function (entries, observer) {
                if (entries.some(function (e) { return e.isIntersecting; })) {
                observer.disconnect();
                loadPopular();
                }
            },
            {
                root: null,
                rootMargin: "600px 0px", // завантажити трохи завчасно
                threshold: 0
            }
            );
    
            io.observe(sentinel);
        } else {
            // старі браузери: просто завантажити
            loadPopular();
        }
        });
    })();
