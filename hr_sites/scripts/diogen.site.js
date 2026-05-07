// source: https://diogen.site/
// extracted: 2026-05-07T21:20:31.292Z
// scripts: 1

// === script #1 (length=1638) ===
const accordions = document.querySelectorAll('.custom-faq__item');

	if (accordions) {
		accordions.forEach(accordion => {
			const accordionTitle = accordion.querySelector('.custom-faq__title');
			const accordionBody = accordion.querySelector('.custom-faq__text');

			accordionTitle.addEventListener('click', e => {
				if (accordionBody.style.maxHeight) {
					closeAccordion(accordion);
				} else {
					// accordions.forEach(accordion => closeAccordion(accordion));
					openAccordion(accordion);
				}
				e.preventDefault();
			});
		});

		const openAccordion = accordion => {
			const accordionBody = accordion.querySelector('.custom-faq__text');
			accordion.classList.add('open');
			accordionBody.style.maxHeight = accordionBody.scrollHeight + 10 + 'px';
		};
		const closeAccordion = accordion => {
			const accordionBody = accordion.querySelector('.custom-faq__text');
			accordion.classList.remove('open');
			accordionBody.style.maxHeight = null;
		};

		function getActiveAccordion() {
			let activeAccordion = document.querySelector('.custom-faq__item.open');
			if (activeAccordion) {
				return activeAccordion;
			}
			return false;
		}

		window.onload = () => {
			let activeAccordion = getActiveAccordion();
			if (activeAccordion) {
				openAccordion(activeAccordion);
			}
		};
		window.addEventListener('resize', () => {
			let activeAccordion = getActiveAccordion();
			if (activeAccordion) {
				let accordionBody = activeAccordion.querySelector('.custom-faq__text');
				accordionBody.style.maxHeight = accordionBody.scrollHeight + 10 + 'px';
			}
		});
	}
