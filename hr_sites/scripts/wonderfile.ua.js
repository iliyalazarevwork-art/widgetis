// source: https://wonderfile.ua/
// extracted: 2026-05-07T21:23:13.298Z
// scripts: 1

// === script #1 (length=699) ===
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    // Селектори блоків, які мають плавно з'являтися
    const elementsToAnimate = document.querySelectorAll('.benefits, .z-card-about, .z-card-image, .z-m-item, .catalog-controls');
    
    elementsToAnimate.forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
    });
});
