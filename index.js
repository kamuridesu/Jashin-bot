import P from 'pino';
import pkg from '@adiwajshing/baileys';
const {
    default: makeWASocket,
    DisconnectReason, 
    makeInMemoryStore,
    useSingleFileAuthState,
} = pkg;
import fs from 'fs';
import { checkGroupData, checkMessageData, checkNumberInMessage, getDataFromUrl, checkType } from './src/functions.js';
import { Database } from './databases/db.js';
import { commandHandler } from './src/command_handlers.js';
import { messageHandler } from './src/chat_handlers.js';
import { Log } from './logger/logger.js';

const store = makeInMemoryStore({ logger: P().child({ level: 'info', stream: 'store' }) })

const { state, saveState } = useSingleFileAuthState('./state/auth_info_multi.json')


class BotData {
    constructor() {
        // carrega as configurações do bot
        this.sender = undefined;
        this.from = undefined;
        this.sender_is_owner = undefined;
        this.is_group = undefined;
    }
}


class Bot {
    constructor() {
        // carrega as configurações do bot
        const owner_data = JSON.parse(fs.readFileSync("./config/config.admin.json"));
        this.conn = undefined;
        this.prefix = owner_data.prefix;
        this.owner_jid = owner_data.owner;
        this.voice_synth = owner_data.uberduck;
        this.has_updates = false;
        // this.database = new Database();
        // this.logger = new Log("./logger/jashin_logs.log");
        this.state = state
        this.saveState = saveState
        this.database = new Database();
        this.reconnect_on_close = true;
        this.logger = new Log("./logger/jashin_logs.log");
        this.bot_number = owner_data.bot;
    }

