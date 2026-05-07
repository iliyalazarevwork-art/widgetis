// source: https://todlib2b.com.ua/
// extracted: 2026-05-07T21:19:47.561Z
// scripts: 1

// === script #1 (length=519) ===
const hideSidebarUrls = [
    "/spivpratsia/",
    "/umovy-spivpratsi/",
    "/ru/spivpratsia/",
    "/ru/umovy-spivpratsi/"
  ];

  if (hideSidebarUrls.includes(window.location.pathname)) {
    document.addEventListener("DOMContentLoaded", function () {
      const sideMenu = document.querySelector(".sideMenu");
      const layoutAside = document.querySelector(".layout-aside");
      if (sideMenu) sideMenu.style.display = "none";
      if (layoutAside) layoutAside.style.display = "none";
    });
  }
