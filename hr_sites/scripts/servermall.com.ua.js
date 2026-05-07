// source: https://servermall.com.ua/
// extracted: 2026-05-07T21:19:06.089Z
// scripts: 1

// === script #1 (length=2611) ===
const images = [
        "https://i.postimg.cc/NFQBD5sQ/image.png",
        "https://i.postimg.cc/qvWL3Kw6/IT.png",
        "https://i.postimg.cc/1XRcQrm2/image.png",
        "https://i.postimg.cc/Bbh5QPt6/image.png",
        "https://i.postimg.cc/zBFS6crT/image.png",
        "https://i.postimg.cc/8kwmb9wS/image.png",
        
    ];

    const visibleCount = 3;
    const slideTrack = document.getElementById('slideTrack');
    let currentIndex = visibleCount; // из-за клонов в начале

    // Генерация слайдов
    function createSlides() {
        const total = images.length;
        const fullSlides = [];

        // Клонируем последние N в начало
        for (let i = total - visibleCount; i < total; i++) {
            fullSlides.push(createSlide(images[i]));
        }

        // Оригинальные
        for (let i = 0; i < total; i++) {
            fullSlides.push(createSlide(images[i]));
        }

        // Клонируем первые N в конец
        for (let i = 0; i < visibleCount; i++) {
            fullSlides.push(createSlide(images[i]));
        }

        fullSlides.forEach(slide => slideTrack.appendChild(slide));
    }

    function createSlide(src) {
        const slide = document.createElement('div');
        slide.classList.add('slide');
        const img = document.createElement('img');
        img.src = src;
        slide.appendChild(img);
        return slide;
    }

    function updateSlider(animate = true) {
        const slideWidth = slideTrack.children[0].offsetWidth;
        const offset = currentIndex * slideWidth;
        if (!animate) {
            slideTrack.style.transition = "none";
        } else {
            slideTrack.style.transition = "transform 0.5s ease";
        }
        slideTrack.style.transform = `translateX(-${offset}px)`;
    }

    function moveSlide(direction) {
        currentIndex += direction;
        updateSlider();

        const total = images.length;

        // после анимации проверка и сброс на оригинальные
        setTimeout(() => {
            if (currentIndex >= total + visibleCount) {
                currentIndex = visibleCount;
                updateSlider(false);
            } else if (currentIndex < visibleCount) {
                currentIndex = total + visibleCount - 1;
                updateSlider(false);
            }
        }, 510); // немного больше transition
    }

    // Инициализация
    createSlides();
    window.addEventListener('resize', () => updateSlider(false));
    window.addEventListener('load', () => updateSlider(false));
