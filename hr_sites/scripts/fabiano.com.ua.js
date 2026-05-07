// source: https://fabiano.com.ua/
// extracted: 2026-05-07T21:19:48.230Z
// scripts: 1

// === script #1 (length=3026) ===
const WORK_SCHEDULE = [
  { days: [1,2,3,4,5], intervals: [["09:00","18:00"]] }, // Пн-Пт
  { days: [6],         intervals: [["10:00","14:00"]] }  // Сб
];
const KYIV_TZ = "Europe/Kyiv";
const SLOT_ID = "keycrm-slot";
let widgetLoaded = false;
let offlineBtnMounted = false;
function parseHmToMinutes(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}
function getKyivNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KYIV_TZ,
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const hh = Number(map.hour);
  const mm = Number(map.minute);
  const isoDay = ({ Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 })[map.weekday];
  return { day: isoDay, minutes: hh * 60 + mm };
}
function isWorkingNow(schedule = WORK_SCHEDULE) {
  const now = getKyivNow();
  for (const rule of schedule) {
    if (!rule.days.includes(now.day)) continue;
    for (const [startHm, endHm] of rule.intervals) {
      const start = parseHmToMinutes(startHm);
      const end   = parseHmToMinutes(endHm);
      if (start < end) {
        if (now.minutes >= start && now.minutes < end) return true;
      } else {
        if (now.minutes >= start || now.minutes < end) return true;
      }
    }
  }
  return false;
}
const modal = document.getElementById("serviceModal");

function openModal() {
  modal.style.display = "flex";

  requestAnimationFrame(() => {
    modal.classList.add("active");
  });
}

function closeModal() {
  modal.classList.remove("active");

  setTimeout(() => {
    modal.style.display = "none";
  }, 250);
}
document.getElementById("closeModal").onclick = closeModal;
document.getElementById("serviceModal").onclick = e => {
  if (e.target.id === "serviceModal") closeModal();
};
function mountOfflineButton() {
  if (offlineBtnMounted) return;
  const slot = document.getElementById(SLOT_ID);
  const btn = document.createElement("div");
  btn.className = "keycrm-bubble2";
  btn.onclick = openModal;
  slot.appendChild(btn);
  offlineBtnMounted = true;
}
function unmountOfflineButton() {
  const btn = document.querySelector(".keycrm-bubble2");
  if (btn) btn.remove();
  offlineBtnMounted = false;
}
function loadKeyCrmWidget() {
  if (widgetLoaded) return;
  (function(w,d,t,u,c){
    var s=d.createElement(t),j=d.getElementsByTagName(t)[0];
    s.src=u; s.async=true; s.defer=true;
    s.onload=function(){
      if (w.KeyCRM) KeyCRM.render(c);
    };
    j.parentNode.insertBefore(s,j);
  })(window, document, "script",
     "https://chat.key.live/bundles/widget.min.js",
     {token:"b5da93f0-301f-4440-960b-2d8117b2b32b"}
  );
  widgetLoaded = true;
}
function updateUi() {
  if (isWorkingNow()) {
    unmountOfflineButton();
    loadKeyCrmWidget();
  } else {
    mountOfflineButton();
  }
}
updateUi();
setInterval(updateUi, 20000);
