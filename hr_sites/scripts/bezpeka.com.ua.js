// source: https://bezpeka.com.ua/
// extracted: 2026-05-07T21:18:58.989Z
// scripts: 1

// === script #1 (length=1265) ===
$(document).ready(function () {
        if (localStorage.getItem('popState') != 'shown') {
            $("#once-popup").delay(300).fadeIn();
            classBody = document.querySelector('body');
            classBody.classList.add('scroll-lock');
        }
        const btnRU = document.querySelector('.btn-ru');
        btnRU.addEventListener('click', function () {
            localStorage.setItem('popState', 'shown')
            if (window.location.pathname.slice(0, 4) == '/ua/') {
                window.location.pathname = window.location.pathname.slice(3)
            } else {
                $('#once-popup').fadeOut(); // Now the pop up is hiden.
                classBody.classList.remove('scroll-lock');
            }
        })
        const btnUA = document.querySelector('.btn-ua');
        btnUA.addEventListener('click', function () {
            localStorage.setItem('popState', 'shown')
            if (window.location.pathname.slice(0, 4) != '/ua/') {
                window.location.pathname = '/ua' + window.location.pathname
            } else {
                $('#once-popup').fadeOut(); // Now the pop up is hiden.
                classBody.classList.remove('scroll-lock');
            }
        })


    });
