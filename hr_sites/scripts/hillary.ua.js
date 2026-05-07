// source: https://hillary.ua/
// extracted: 2026-05-07T21:18:49.639Z
// scripts: 8

// === script #1 (length=1344) ===
(function() {
  // Set a cookie
  function setCookie(name, value, expires, path, domain, secure) {
    const cookieValue = `$=${encodeURIComponent(value)}${expires ? `; expires=$` : ''}${path ? `; path=$` : ''}${domain ? `; domain=$` : ''}${secure ? `; secure` : ''}`;
    document.cookie = cookieValue;
  }

  // Get a cookie
  function getCookie(name) {
    const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  // Get a URL parameter
  function getUrlParam(param) {
    if (!param || !window.location.search) return null;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Process and store URL parameters in cookies
  function spisokParams(param) {
    const paramValue = getUrlParam(param);
    if (paramValue === null) return null;

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const expiryDate = date.toUTCString();
    setCookie(param, paramValue, expiryDate, "/");
    return getCookie(param);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const smartid = spisokParams('smartid');
    // Use `smartid` here or pass it to another function
  });
})();

// === script #2 (length=2588) ===
let on_event_start_order = false;
const form_input_event_handler = (e) => {
    if(on_event_start_order)
        return;
    const value = e.target.value
    on_event_start_order = true;
    try{ (function() {
        var prefix = "", hash = "eoN5UFh5Ecjqe6oldAMj", rtbhTags = [];
        rtbhTags.push("pr_"+hash+"_startorder");
        var key = "__rtbhouse.lid", lid = window.localStorage.getItem(key);
        if (!lid) {
            lid = ""; var pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 20; i++) lid += pool.charAt(Math.floor(Math.random() * pool.length));
            window.localStorage.setItem(key, lid);}
        rtbhTags.push("pr_"+hash+"_lid_" + lid);
        var ifr = document.createElement("iframe"),
            sr = encodeURIComponent(document.referrer ? document.referrer : ""),
            su = encodeURIComponent(document.location.href ? document.location.href : ""),
            ifrSrc = "https://"+prefix+"creativecdn.com/tags?type=iframe", tmstmp = encodeURIComponent("" + Date.now());
        for(var i=0; i<rtbhTags.length; i++) {ifrSrc += "&id=" + encodeURIComponent(rtbhTags[i]);}
        ifrSrc += "&su=" + su + "&sr=" + sr + "&ts=" + tmstmp;
        ifr.setAttribute("src", ifrSrc); ifr.setAttribute("width", "1");
        ifr.setAttribute("height", "1"); ifr.setAttribute("scrolling", "no");
        ifr.setAttribute("frameBorder", "0"); ifr.setAttribute("style", "display:none");
        ifr.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
            clearInterval(find_form_fields_timer_id)//todo test and uncomment
        if(document.body){document.body.appendChild(ifr);}
        else{window.addEventListener('DOMContentLoaded', function(){document.body.appendChild(ifr);});}
    })();} catch(e) {}
}
let find_form_fields_timer_id = () => {
    const form_new = document.querySelector('input[name*="Recipient[delivery_name]"]');//checkout-container
    const form_registered = document.querySelector('input[name*="user[email]"]');//checkout-login
    const form_fast = document.querySelector('input[name*="Quick[delivery_name]"]');//quick-container
    form_new ? form_new.oninput = (e) => {
        form_input_event_handler(e)
    } : undefined
    form_registered ? form_registered.oninput = (e) => {
        form_input_event_handler(e)
    } : undefined
    form_fast ? form_fast.oninput = (e) => {
        form_input_event_handler(e)
    } : undefined
}
document.addEventListener('DOMContentLoaded', find_form_fields_timer_id)

