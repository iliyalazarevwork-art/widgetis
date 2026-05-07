// source: https://dritko.com/
// extracted: 2026-05-07T21:21:12.440Z
// scripts: 1

// === script #1 (length=3126) ===
// Додаємо інтерактивність до карток
        document.querySelectorAll('.info-card, .product-item').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Анімація появи елементів при скролі
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Застосовуємо анімацію до всіх карток
        document.querySelectorAll('.info-card, .product-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        // Динамічні частинки в фоні
        function createParticle() {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(252, 126, 1, 0.7);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                animation: float 8s linear infinite;
            `;
            
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '100%';
            
            const keyframes = `
                @keyframes float {
                    0% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(${(Math.random() - 0.5) * 100}px);
                        opacity: 0;
                    }
                }
            `;
            
            if (!document.querySelector('#particle-keyframes')) {
                const style = document.createElement('style');
                style.id = 'particle-keyframes';
                style.textContent = keyframes;
                document.head.appendChild(style);
            }
            
            document.querySelector('.dritko-container').appendChild(particle);
            
            setTimeout(() => particle.remove(), 8000);
        }

        // Створюємо частинки періодично
        setInterval(createParticle, 2000);
