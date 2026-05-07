// source: https://cyberdream.com.ua/
// extracted: 2026-05-07T21:19:01.982Z
// scripts: 2

// === script #1 (length=2314) ===
document.addEventListener('DOMContentLoaded', function () {
    // Function to check if the widget was shown today
    function hasWidgetBeenShownToday(widgetId) {
      const lastShown = localStorage.getItem(`claspoWidgetShown_${widgetId}`);
      if (!lastShown) return false;
      const lastShownDate = new Date(lastShown);
      const today = new Date();
      return lastShownDate.toDateString() === today.toDateString();
    }

    // Function to mark the widget as shown today
    function markWidgetAsShownToday(widgetId) {
      localStorage.setItem(`claspoWidgetShown_${widgetId}`, new Date().toISOString());
    }

    // Function to check if the widget was closed today
    function hasWidgetBeenClosedToday(widgetId) {
      const lastClosed = localStorage.getItem(`claspoWidgetClosed_${widgetId}`);
      if (!lastClosed) return false;
      const lastClosedDate = new Date(lastClosed);
      const today = new Date();
      return lastClosedDate.toDateString() === today.toDateString();
    }

    // Function to mark the widget as closed today
    function markWidgetAsClosedToday(widgetId) {
      localStorage.setItem(`claspoWidgetClosed_${widgetId}`, new Date().toISOString());
    }

    // Function to display the widget after a delay
    function displayWidgetWithDelay(widgetId, delay) {
      if (hasWidgetBeenShownToday(widgetId) || hasWidgetBeenClosedToday(widgetId)) {
        return; // Do not display if already shown or closed today
      }

      setTimeout(function() {
        claspo('showWidget', { formVariantId: widgetId });
        markWidgetAsShownToday(widgetId);
      }, delay);
    }

    // Widget f33354v33354
    const widgetId1 = 'f33354v33354';
    displayWidgetWithDelay(widgetId1, 4000); // 10 seconds delay

    claspo('onWidgetEvents', { formVariantId: widgetId1 }, function ({ type }) {
      if (type === 'WIDGET_CLOSED') {
        markWidgetAsClosedToday(widgetId1);
      }
    });

    // Widget f34107v34107
    const widgetId2 = 'f34107v34107';
    displayWidgetWithDelay(widgetId2, 2000); // 10 seconds delay

    claspo('onWidgetEvents', { formVariantId: widgetId2 }, function ({ type }) {
      if (type === 'WIDGET_CLOSED') {
        markWidgetAsClosedToday(widgetId2);
      }
    });
  });

// === script #2 (length=565) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://embed.helpcrunch.com/sdk.js';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)