// === script #3 (length=12567) ===
const adpulse_repeatorder_init = () => {
    //блок конфігів
    let millisecond_to_show = 1;
    let hours_if_closed = 24;
    let date_now = new Date();
    let date_close_widget = new Date(date_now.getTime() + hours_if_closed * 60 * 60 * 1000)
    const widget_name = 'repeatorder';
    const adp_data_name = 'adp_' + widget_name + '_data';
    const adp_root_widget_id = 'adp_root_widget_' + widget_name;
    const adp_root_widget_id_classname = '.' + adp_root_widget_id;
    const promocode = `RZDT15`;
    let widget_lifetime = 15 * 60;
    //let widget_lifetime = 10;
    let adp_timer_interval;
    const app_url = 'https://core.hillary.ua';
    //блок конфігів вже все
    console.log('REPEATORDER INIT')
    const get_cookie = (name) => {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }
    const set_cookie = (name, value, options = {}) => {
        options = {
            path: '/',
            ...options
        };
        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }
        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
        for (let optionKey in options) {
            updatedCookie += "; " + optionKey;
            let optionValue = options[optionKey];
            if (optionValue !== true) {
                updatedCookie += "=" + optionValue;
            }
        }
        document.cookie = updatedCookie;
    }
    const set_local_storage = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    }
    const get_local_storage = (key) => {
        return JSON.parse(localStorage.getItem(key));
    }
    const add_link = (filename, rel = false, crossorigin = false) => {
        // create link element for preconnecting to Google Fonts static content server
        const link = document.createElement('link');
        link.href = filename;
        if (crossorigin)
            link.setAttribute('crossorigin', '');
        document.head.appendChild(link);
    }
    const add_css = (filename) => {
        let head = document.head;
        let link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = filename;
        head.appendChild(link);
    }
    const load_resource = () => {
        add_css(app_url + '/adpulse/' + widget_name + '/adpulse.css');
        add_css('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');
    }
    const get_page_type = () => {
        let version = '';
        let link = document.querySelector('.footer__link');
        if (link) {
            let href = link.getAttribute('href');
            const regex = /v=(mobile|pc)/;
            const matches = href.match(regex);
            if (matches && matches[1]) {
                version = matches[1];
            }
            if (version === 'mobile')
                version = 'pc';
            else
                version = 'mobile';
        } else {
            version = 'mobile';
        }
        console.log('site version', version);
        return version;
    }
    load_resource();
    const generate_unique_username = () => {
        let username = ''
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 16; i++)
            username += possible.charAt(Math.floor(Math.random() * possible.length));
        return username;
    }
    const save_unique_username = () => {
        let adp_data = get_local_storage(adp_data_name);
        if (!adp_data) {
            const username_id = generate_unique_username();
            adp_data = {
                init_time: new Date().getTime(),
                username_id: username_id,
            }
            set_local_storage(adp_data_name, adp_data)
            set_cookie('adp_username_id', username_id);
        } else {
            //adp_data.init_time = new Date().getTime();
            adp_data.username_id = adp_data.username_id ? adp_data.username_id : generate_unique_username();
            set_local_storage(adp_data_name, adp_data);
            if(!get_cookie('adp_username_id')){
                set_cookie('adp_username_id', adp_data.username_id);
            }
        }
    }
    const register_widget_container = () => {
        const adp_root_widget = document.createElement("div");
        adp_root_widget.classList.add(adp_root_widget_id);
        adp_root_widget.classList.add("adp_widget_element_hide");
        if (get_page_type() === 'mobile') {
            adp_root_widget.classList.add("adp_widget_mobile");
        }
        const adp_close_btn = document.createElement('button')
        adp_close_btn.classList.add('adp_close-btn')
        adp_close_btn.innerHTML = '&times;'
        adp_close_btn.addEventListener('click', () => {
            close_widget()
        })
        const row0 = document.createElement("div");
        row0.classList.add("adp_row");
        row0.insertAdjacentHTML("beforeend", "Дякуємо! Ваше замовлення уже збирається!")

        const adp_timer = document.createElement("span");
        adp_timer.classList.add("adp_timer");
        adp_timer.textContent = "00:00";
        const adp_promocode_value = document.createElement("span");
        adp_promocode_value.classList.add("adp_promocode_value");
        adp_promocode_value.textContent = promocode;

        const row1 = document.createElement("div");
        row1.classList.add("adp_row");
        const adp_promocode_percent = document.createElement("b");
        adp_promocode_percent.classList.add("adp_promocode_percent");
        adp_promocode_percent.textContent = "15%";
        row1.insertAdjacentHTML("beforeend", "Зробіть наступне замовлення протягом ")
        row1.appendChild(adp_timer)
        row1.insertAdjacentHTML('beforeend', " та отримайте на нього -")
        row1.appendChild(adp_promocode_percent)
        row1.insertAdjacentHTML('beforeend'," <b>ЗНИЖКИ</b> з промокодом ")
        row1.appendChild(adp_promocode_value)

        const row2 = document.createElement("div");
        row2.classList.add("adp_row");



        row2.insertAdjacentHTML("beforeend", "<b class='adp_subtext'>* діє лише за умови підтвердження попереднього замовлення</b>")
        //row2.appendChild(adp_promocode_value);
        //row2.appendChild(document.createTextNode(" діє ще "));
        //row2.appendChild(adp_timer);

        adp_root_widget.appendChild(adp_close_btn)
        adp_root_widget.appendChild(row0);
        adp_root_widget.appendChild(row1);
        adp_root_widget.appendChild(row2);
        document.head.insertAdjacentHTML("beforeend", "<style>.adp_widget_element_hide{display:none;}</style>");
        document.body.prepend(adp_root_widget);
    }

    const show_widget = () => {
        let animation_list = [
            'animate__bounceIn',
            'animate__bounceInLeft',
        ]
        save_unique_username();
        const adp_root_widget = document.querySelector(adp_root_widget_id_classname);
        adp_root_widget.classList.remove('adp_widget_element_hide')
        let random_animation = animation_list[Math.floor(Math.random() * animation_list.length)]
        adp_root_widget.classList.add('animate__animated', random_animation)
        adp_root_widget.addEventListener('animationend', () => {
            adp_root_widget.classList.remove('adp_widget_element_hide')
            adp_root_widget.classList.remove('animate__animated', random_animation)
            adp_root_widget.classList.forEach((classname) => {
                if (classname.indexOf('animate__') === 0) {
                    adp_root_widget.classList.remove(classname)
                }
            })
        })
        send_widget_event('show', get_local_storage(adp_data_name))
    }
    const close_widget = () => {
        /*        const adp_widget_root = document.querySelector(adp_root_widget_id_classname);
                adp_widget_root.classList.add("adp_widget_element_hide");*/
        const animation = [
            'animate__bounceOutRight',
            'animate__bounceOutDown',
            'animate__fadeOutUp',
            'animate__fadeOutDown',
        ];
        let adp_root_widget = document.querySelector(adp_root_widget_id_classname);
        adp_root_widget.classList.forEach((classname) => {
            if (classname.indexOf('animate__') === 0) {
                adp_root_widget.classList.remove(classname)
            }
        })
        adp_root_widget.classList.add('animate__animated');
        adp_root_widget.classList.add(animation[Math.floor(Math.random() * animation.length)]);
        adp_root_widget.addEventListener('animationend', () => {
            adp_root_widget.classList.remove('animate__animated');
            adp_root_widget.classList.forEach((classname) => {
                if (classname.indexOf('animate__') === 0) {
                    adp_root_widget.classList.remove(classname)
                }
            })
            adp_root_widget.classList.add('adp_widget_element_hide')
        })
        send_widget_event('close')
    }

    const send_widget_event = (event, data = {}) => {
        data = {
            event: event,
            widget: widget_name,
            data: data
        }
        return fetch(app_url + '/api/adpulse/widget/event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }

    setTimeout(() => {
        register_widget_container()
        let adp_widget_root = document.querySelector(adp_root_widget_id_classname);
        let adp_timer_root = adp_widget_root.querySelector('.adp_timer');

        const update_timer_block = (time_left) => {
            const minutes = Math.floor(time_left / 60);
            const seconds = time_left % 60;
            adp_timer_root.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        const start_timer = (startTime) => {
            //set_local_storage('adp_repeatorder_timerstart', startTime);
            if (adp_timer_interval) clearInterval(adp_timer_interval);

            adp_timer_interval = setInterval(() => {
                const currentTime = new Date().getTime();
                const elapsedTime = Math.floor((currentTime - startTime) / 1000);
                const timeLeft = widget_lifetime - elapsedTime;

                if (timeLeft <= 0) {
                    clearInterval(adp_timer_interval);
                    update_timer_block(0);
                    close_widget();
                } else {
                    update_timer_block(timeLeft);
                }
            }, 1000);
        }

        const show_widget_test = document.querySelector('.tester_'+widget_name+'_show');
        const close_widget_test = document.querySelector('.tester_'+widget_name+'_close');
        if (show_widget_test) {
            show_widget_test.addEventListener('click', () => {
                const startTime = new Date().getTime();
                set_local_storage(adp_data_name, {init_time: startTime});
                start_timer(startTime);
                show_widget();
            });
        }
        if (close_widget_test) {
            close_widget_test.addEventListener('click', () => {
                close_widget();
            });
        }

        const adp_data = get_local_storage(adp_data_name);
        const timer_start = adp_data ? adp_data.init_time : null;
        console.log('REPEATORDER')
        console.log('adp_repeatorder_data', adp_data)
        console.log('timer_start', timer_start)
        if (timer_start) {
            const timeLeft = widget_lifetime - Math.floor((new Date().getTime() - timer_start) / 1000);
            if (timeLeft > 0) {
                show_widget()
                update_timer_block(timeLeft);
                start_timer(timer_start);
            } else {
                update_timer_block(0);
            }
        }
    }, 1000);
}
document.addEventListener("DOMContentLoaded", adpulse_repeatorder_init)

// === script #4 (length=13213) ===
class Utils {
    static enableLogs = true;
    static queryParams = new URLSearchParams(window.location.search);
    static url = window.location.href;
    static logTypes = {
        LOG: 'log',
        WARNING: 'warning',
        ERROR: 'error',
        SUCCESS: 'success',
        SYSTEM: 'system',
        EVENT: 'event',
        WIN: 'win',
    };
    static currency = {
        zl: 'zł',
        uah: '₴',
    };
    static logIcons = {
        [Utils.logTypes.LOG]: '🔹',
        [Utils.logTypes.WARNING]: '🔸',
        [Utils.logTypes.ERROR]: '🔻',
        [Utils.logTypes.SUCCESS]: '✅',
        [Utils.logTypes.SYSTEM]: '👾',
        [Utils.logTypes.EVENT]: '🏄🏻‍♂️',
        [Utils.logTypes.WIN]: '👑',
    };

    static log({
                   message = '',
                   data = undefined,
                   type = Utils.logTypes.LOG,
                   icon = Utils.logIcons[type],
                   appname = this.constructor.name,
                   tgLogEnabled = false,
                   tgLogTags = [],
               }) {
        if (Utils.enableLogs) {
            let message_view = icon + ' ' + appname + ' ' + message
            if (data !== undefined)
                console.log(message_view, data);
            else
                console.log(message_view);
        }
        if (tgLogEnabled) {
            let message_view = icon + ' ' + appname + ' ' + message
            TelegramBot.sendLog({
                message: message_view,
                data: data,
                tags: tgLogTags,
            }).then(r => {
                console.log(r);
            });
        }
    }

    static tgLog({
                     message = '',
                     data = undefined,
                     type = Utils.logTypes.LOG,
                     icon = Utils.logIcons[type],
                     appname = this.constructor.name,
                     tgLogEnabled = false,
                 }) {
        if (tgLogEnabled) {
            let message_view = icon + ' ' + appname + ' ' + message
            TelegramBot.sendLog({
                message: message_view,
                data: data,
            })
        }
    }
}

class Marsy {
    static version = '1.4.1';
    static intervals = {}
    static enableErrors = true;
    static config = {
        enabled: true,
        logEnabled: true,
        appname: 'Marsy'
    }

    static log(params) {
        Utils.log({
            ...params,
            ...this.config
        });
    }

    constructor() {
        Marsy.installSystemsOnDOMContentLoaded();
    }


    static get marketing_systems() {
        return {
            api_url: 'https://core.hillary.ua/api',
            systems: [
                {
                    name: 'cookieutils',
                    src: 'https://external.hillary.ua/hillary.ua/cookieutils.js',
                    enabled: true,
                },
                {
                    name: 'telegrambot',
                    src: 'https://external.hillary.ua/hillary.ua/telegrambot.js',
                    enabled: true,
                },
                {
                    name: 'sitedebug.css',
                    src: 'https://external.hillary.ua/hillary.ua/sitedebug.css',
                    enabled: false,
                },
                {
                    name: 'style.css',
                    src: 'https://external.hillary.ua/hillary.ua/style.css',
                    enabled: false,
                },
                {
                    name: 'sitedebug',
                    src: 'https://external.hillary.ua/hillary.ua/sitedebug.js',
                    enabled: false,
                },
                {
                    name: 'lcw',
                    src: 'https://external.hillary.ua/hillary.ua/hyperlcw.js',
                    enabled: false,
                },
                {
                    name: 'esputnik',
                    src: 'https://external.hillary.ua/hillary.ua/esputnik.js',
                    enabled: false,
                },
                {
                    name: 'tiktok',
                    src: 'https://external.hillary.ua/hillary.ua/tiktok.js',
                    enabled: false,
                },
                {
                    name: 'esputnikEvents',
                    src: 'https://external.hillary.ua/hillary.ua/esputnikevents.js',
                    enabled: false,
                },
                {
                    name: 'tiktokEvents',
                    src: 'https://external.hillary.ua/hillary.ua/tiktokevents.js',
                    enabled: false,
                },
                {
                    name: 'marsyevent',
                    src: 'https://external.hillary.ua/hillary.ua/marsyevent.js',
                    enabled: false,
                },
                {
                    name: 'fontawesome',
                    src: 'https://kit.fontawesome.com/036ee37e2d.js',
                    enabled: false,
                },
                {
                    name: 'helpcrunch',
                    src: 'https://external.hillary.ua/hillary.ua/helpcrunch.js',
                    enabled: true,
                    before: () => {
                        window.helpcrunchSettings = {
                            organization: 'hillary',
                            appId: '4f34957d-b586-41ae-b3a8-c3509df4d55f',
                        };
                    },
                    after: () => {
                        console.log('helpcrunchSettings', window.helpcrunchSettings);
                    },
                }
            ]
        };
    }

    static installSystemsOnDOMContentLoaded() {
        document.addEventListener('DOMContentLoaded', async () => {
            const startTime = performance.now();
            if (Marsy.enableErrors) {
                await Marsy.install_systems();
                const endTime = performance.now();
                const totalTime = endTime - startTime;
                Marsy.init()
                Marsy.log({
                    message: 'Systems installed in ' + totalTime + ' ms',
                    type: Utils.logTypes.SYSTEM,
                });
            } else {
                try {
                    await Marsy.install_systems();
                    const endTime = performance.now();
                    const totalTime = endTime - startTime;
                    Marsy.init()
                    Marsy.log({
                        message: 'Systems installed in '+totalTime+' ms',
                        type: Utils.logTypes.SYSTEM,
                    });
                } catch (error) {
                    Marsy.log({
                        message: 'Failed to load some systems: '+error,
                        type: Utils.logTypes.ERROR,
                    });
                }
            }
        });
    }

    static init() {
        if (typeof MarsyEvent === 'function') {
            try {
                const marsyEvent = new MarsyEvent();
            } catch (e) {
                Marsy.log({
                    message: 'Failed to create an instance of MarsyEvent: '+e,
                    type: Utils.logTypes.ERROR,
                });
            }
        } else {
            Marsy.log({
                message: "MarsyEvent class does not exist",
                type: Utils.logTypes.ERROR,
            });
        }
        /*Marsy.intervals.marsyEvent = setInterval(() => {
            //const marsyEvent = new MarsyEvent();
        }, 1000);*/
    }

    static clearInterval(name) {
        clearInterval(Marsy.intervals[name]);
        Marsy.intervals[name] = undefined;
    }

    static clearIntervals() {
        for (let interval in Marsy.intervals) {
            clearInterval(Marsy.intervals[interval]);
        }
    }

    static async install_systems() {
        const marketing_systems = Marsy.marketing_systems;
        if (marketing_systems && marketing_systems.systems) {
            for (let system of marketing_systems.systems) {
                const isEnabled = system.enabled !== undefined ? system.enabled : true;
                if (isEnabled) {
                    if (system.src.endsWith('.js')) {
                        system.before && system.before();
                        await Marsy.add_script(system); // Додаємо defer
                        system.after && system.after();
                    } else if (system.src.endsWith('.css')) {
                        await Marsy.add_css(system);
                    } else if (system.src.endsWith('.ico') || system.src.endsWith('.png')) {
                        await Marsy.add_link(system);
                    } else {
                        await Marsy.add_link(system);
                    }
                } else {
                    Marsy.log({
                        message: 'System '+system.name+' is disabled',
                        type: Utils.logTypes.SYSTEM,
                    });
                }
            }
        }
    }

    static async add_link({src, rel = false, crossorigin = false}) {
        const link = document.createElement('link');
        link.href = src;
        if (crossorigin) link.setAttribute('crossorigin', '');
        document.head.appendChild(link);

        return new Promise((resolve, reject) => {
            link.onload = () => {
                Marsy.log({
                    message: 'Added link: '+src,
                    type: Utils.logTypes.SYSTEM,
                });
                resolve();
            };
            link.onerror = () => {
                Marsy.log({
                    message: 'Failed to load link: '+src,
                    type: Utils.logTypes.ERROR,
                });
                resolve(); // Continue even if there's an error
            };
        });
    }

    static async add_css() {
        return new Promise((resolve, reject) => {
            const head = document.head;
            const link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = src;
            head.appendChild(link);

            link.onload = () => {
                Marsy.log({
                    message: 'Added CSS: '+src,
                    type: Utils.logTypes.SYSTEM,
                });
                resolve();
            };
            link.onerror = () => {
                Marsy.log({
                    message: 'Failed to load CSS: '+src,
                    type: Utils.logTypes.ERROR,
                });
                resolve(); // Continue even if there's an error
            };
        });
    }

    static async add_script({src, async = false, defer = true, crossorigin = false, attr = {}}) {
        return new Promise((resolve, reject) => {
            const head = document.head;
            const script = document.createElement('script');
            script.src = src;
            if (async) script.setAttribute('async', '');
            if (defer) script.setAttribute('defer', '');
            if (crossorigin) script.setAttribute('crossorigin', '');
            if (attr) {
                for (let key in attr) {
                    script.setAttribute(key, attr[key]);
                }
            }
            head.appendChild(script);

            script.onload = () => {
                Marsy.log({
                    message: 'Added script: '+src,
                    type: Utils.logTypes.SYSTEM,
                });
                resolve();
            };
            script.onerror = () => {
                Marsy.log({
                    message: 'Failed to load script: '+src,
                    type: Utils.logTypes.ERROR,
                });
                resolve(); // Continue even if there's an error
            };
        });
    }

    static async add_meta({name, content}) {
        return new Promise((resolve, reject) => {
            const head = document.head;
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            head.appendChild(meta);
            Marsy.log({
                message: 'Added meta tag: '+name,
                type: Utils.logTypes.SYSTEM,
            });
            resolve();
        });
    }

    static async add_meta_property(property, content) {
        return new Promise((resolve, reject) => {
            const head = document.head;
            const meta = document.createElement('meta');
            meta.property = property;
            meta.content = content;
            head.appendChild(meta);
            Marsy.log({
                message: 'Added meta tag property: '+property,
                type: Utils.logTypes.SYSTEM,
            });
            resolve();
        });
    }
}

const marsy = new Marsy();

// === script #5 (length=3359) ===
function setupDeliveryClickHandler() {
    let findElement = (selector) => {
        return new Promise((resolve, reject) => {
            let element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }
            let tries = 3;
            let interval = setInterval(() => {
                element = document.querySelector(selector);
                console.log('Element:', element);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                } else if (--tries === 0) {
                    clearInterval(interval);
                    reject('Елемент не знайдено');
                }
            }, 1000);
        });
    }
    let needleRoute = [
        '/checkout/',
        '/en/checkout/',
        '/ru/checkout/',
    ];
    let currentUrl = window.location.pathname;
    let isCheckoutPage = needleRoute.some((route) => {
        return currentUrl.includes(route);
    }, currentUrl);
    if (!isCheckoutPage) {
        console.log('Not a checkout page');
        return;
    }
    let message_template = (message) => {
        let div = document.createElement('div');
        div.classList.add('form-item-txt');
        div.classList.add('uid-message');
        div.innerText = message;
        return div;
    }
    let addFormItemText = (component) => {
        let deliveryComponent = document.querySelector('[data-component="Delivery"]');
        if (deliveryComponent) {
            let deliveryContainer = deliveryComponent.querySelector('.j-delivery-main-container');
            let formItemText = deliveryContainer.querySelector('.form-item-txt.uid-message');
            if (formItemText) {
                formItemText.innerText = component.innerText;
            } else {
                deliveryContainer.appendChild(component);
            }
        } else {
            console.log('Компонент доставки не знайдено');
        }
    }
    let displayFormNotification = (message) => {
        switch (message) {
            case 'PostexService (Міжнародна доставка)':
                addFormItemText(message_template('Передоплата за доставку обов\'язкова. Вартість доставки залежить від країни призначення. Остаточну суму менеджер повідомить додатково.'));
                break;
            case 'PostexService (Международная доставка)':
                addFormItemText(message_template('Предоплата за доставку обязательна. Стоимость доставки зависит от страны назначения. Окончательную сумму менеджер сообщит дополнительно.'));
                break;
            case 'PostexService (International delivery)':
                addFormItemText(message_template('Prepayment for delivery is required. The delivery cost depends on the destination country. The manager will inform you of the final amount.'));
                break;
        }
    }
    setInterval(() => {
        findElement('span[name="Delivery[delivery_type]"]').then((element) => {
            let deliveryTypeElement = element.querySelector('.selectboxit-text');
            displayFormNotification(deliveryTypeElement.innerText);
        }).catch((error) => {
            console.log(error);
        });
    }, 1000);

}

