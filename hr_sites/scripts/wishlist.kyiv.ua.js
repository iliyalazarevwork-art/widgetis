// source: https://wishlist.kyiv.ua/
// extracted: 2026-05-07T21:19:47.393Z
// scripts: 4

// === script #1 (length=650) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '',
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

// === script #2 (length=16090) ===
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
                console.log('LocationSearchJson Error')
            }
    }
    const load_metrics_from_cookie = () => {
        window.metrics = get_cookie('metrics') ? JSON.parse(get_cookie('metrics')) : window.metrics
        console.log('load_metrics_from_cookie')
        console.log('window.metrics')
        console.log(metrics)
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
                    {utm_source: 'kim', utm_medium: 'cpa'}
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
                    if (subrules.every((subrule) => subrule === true)){
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

// === script #3 (length=3359) ===
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

// === script #4 (length=565) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://embed.helpcrunch.com/sdk.js';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)
