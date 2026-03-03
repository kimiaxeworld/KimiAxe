const BOT_TOKEN = '7991955321:AAHncIhfWlP1F2WKHYNXQ5bLr-qWeknjtOY';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBAPP_URL = 'https://www.kimiaxe.com';

const mainMenu = {inline_keyboard:[[{text:'🌐 Open Website',web_app:{url:WEBAPP_URL}}],[{text:'💰 Wallet',callback_data:'wallet'},{text:'🔗 Link Shortener',callback_data:'shorten'}],[{text:'🤖 AI Tools',callback_data:'ai'},{text:'📱 eSIM',callback_data:'esim'}],[{text:'🌐 Domains',callback_data:'domains'},{text:'📊 Social Media',callback_data:'social'}],[{text:'📞 Support',callback_data:'support'},{text:'📢 Channel',url:'https://t.me/kimiaxe'}]]};

async function api(method, body) {await fetch(`${TG_API}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}

async function handleUpdate(update) {
if (update.message?.text) {
const c = update.message.chat.id, t = update.message.text.trim().split(' ')[0], n = update.message.from.first_name||'there';
if (t === '/start' || t === '/help') {
await api('sendMessage',{chat_id:c,text:`🖤 Welcome to KimiAxe, ${n}!\n\n💰 Wallet • 🔗 Links • 🤖 AI\n📱 eSIM • 🌐 Domains • 📊 Social\n\nTap:`,reply_markup:mainMenu});
}
}
if (update.callback_query) {
const cb = update.callback_query, c = cb.message.chat.id, m = cb.message.message_id;
if (cb.data === 'back_menu') {
await api('editMessageText',{chat_id:c,message_id:m,text:'🖤 Choose:',reply_markup:mainMenu});
} else {
await api('editMessageText',{chat_id:c,message_id:m,text:'🌐 Open website:',reply_markup:{inline_keyboard:[[{text:'🌐 Open',web_app:{url:WEBAPP_URL}}],[{text:'⬅️ Back',callback_data:'back_menu'}]]}});
}
await api('answerCallbackQuery',{callback_query_id:cb.id});
}
}

addEventListener('fetch', event => {
if (event.request.method === 'POST') {
event.respondWith((async () => {try{await handleUpdate(await event.request.json())}catch(e){}})());
}
event.respondWith(new Response('OK'));
});
