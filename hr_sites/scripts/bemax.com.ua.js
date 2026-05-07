// source: https://bemax.com.ua/
// extracted: 2026-05-07T21:20:56.328Z
// scripts: 2

// === script #1 (length=3031) ===
document.addEventListener('DOMContentLoaded', function () {
		// Создание HTML-структуры
		const container = document.createElement('div');
		container.className = 'feedbackContainer-0-2-298';
		container.innerHTML = `
				<div class="dib">
					<button
						type="button"
						class="feedbackButton-0-2-299 feedbackButton-d1-0-2-304 bd0 pr cup"
					></button>
					<button
						type="button"
						class="feedbackButton-0-2-299 feedbackButton-d1-0-2-304 bd0 pr cup feedbackButtonOpened-0-2-300"
						style="display: none"
					></button>
					<div>
						<div
							class="pa feedbackPopover-0-2-301 root-0-2-305"
							style="
								width: auto;
								position: absolute;
								inset: auto 0px 0px auto;
								margin: 0px;
								z-index: 1010;
								transform: translate3d(0px, -69.6px, 0px);
								display: none;
							"
							data-popper-placement="top-start"
						>
							<ul class="feedbackItems-0-2-307">
								<li class="feedbackItem-0-2-308">
									<a href="viber://chat?number=%2B380730008773" target="_blank" rel="noreferrer nofollow"
										class="feedbackDescription-0-2-309 df aic bd0 cup"
										style="background-image: url('https://i.citrus.world/uploads/icons/feedback/viber.svg');">
										Viber</a>
								</li>
								<li class="feedbackItem-0-2-308">
									<a href="https://t.me/+380730008773" target="_blank" rel="noreferrer nofollow"
										class="feedbackDescription-0-2-309 df aic bd0 cup"
										style="background-image: url('https://i.citrus.world/uploads/icons/feedback/telegram.svg');">
										Telegram</a>
								</li>
								<li class="feedbackItem-0-2-308">
									<a
										href="tel:+380730008773"
										class="feedbackDescription-0-2-309 df aic bd0 cup"
										style="
											background-image: url('https://i.citrus.world/uploads/icons/feedback/phone.svg');
										"
									>
										Передзвонити
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
			`;
		document.body.appendChild(container);

		// Добавление логики
		const defaultButton = container.querySelector(
			'.feedbackButton-0-2-299.feedbackButton-d1-0-2-304.bd0.pr.cup:not(.feedbackButtonOpened-0-2-300)'
		);
		const openedButton = container.querySelector(
			'.feedbackButton-0-2-299.feedbackButton-d1-0-2-304.bd0.pr.cup.feedbackButtonOpened-0-2-300'
		);
		const popover = container.querySelector(
			'.pa.feedbackPopover-0-2-301.root-0-2-305'
		);

		if (defaultButton) {
			defaultButton.addEventListener('click', function () {
				defaultButton.style.display = 'none';
				if (openedButton) openedButton.style.display = 'block';
				if (popover) popover.style.display = 'block';
			});
		}

		if (openedButton) {
			openedButton.addEventListener('click', function () {
				if (defaultButton) defaultButton.style.display = 'block';
				openedButton.style.display = 'none';
				if (popover) popover.style.display = 'none';
			});
		}
	});

// === script #2 (length=654) ===
var _protocol="https:"==document.location.protocol?"https://":"http://";
    _site_hash_code = "40c7a20fa84987d4b072294a47d2f667",_suid=73024, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
    plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}
