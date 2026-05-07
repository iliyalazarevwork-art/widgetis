// source: https://technikaplace.com.ua/
// extracted: 2026-05-07T21:20:11.670Z
// scripts: 1

// === script #1 (length=1010) ===
$(function() {
	if ($("html").attr('lang') == 'uk') {
        $('.footer__development').html('<div class="makers" style="padding-bottom: 20px;">Реклама та просування - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#008675;">SoVa Marketing</div>');
        $('.footer__base').append('<div class="makers" style="padding-bottom: 20px;">Реклама та просування - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#008675;">SoVa Marketing</div>')
    } else {
        $('.footer__development').html('<div class="makers" style="padding-bottom: 20px;">Реклама и продвижение - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#008675;">SoVa Marketing</div>');
        $('.footer__base').append('<div class="makers" style="padding-bottom: 20px;">Реклама и продвижение - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#008675;">SoVa Marketing</div>');
    };
});
