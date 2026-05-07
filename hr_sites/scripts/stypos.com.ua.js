// source: https://stypos.com.ua/
// extracted: 2026-05-07T21:20:24.124Z
// scripts: 2

// === script #1 (length=652) ===
$(document).ready(function(){
      $('.slider').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        responsive:[
{
            breakpoint: 1050,
            settings: {
              slidesToShow:2,
            }
          },
          {
            breakpoint: 770,
            settings: {
             slidesToShow:2,
              arrows: false,
            }
          },
          {
            breakpoint: 550,
            settings: {
              slidesToShow:1,
              arrows: false,
            }
          }
        ]
      });
    });

// === script #2 (length=660) ===
$(document).ready(function(){
      $('.slider_reviews').slick({
        slidesToShow: 2,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        responsive:[
{
            breakpoint: 1050,
            settings: {
              slidesToShow:1,
            }
          },
          {
            breakpoint: 770,
            settings: {
             slidesToShow:1,
              arrows: false,
            }
          },
          {
            breakpoint: 550,
            settings: {
              slidesToShow:1,
              arrows: false,
            }
          }
        ]
      });
    });
