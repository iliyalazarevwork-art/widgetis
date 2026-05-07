// source: https://tishotka.com.ua/
// extracted: 2026-05-07T21:19:29.370Z
// scripts: 2

// === script #1 (length=679) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '975013850296551',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=1211) ===
const tomorrow = () => {
  // Get today's date
  let today = new Date();
  // Change the date by adding 1 to it (today + 1 = tomorrow)
  today.setDate(today.getDate() + 1);
  // return yyyy-mm-dd format
  return today.toLocaleString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric' });
};

const dateOfXDay = (xDay = 3) => {
  // Get today's date
  let today = new Date();
  // Change the date by adding 3 to it (today + 3 = tomorrow)
  today.setDate(today.getDate() + 3);
  // return yyyy-mm-dd format
  return today.toLocaleString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric' });
};

// display the result in the widget span tag
document.querySelector(".tomorrow-date").innerHTML = tomorrow()
// display the result in the subscription widget span tag
document.querySelector(".subscription-end-date").innerHTML = dateOfXDay(365);
</SCRIPT>

<script>
// Select button element
let button = document.querySelector(".copy-button");

// Get inner content from div
let textToCopy = document.querySelector(".text-to-copy").innerHTML;

// Copy text to the clipboard 
button.addEventListener("click", () => {
  navigator.clipboard.writeText(textToCopy);
});
