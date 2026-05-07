// source: https://pkkopt.com.ua/
// extracted: 2026-05-07T21:19:15.489Z
// scripts: 1

// === script #1 (length=3393) ===
const metadata={"account_id":"800aaae1-dfa4-4ada-9f9e-a38b22e4fcd2","widget_id":"PKKOPT","sm_pages":[{"name":"Viber","url":"viber://chat?number=%2B380507299583"},{"name":"WhatsApp","url":""},{"name":"Instagram","url":"https://www.instagram.com/pkk.cosmetic/"},{"name":"Telegram","url":"https://t.me/pkk_cosmetic"},{"name":"Olx","url":""},{"name":"Facebook","url":"https://www.facebook.com/pkk.moda/"},{"name":"TikTok","url":""}],"color":"#F97316","pop_up_text":"Зв'язатися з менеджером","widget_name":"PKKOPT","button_position":"right","button_has_text":true,"welcome_text":"Подільська Косметична Компанія","button_margin_mobile":30,"button_margin":30,"lang":"ua","scale":0.8,"button_scale":1.2,"button_scale_mobile":1,"button_visibility":false,"hide_default_button":false,"logo":"https://static.mychatbot.app/client_files/moio4rn2ij90ga.png","assistant_avatar":"https://static.mychatbot.app/client_files/moios58a1gloqp.jpg","website_url":"https://pkkopt.com.ua/","ad_oriented_widget":false,"ad_popup_interval":1000,"ad_widget_title":"Veronika is here","ad_widget_description":"DM me for an extra discount","ad_show_popups_when_collapsed":false,"ad_auto_expand_disabled":false,"show_client_status":true,"is_status_dropdown_required":true,"widget_client_statuses":["Потенційний роздрібний клієнт  ","Потенційний оптовий клієнт","Потенційний дропшипер","Постійний роздрібний клієнт  ","Оптовик","Дропшипер","Постіний роздрібний покупець"],"wait_code":false};
  const config = {
    account_id: metadata.account_id,
    widget_id: 'PKKOPT',
    sm_pages: metadata.sm_pages || [],
    pop_up_text: metadata.pop_up_text,
    button_position: metadata.button_position,
    welcome_text: metadata.welcome_text || 'Hello! How can I help you today?',
    button_margin_mobile: metadata.button_margin_mobile || 20,
    button_margin: metadata.button_margin || 20,
    lang: metadata.lang || 'en',
    scale: metadata.scale || 1,
    button_scale: metadata.button_scale || 1,
    button_scale_mobile: metadata.button_scale_mobile || 1,
    color: metadata.color || '#22194D',
    button_has_text: metadata.button_has_text,
    widget_name: metadata.widget_name || '',
    button_text: metadata.button_text || '',
    api_url: 'https://api.mychatbot.app',
    assistant_name: 'ПКК -бот',
    audio_url: 'https://storage.googleapis.com/mychatbot-widget-assets/v1/sound-message.mp3',
    logo: metadata.logo || '',
    assistant_avatar: metadata.assistant_avatar || 'female-1',
    whitelist: metadata.whitelist || [],
    hide_default_button: metadata.hide_default_button || false,
    disable_contact_form: metadata.disable_contact_form || false,
    ad_oriented_widget: metadata.ad_oriented_widget || false,
    ad_popup_messages: metadata.ad_popup_messages || [],
    ad_popup_interval: metadata.ad_popup_interval || 1000,
    ad_widget_title: metadata.ad_widget_title || '',
    ad_widget_description: metadata.ad_widget_description || '',
    ad_show_popups_when_collapsed: metadata.ad_show_popups_when_collapsed || false,
    ad_auto_expand_disabled: metadata.ad_auto_expand_disabled || false,
    show_client_status: metadata.show_client_status || false,
    is_status_dropdown_required: metadata.is_status_dropdown_required || false,
    widget_client_statuses: metadata.widget_client_statuses || [],
  };
  MyChatBot.mount('#my-chat-widget-container', config);