    async init() {
        this.conn = makeWASocket({
            // logger: P({ level: 'trace' }),
            printQRInTerminal: true,
            auth: this.state,
        });

        store.bind(this.conn.ev);

        this.conn.ev.on('chats.set', item => console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`))
        this.conn.ev.on('messages.set', item => console.log(`recv ${item.messages.length} messages (is latest: ${item.isLatest})`))
        this.conn.ev.on('contacts.set', item => console.log(`recv ${item.contacts.length} contacts`))

        this.conn.ev.on('messages.upsert', async m => {
            const msg = m.messages[0]
            if(!msg.key.fromMe && m.type === 'notify') {
                this.getMessageContent(msg);
            }
        });
        this.conn.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update
            if(connection === 'close') {
                // reconnect if not logged out
                if(!this.reconnect_on_close) {
                    this.init();
                } else if((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                    this.init()
                } else {
                    console.log('connection closed')
                }
            }
                
        });
        this.conn.ev.on('creds.update', this.saveState);

        this.conn.ev.on('group-participants.update', async (update) => {
            if(update.action == "add") {
                this.welcome(update.id, update.participants);
            // } else if(update.action == "remove") {
            //     this.welcome(update.id, update.participants);
            }
        });
    }

    async welcome(group_id, participants) {
        let group_data = undefined;
        let metadata = undefined;
        try {
            metadata = await this.conn.groupMetadata(group_id);
        } catch(e) {
            console.log(e)
        }
        group_data = await checkGroupData(metadata, this.bot_number);
        const db_data = await this.database.get_group_infos(group_data.id);
        if (db_data == null) {
            await this.database.insert("group_infos", {
                jid: group_data.id,
                welcome_on: false,
                welcome_message: "",
                antilink_on: false,
                nsfw_on: false,
                chatbot_on: false,
            });
        }
        group_data.db_data = await this.database.get_group_infos(group_data.id);
        if(group_data.db_data.welcome_on) {
            let msg = ""
            const welcome_message = group_data.db_data.welcome_message;
            for(let i = 0; i < participants.length; i++) {
                const participant = participants[i];
                if(participant !== this.bot_number) {
                   msg = "Olá, @" + participant.split("@")[0] + "! \n\n";
                }
            }
            msg += welcome_message;
            await this.sendTextMessage(group_id, msg, participants);
        }
    }

    async getMessageContent(message) {
        if (!message.message) return
        message.message = (Object.keys(message.message)[0] === 'ephemeralMessage') ? message.message.ephemeralMessage.message : message.message
        if (message.key && message.key.remoteJid === 'status@broadcast') return
        if (message.key.id.startsWith('BAE5') && message.key.id.length === 16) return

        const message_data = await checkMessageData(message);
        const bot_data = new BotData();
        let group_data = undefined;

        bot_data.from = message.key.remoteJid;
        bot_data.sender = bot_data.from;
        bot_data.sender_is_owner = (bot_data.from === this.owner_jid);
        bot_data.is_group = (bot_data.from.includes('@g.us'));
        bot_data.sender_name = message.pushName;
        
        if(bot_data.is_group) {
            bot_data.sender = message.key.participant;
            let metadata = undefined;
            try {
                metadata = await this.conn.groupMetadata(bot_data.from);
            } catch(e) {
                console.log(e)
            }
            group_data = await checkGroupData(metadata, this.bot_number, bot_data.sender);
            const db_data = await this.database.get_group_infos(group_data.id);
            if (db_data == null) {
                await this.database.insert("group_infos", {
                    jid: group_data.id,
                    welcome_on: false,
                    welcome_message: "",
                    antilink_on: false,
                    nsfw_on: false,
                    chatbot_on: false,
                });
            }
            group_data.db_data = await this.database.get_group_infos(group_data.id);
            await this.conn.sendReadReceipt(group_data.id, bot_data.sender, [message_data.context.key.id])
        } else {
            await this.conn.sendReadReceipt(bot_data.sender, undefined, [message_data.context.key.id])
        }

        if(bot_data.sender == this.owner_jid || bot_data.from == this.owner_jid) {
            bot_data.sender_is_owner = true;
        }

        let sender_data = await this.database.get_user_infos(bot_data.sender);
        if (sender_data == null) {
            await this.database.insert("user_infos", {
                jid: bot_data.sender,
                slot_chances: 50
            });
        }
        sender_data = await this.database.get_user_infos(bot_data.sender);

        if (message_data.body.startsWith(this.prefix)) {
            if(message_data.body.includes("!slot")) {
                sender_data.slot_chances = sender_data.slot_chances - 1;
                this.database.update("user_infos", sender_data);
            }
            return commandHandler(this, message_data.body, {
                message_data,
                bot_data,
                group_data,
                sender_data,
            });
        } else {
            messageHandler(this, message_data, {
                message_data,
                bot_data,
                group_data,
                sender_data,
            });
        }
    }

    async replyText(data, text, mention) {
        const recipient = data.bot_data.from;
        const context = data.message_data.context;
        if(!mention) {
            mention = checkNumberInMessage(text);
        }
        try {
            await this.conn.presenceSubscribe(recipient);
            await this.conn.sendPresenceUpdate('composing', recipient); 
            await this.conn.sendMessage(recipient, { text: text, mentions: mention }, {
                quoted: context,
            });
            await this.conn.sendPresenceUpdate('paused', recipient);
        } catch(e) {
            console.log(e);
        }
    }

    async replyMedia(data, media, message_type, mime, caption) {
        const recipient = data.bot_data.from;
        const context = data.message_data.context;
        try {
            await this.conn.presenceSubscribe(recipient);
            await this.conn.sendPresenceUpdate('recording', recipient);
            if(fs.existsSync(media)) {
                media = fs.readFileSync(media);
            } else if (typeof (media) == "string") {
                media = await getDataFromUrl(media);
                if(media.error) {
                    caption = media.error.code;
                    media = media.media;
                    message_type = "image",
                    mime = "image/png"
                }
            }
            if(message_type === "sticker") {
                await this.conn.sendMessage(recipient, {
                    sticker: media,
                    quoted: context,
                });
            } else if(mime == "image/gif") {
                await this.conn.sendMessage(recipient, {
                    video: media,
                    gifPlayback: true,
                }, {
                    quoted: context,
                    caption: caption,
                });
            } else {
                let mention = "";
                if(caption) {
                    mention = checkNumberInMessage(caption);
                }
                await this.conn.sendMessage(recipient, checkType(media, message_type, mime), {
                    quoted: context,
                    mentions: [mention],
                    caption: caption,
                });
            }
            await this.conn.sendPresenceUpdate('paused', recipient);
        } catch(e) {
            console.log(e);
        }
    }

    async sendTextMessage(data, message, options) {
        const recipient = data.bot_data ? data.bot_data.from : data;
        let mention = "";
        mention = checkNumberInMessage(message);
        try {
            await this.conn.presenceSubscribe(recipient)
            await this.conn.sendPresenceUpdate('composing', recipient)
            await this.conn.sendPresenceUpdate('paused', recipient)
            await this.conn.sendMessage( recipient, { text: message, mentions: mention }, {
                quoted: data.message_data ? data.message_data.context : undefined,
                ...options
            })
        } catch(e) {
            console.log(e)
        }
    }
}


const bot = new Bot();
bot.init();
