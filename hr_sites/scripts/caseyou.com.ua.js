// source: https://caseyou.com.ua/
// extracted: 2026-05-07T21:19:53.510Z
// scripts: 1

// === script #1 (length=596) ===
(function() {
  var mainPageCheck = window.location.pathname == "/" ? true : false;

  if (mainPageCheck) {
    $(document).ready(function() {
      $("div.productsMenu-tabs-content").addClass("hide");
      $("div.productsMenu-submenu.__fluidGrid.__hasTabs.__pos_left").addClass(
        "openCustomMenu"
      );
    });
    $("div.productsMenu-tabs").mouseleave(function() {
      $("div.productsMenu-tabs-content").addClass("hide");
    });
    $("div.productsMenu-tabs").mouseenter(function() {
      $("div.productsMenu-tabs-content").removeClass("hide");
    });
  }
})();
