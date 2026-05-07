// source: https://lambre.ua/
// extracted: 2026-05-07T21:18:53.700Z
// scripts: 2

// === script #1 (length=783) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/project_override/themes/horoshop_default/layout/img/svgdefs.svg",o=1573908075;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=715) ===
var link = document.querySelector('.j-version-link');

                            link.addEventListener('click', function (e) {
                                e.preventDefault();

                                var action = "/_widget/version_change/change/";

                                sendAjax(action, {version: 'mobile'}, function (status, response) {
                                    if (status === 'OK') {
                                        window.location = "https://lambre.ua/";
                                    } else {
                                        console.log(response);
                                    }
                                });
                            });
