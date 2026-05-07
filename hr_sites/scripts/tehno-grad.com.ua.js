// source: https://tehno-grad.com.ua/
// extracted: 2026-05-07T21:22:56.470Z
// scripts: 1

// === script #1 (length=999) ===
$(function() {
  if ($("html").attr('lang') == 'uk') {
        $('.footer__development').html('<div class="makers" style="padding-bottom: 20px;">Реклама та просування - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#fff;">SoVa Marketing</div>');
        $('.footer__base').append('<div class="makers" style="padding-bottom: 20px;">Реклама та просування - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#fff;">SoVa Marketing</div>')
    } else {
        $('.footer__development').html('<div class="makers" style="padding-bottom: 20px;">Реклама и продвижение - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#fff;">SoVa Marketing</div>');
        $('.footer__base').append('<div class="makers" style="padding-bottom: 20px;">Реклама и продвижение - <a href="https://sovamarketing.com.ua/" target="_blank" style="font-weight:700; color:#fff;">SoVa Marketing</div>');
    };
});