setupDeliveryClickHandler();

// === script #6 (length=1365) ===
try{ (function() {
var prefix = "", hash = "eoN5UFh5Ecjqe6oldAMj", rtbhTags = [];
rtbhTags.push("pr_"+hash+"");
var key = "__rtbhouse.lid", lid = window.localStorage.getItem(key);
if (!lid) {
lid = ""; var pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
for (var i = 0; i < 20; i++) lid += pool.charAt(Math.floor(Math.random() * pool.length));
window.localStorage.setItem(key, lid);}
rtbhTags.push("pr_"+hash+"_lid_" + lid);
var ifr = document.createElement("iframe"),
sr = encodeURIComponent(document.referrer ? document.referrer : ""),
su = encodeURIComponent(document.location.href ? document.location.href : ""),
ifrSrc = "https://"+prefix+"creativecdn.com/tags?type=iframe", tmstmp = encodeURIComponent("" + Date.now());
for(var i=0; i<rtbhTags.length; i++) {ifrSrc += "&id=" + encodeURIComponent(rtbhTags[i]);}
ifrSrc += "&su=" + su + "&sr=" + sr + "&ts=" + tmstmp;
ifr.setAttribute("src", ifrSrc); ifr.setAttribute("width", "1");
ifr.setAttribute("height", "1"); ifr.setAttribute("scrolling", "no");
ifr.setAttribute("frameBorder", "0"); ifr.setAttribute("style", "display:none");
ifr.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
if(document.body){document.body.appendChild(ifr);}
else{window.addEventListener('DOMContentLoaded', function(){document.body.appendChild(ifr);});}
})();} catch(e) {}

