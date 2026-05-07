// source: https://fini.ua/
// extracted: 2026-05-07T21:21:23.755Z
// scripts: 1

// === script #1 (length=3822) ===
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  jQuery(document).ready(function($) {

    $('.popup__form').on('click', '.close1', function() {
      $('.popup__form_wr').fadeOut()
      setCookie('catch-form-send', 1, 365)
    })
    $('body').on('click', '.overlay-block', function() {
      $('.popup__form_wr').fadeOut()
    })

    $('.popup__form .field1 input').on('click', function() {
      $('.popup__form .field1 input').removeClass('error')
    })
    $('.popup__form .form-content .sending-button button').on('click', function() {
      let phone = $('.popup__form input[name="phone"]').val()

      if (phone.length < 17) {
        $('.popup__form input[name="phone"]').addClass('error')
        return false
      }
      var formData = new FormData();
      formData.append('phone', phone);

      jQuery.ajax({
        url: "https://finimail.com.ua/api/send_mail?token=bWFpbGVyIHBvcC11cCBmaW5pLnVh&phone=" + phone,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,

        success: function(data) {
          $('.popup__form input[name="phone"]').val('')

          setCookie('catch-form-send', 1, 365)
          $('.popup__form_wr .form-content .form__fields').remove()
          $('.popup__form_wr .form-content .form__title').html("<div id='sent'><h3>Ваша заявка успішно надіслана</h3><p>Ми зв'яжемся з Вами в найближчий час</p></div>")

          setTimeout(function() {
            $('.popup__form_wr').fadeOut()
          }, 5000)
        }
      });

    })

    if (!getCookie('catch-form-send') && getCookie('catch-form-send') != 1) {
      setTimeout(function() {
        if ($('.popup__form').is('div')) {
          $('.popup__form_wr').fadeIn()
        }
      }, 120000)
    }

    /* Global timeout START */
    function checkGlobalTimeout(timeout = 300000){
      var cookieGlobalPopupTimeoutStart = getCookie('global-popup-timeout-start');
      var cookieGlobalPopupTimeoutFinish = getCookie('global-popup-timeout-finish');
      // console.log('global timeout start', cookieGlobalPopupTimeoutStart);
      // console.log('global timeout finish', cookieGlobalPopupTimeoutFinish);

      var currentDate = new Date();
      var currentTimestamp = currentDate.getTime();

      if (!cookieGlobalPopupTimeoutStart && !cookieGlobalPopupTimeoutFinish){
        setCookie('global-popup-timeout-start', currentTimestamp, 7);
      } else if(cookieGlobalPopupTimeoutStart && !cookieGlobalPopupTimeoutFinish){
        var delta = parseInt(currentTimestamp) - parseInt(cookieGlobalPopupTimeoutStart);
        // console.log('global timeout delta', delta);
        if(delta > timeout){
          setCookie('global-popup-timeout-finish', currentTimestamp, 7);
          if (!$('.popup__form').is(':visible')) {
            console.log('global timeout works');
            $('.popup__form_wr').fadeIn()
          }
        }
      }
    }

    setInterval(checkGlobalTimeout, 10000);

    /* Global timeout END */
  })
  var selector = $(".popup__form_wr input[name='phone']");

  var im = new Inputmask("+38(099) 999-99-99");
  im.mask(selector);
