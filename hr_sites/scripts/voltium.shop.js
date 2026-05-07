// source: https://voltium.shop/
// extracted: 2026-05-07T21:23:09.779Z
// scripts: 1

// === script #1 (length=3902) ===
(function() {
    const COOKIE_CONSENT_KEY = 'cookie_consent';
    const COOKIE_SETTINGS_KEY = 'cookie_settings';
    
    function getCookieSettings() {
        const saved = localStorage.getItem(COOKIE_SETTINGS_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { necessary: true, analytics: false, marketing: false };
            }
        }
        return { necessary: true, analytics: false, marketing: false };
    }
    
    function saveCookieSettings(settings) {
        localStorage.setItem(COOKIE_SETTINGS_KEY, JSON.stringify(settings));
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    }
    
    function hasConsent() {
        return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
    }
    
    function createCookiePanel() {
        if (hasConsent()) {
            return;
        }
        const panel = document.getElementById('cookies-panel');
        if (!panel) return;
        panel.style.display = 'block';
        
        const acceptBtn = panel.querySelector('.j-cookies-accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                const settings = { necessary: true, analytics: true, marketing: true };
                saveCookieSettings(settings);
                panel.style.display = 'none';
            });
        }
        
        const rejectBtn = panel.querySelector('.j-cookies-reject');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function() {
                const settings = { necessary: true, analytics: false, marketing: false };
                saveCookieSettings(settings);
                panel.style.display = 'none';
            });
        }
        
        const settingsBtn = panel.querySelector('.j-cookies-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                const modal = document.getElementById('cookie-settings-modal');
                if (modal) {
                    panel.style.display = 'none';
                    modal.style.display = 'flex';
                    const currentSettings = getCookieSettings();
                    document.getElementById('cookie-analytics').checked = currentSettings.analytics;
                    document.getElementById('cookie-marketing').checked = currentSettings.marketing;
                }
            });
        }
    }
    
    function initSettings() {
        const saveBtn = document.getElementById('cookie-save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                const settings = {
                    necessary: true,
                    analytics: document.getElementById('cookie-analytics').checked,
                    marketing: document.getElementById('cookie-marketing').checked
                };
                saveCookieSettings(settings);
                document.getElementById('cookie-settings-modal').style.display = 'none';
                document.getElementById('cookies-panel').style.display = 'none';
            });
        }
        
        const cancelBtn = document.getElementById('cookie-cancel-settings');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                document.getElementById('cookie-settings-modal').style.display = 'none';
                document.getElementById('cookies-panel').style.display = 'block';
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            createCookiePanel();
            initSettings();
        });
    } else {
        createCookiePanel();
        initSettings();
    }
})();