// === script #7 (length=16525) ===
const lcw_module_init = () => {
    let lcw_site_url_obj = new URL(window.location.href)
    let lcw_date = new Date()
    lcw_date.setDate(new Date().getDate() + 30);
    let cookie_params = {expires: lcw_date.toUTCString(), path: '/', secure: true}
    let dynamic_field_value = 'dynamic_field_value'

    let lcw = null
    window.metrics = {}
    window.user_info = {}

    const get_cookie = (name) => {
        let matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }
    const get_cookies = () => {
        let pairs = document.cookie.split(";");
        let cookies = {};
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i].split("=");
            cookies[(pair[0] + '').trim()] = unescape(pair.slice(1).join('='));
        }
        return cookies;
    }
    const set_cookie = (name, value, options = {}) => {
        options = {path: '/', ...options, SameSite: 'None', Secure: true}
        if (options.expires instanceof Date)
            options.expires = options.expires.toUTCString();
        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
        for (let optionKey in options) {
            updatedCookie += "; " + optionKey;
            let optionValue = options[optionKey];
            if (optionValue !== true)
                updatedCookie += "=" + optionValue;
        }
        document.cookie = updatedCookie;
    }
    const get_client_info = () => {
        let user_info = {},
            _empty = 'null',
            screen = window.screen,
            navigator = window.navigator,
            document = window.document,
            ua = navigator.userAgent.toLowerCase()
        const _contains = (str, sub) => {
            return (str.indexOf(sub) > -1)
        }
        const get_client_ip = async () => {
            await fetch("https://api.ipify.org/?format=json", {method: 'GET', redirect: 'follow'})
                .then(response => response.text())
                .then(result => {
                    console.log(result)
                    return result
                })
                .catch(error => console.log('error', error));
        }
        const _getBrowser = () => {
            let match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
            return {
                browser: match[1] || "",
                version: match[2] || "0"
            }
        }
        const _getOS = () => {
            let up = navigator.platform,
                isWin = (up === 'Win32') || (up === 'Windows'),
                isMac = (up === 'Mac68K') || (up === 'MacPPC') || (up === 'Macintosh') || (up === 'MacIntel'),
                isUnix = (up === 'X11') && !isWin && !isMac,
                isLinux = _contains(up, 'Linux') && _contains(ua, 'linux'),
                os = '';
            if (isLinux) {
                os = _contains(ua, 'android') ? 'android' : 'linux'
            } else if (isMac) {
                os = _contains(ua, 'iphone') ? 'iphone' : _contains(ua, 'ipad') ? 'ipad' : 'mac'
            } else if (isUnix) {
                os = 'unix'
            } else if (isWin) {
                let winkey = {
                    'win2000': 'windows nt 5.0',
                    'winXP': 'windows nt 5.1',
                    'win2003': 'windows nt 5.2',
                    'winVista': 'window nt 6.0',
                    'win7': 'windows nt 6.1',
                    'win8': 'windows nt 6.2',
                    'win8.1': 'windows nt 6.3',
                    'win10': 'windows nt 10.0'
                };
                for (let key in winkey) {
                    if (_contains(ua, winkey[key])) {
                        os = key;
                        break
                    }
                }
            }
            return os
        };
        user_info.os = _getOS()
        user_info.screen = screen ? screen.width + 'x' + screen.height : _empty
        user_info.locale = navigator && navigator.language ? navigator.language : navigator && navigator.browserLanguage ? navigator.browserLanguage : _empty
        user_info.browser = _getBrowser().browser + ' ' + _getBrowser().version
        user_info.charset = document.characterSet ? document.characterSet : document.charset ? document.charset : _empty
        user_info.host = encodeURIComponent(window.location.host)
        set_cookie('user_info', JSON.stringify(user_info), cookie_params)
        localStorage.setItem('user_info', JSON.stringify(user_info))
        return user_info
    }
    const handler_metrics_from_get_request = () => {
        console.log('LCW: location.search',window.location.search)
        if (window.location.search)
            try {
                const searchParams = new URLSearchParams(window.location.search.substring(1));
                let params = {};
                for (const [key, value] of searchParams.entries()) {
                    params[key] = value;
                }
                window.metrics = params;
                for (let metric_key in window.metrics) {
                    set_cookie(metric_key, window.metrics[metric_key], cookie_params);
                }
                console.log('LCW: Metrics from GET Init',window.metrics)

            } catch (e) {
                console.log('LocationSearchJson Error', e);
            }
    }
    const load_metrics_from_cookie = () => {
        window.metrics = get_cookie('metrics') ? JSON.parse(get_cookie('metrics')) : window.metrics
        //console.log('load_metrics_from_cookie')
        //console.log('window.metrics')
        //console.log(metrics)
        const fb_cookie_params = [
            'client_ip_address',
            'client_user_agent',
            'fbc',
            '_fbc',
            'fbp',
            '_fbp',
            'subscription_id',
            'lead_id',
            'fb_login_id'
        ].map(params => {
            get_cookie(params) ? window.metrics[params] = get_cookie(params) : null
        })
        const google_cookie_params = [
            'gclid',
            '_ga'
        ].map(params => {
            get_cookie(params) ? window.metrics[params] = get_cookie(params) : null
        })
        const bobmv_cookie_params = [
            'apn_id',//айди партнера
            'apn_action',//тип действия установлено чи удалено
            'bid',//айди баннера
        ].map(params => {
            get_cookie(params) ? window.metrics[params] = get_cookie(params) : null
        })
        const utm_metrics_params = [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
        ].map(params => {
            get_cookie(params) ? window.metrics[params] = get_cookie(params) : null
        })
        console.log('LCW: Metrics From Cookie Init',window.metrics)

    }
    const save_traffic_object = (traffic, traffic_title) => {
        //alert('traffic_title:'+traffic_title)
        window.lcw_traffic = traffic_title
        set_cookie('lcw_traffic', traffic_title, cookie_params)
        window.metrics.lcw_traffic = traffic_title
        if (traffic.hasOwnProperty('cpa_uid_field_name')) {
            window.lcw_uid = window.metrics[traffic.cpa_uid_field_name]//записываем в window уникальный ключ траффика
            set_cookie('lcw_uid', window.lcw_uid, cookie_params)
            window.metrics.lcw_uid = window.lcw_uid
        }
        for (let traffic_field in traffic) {
            if (traffic[traffic_field] === dynamic_field_value) {
                set_cookie(traffic_title + '_' + traffic_field, window.metrics[traffic_field], cookie_params)
                window.metrics[traffic_title + '_' + traffic_field] = window.metrics[traffic_field]
            }
        }
        set_cookie('metrics', JSON.stringify(window.metrics), cookie_params)
        localStorage.setItem('metrics', JSON.stringify(window.metrics))
    }
    const save_metrics_to_cookie = () => {
        const traffics = {
            admitad: {
                cpa_uid_field_name: 'admitad_uid',
                admitad_uid: dynamic_field_value,//c4aba12284f4a7ed346d39f70de15604
                target: dynamic_field_value,//'admitad'
                utm_campaign: dynamic_field_value,//'hillary_ua_main'
                rules: [
                    {utm_source: 'admitad', utm_medium: 'cpa'},
                ],
            },
            actionpay: {
                cpa_uid_field_name: 'actionpay',
                actionpay: dynamic_field_value,//517ec9df-afc9-502f-caed-0183ee13937e.223997
                utm_campaign: dynamic_field_value,//'hillary_ua_main_actionpay'
                rules: [
                    {utm_source: 'actionpay', utm_medium: 'cpa'}
                ],
            },
            kim: {
                cpa_uid_field_name: 'utm_content',
                kim_clickid: dynamic_field_value,//649bfa7e14a17e000104a34c
                utm_content: dynamic_field_value,//649bfa7e14a17e000104a34c
                rules: [
                    {utm_source: 'kim_aff', utm_medium: 'cpa'}
                ],
            },
            sellaction: {
                cpa_uid_field_name: 'SAuid',
                utm_source: dynamic_field_value,//'sellaction.net'
                SAuid: dynamic_field_value,//c4aba12284f4a7ed346d39f70de15604
                utm_campaign: dynamic_field_value,//'hillary_ua_main'
                rules: [
                    {utm_source: 'sellaction.net', utm_medium: 'cpa'},
                    {utm_source: 'sellaction.net', utm_medium: null},
                ],
            },
            affise: {
                cpa_uid_field_name: 'clickid',
                utm_campaign: dynamic_field_value,//3
                clickid: dynamic_field_value,//634f6446b75fb2000124b32e
                offer_id: dynamic_field_value,//2
                geo: dynamic_field_value,//UA
                rules: [
                    {utm_source: 'cpa_affise', utm_medium: 'cpa'}
                ],
            },
            salesdoubler: {
                utm_campaign: dynamic_field_value,//hillary_ua_main_sd
                cpa_uid_field_name: 'aff_sub',
                aff_sub: dynamic_field_value,//586199192
                aff_id: dynamic_field_value,//082289
                rules: [
                    {utm_source: 'salesdoubler', utm_medium: 'cpa'}
                ],
            },
            esputnik: {
                winner: /esputnik/i.test(window.metrics.utm_source),//true|false
                utm_source: dynamic_field_value,//eSputnik-trigger
                utm_medium: dynamic_field_value,//$email
                utm_campaign: dynamic_field_value,//Promokod_za_pіdpisku
                utm_content: dynamic_field_value,//$After_email
                utm_term: dynamic_field_value,//$60622
            },
            cpa_engine: {
                rules: [
                    {utm_source: 'cpa_engine', utm_medium: 'cpa'}
                ],
            },
            facebook: {
                cpa_uid_field_name: 'fbclid',
                rules: [
                    {utm_source: 'facebook', utm_medium: 'cpc'},
                    {utm_source: 'facebook_ads', utm_medium: 'cpc'},
                    {utm_source: 'facebook', utm_medium: 'messenger'},
                    {utm_source: 'facebook', utm_medium: 'referral'},
                    {utm_source: 'facebook', utm_medium: 'account'},
                    {utm_source: 'ftest', utm_medium: 'ftest'},
                    // {fbclid: window.metrics.fbclid},
                ],
            },
            instagram: {
                rules: [
                    {utm_source: 'inst_hillary_beauty_gadget', utm_medium: 'account'},
                    {utm_source: 'inst_organic', utm_medium: 'account'},
                    {utm_source: 'inst_hillary_cosmetics', utm_medium: 'account'},
                    {utm_source: 'instagram', utm_medium: 'account'},
                    {utm_source: 'inst_hillary_cosmetics', utm_medium: 'cpa'},
                    {utm_source: 'inst_stories', utm_medium: 'cpc'},
                    {utm_source: 'instagram', utm_medium: 'referral'},
                    {utm_source: 'instagram', utm_medium: 'robot'},
                ]
            },
            google: {
                rules: [
                    {utm_source: 'google', utm_medium: 'cpc'}
                ]
            },
            convead: {
                rules: [
                    {utm_source: 'convead', utm_medium: 'email'}
                ],
            },
            vseceni: {
                rules: [
                    {utm_source: 'vseceni', utm_medium: 'cpc'}
                ],
            },
            mgid: {
                rules: [
                    {utm_source: 'mgid.com', utm_medium: 'cpc'}
                ],
            },
            gms: {
                rules: [
                    {utm_source: 'gms', utm_medium: 'cpa'},
                    {utm_source: 'gms', utm_medium: 'viber'},
                    {utm_source: 'gms', utm_medium: 'sms'},
                ],
            },
            gravitec: {
                rules: [
                    {utm_source: 'gravitec', utm_medium: 'push'}
                ],
            },
            evacalls: {
                rules: [
                    {utm_source: 'evacalls', utm_medium: 'sms'}
                ],
            },
            pushworld: {
                rules: [
                    {utm_source: 'pushworld', utm_medium: 'push'}
                ],
            },
            youtube: {
                rules: [
                    {utm_source: 'youtube.com', utm_medium: 'referral'}
                ],
            },
            criteo: {
                rules: [
                    {utm_source: 'criteo', utm_medium: 'retargeting'}
                ],
            },
            IGShopping: {
                rules: [
                    {utm_source: 'IGShopping', utm_medium: 'Social'}
                ],
            },
            clickfrog_mgid: {
                rules: [
                    {utm_source: 'clickfrog_mgid', utm_medium: 'teaser'}
                ],
            },
            postaffiliate: {
                visitorId: dynamic_field_value,
                a_aid: dynamic_field_value,
                rules: [
                    {utm_source: 'cpa_postaffiliate', utm_medium: 'cpa'}
                ],
            },
        }
        for (let traffic_title in traffics) {
            let traffic = traffics[traffic_title]
            //console.log(traffic_title)
            if (traffic.hasOwnProperty('rules')) {
                traffic.rules.map((rule, rule_index, traffic_arr) => {
                    let subrules = []
                    for (let rule_metric in rule) {
                        subrules.push(window.metrics.hasOwnProperty(rule_metric) && window.metrics[rule_metric] === traffic_arr[rule_index][rule_metric])
                    }
                    if (subrules.every((subrule) => subrule === true))
                    {
                        console.log('LCW: Traffic Winner by Rules: ', traffic_title)
                        save_traffic_object(traffic, traffic_title)
                    }
                })
            } else if (traffic.hasOwnProperty('winner') && traffic.winner === true) {//если сразу победун
                //console.log('traffic.hasOwnProperty(winner)')
                //console.log(traffic.winner)
                save_traffic_object(traffic, traffic_title)
                console.log('LCW: Traffic Winner by RegExp: ',traffic_title)
            }
        }
    }

    window.user_info = get_client_info()
    load_metrics_from_cookie()
    handler_metrics_from_get_request()
    save_metrics_to_cookie()
}
lcw_module_init()
//document.addEventListener("DOMContentLoaded", lcw_module_init)

// === script #8 (length=540) ===
let input_counter_data_max_interval = setInterval(() => {
    const counter_input = document.querySelectorAll('.counter-input');
    for(let i = 0; i < counter_input.length; i++){
        const input = counter_input[i].querySelector('input');
        if(input){
            input.setAttribute('data-max', 100);
            input.oninput = (e) => {
                const value = e.target.value;
                if(value > 100){
                    e.target.value = 100;
                }
            }
        }
    }
}, 1000);
