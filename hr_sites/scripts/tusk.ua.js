// source: https://tusk.ua/
// extracted: 2026-05-07T21:19:20.486Z
// scripts: 1

// === script #1 (length=1987) ===
const metadata={"account_id":"e9b78ac8-f808-4f0c-8b68-0b4cb589bc21","widget_id":"TuskUA","sm_pages":[{"name":"Facebook","url":"https://m.me/tusk.compressor"},{"name":"Instagram","url":"https://www.instagram.com/tusk.group/"},{"name":"Viber","url":""},{"name":"Olx","url":""},{"name":"Telegram","url":""},{"name":"Tiktok","url":""}],"color":"#003c97","pop_up_text":"Давайте поговоримо","widget_name":"TuskUA","button_position":"right","welcome_text":"Доброго дня! Раді вітати вас на Tusk.ua. Чим я можу вам допомогти сьогодні?","lang":"ua","scale":1,"button_scale":1,"button_scale_mobile":1,"button_visibility":false,"hide_default_button":false,"logo":"https://tusk.ua/content/images/2/400x79l50nn0/83621499402369.webp","assistant_avatar":"male-1","website_url":"https://tusk.ua/ua/","wait_code":false};
  const config = {
    account_id: metadata.account_id,
    widget_id: 'TuskUA',
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
    assistant_name: 'Андрій',
    audio_url: 'https://api.mychatbot.app/sw-assets/v1/assets/sound-message.mp3',
    logo: metadata.logo || '',
    assistant_avatar: metadata.assistant_avatar || 'female-1',
    whitelist: metadata.whitelist || [],
    hide_default_button: metadata.hide_default_button || false,
  };
  MyChatBot.mount('#my-chat-widget-container', config);
