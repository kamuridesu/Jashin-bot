// Imports
import {WAConnection, MessageType, Mimetype, Presence } from '@adiwajshing/baileys';
import { commandHandler } from "./src/command_handlers.js";
import { checkGroupData, createMediaBuffer, checkMessageData, checkUpdates, updateBot } from './src/functions.js';
import { messageHandler } from './src/chat_handlers.js';
import fs from "fs";


// dataclass para armazenar os dados do bot
class BotData {
    constructor() {
        // carrega as configurações do bot
        this.sender = undefined;
        this.from = undefined;
        this.sender_is_owner = undefined;
        this.is_group = undefined;
        this.all_chats = undefined;
    }
}


class GroupData {
    constructor() {
        //
    }
}


class MessageData {
    constructor() {
        //
    }
}

// classe Bot, onde as informações vão ser armazenadas e as requisições processadas.
class Bot {
    constructor() {
        // carrega as configurações do bot
        const owner_data = JSON.parse(fs.readFileSync("./config/config.admin.json"));
        this.conn = undefined;
        this.prefix = owner_data.prefix;
        this.owner_jid = owner_data.owner;
        this.voice_synth = owner_data.uberduck;
        this.has_updates = false;
    }

    async connectToWa() {
        // conecta ao whatsapp
        this.conn = new WAConnection();
        const config_auth_filename = "./config/config.auth.json";
        // carrega as configurações de autenticação
        try{
            this.conn.loadAuthInfo(config_auth_filename);
        } catch (e) {
            this.conn.on("open", () => {
                const authInfo = this.conn.base64EncodedAuthInfo()
                fs.writeFileSync(config_auth_filename, JSON.stringify(authInfo));
            })
        }

        await this.conn.connect();
        this.bot_number = this.conn.user.jid; // pega o numero do bot

        this.conn.on('chat-update', async chatUpdate => {
            if (chatUpdate.messages && chatUpdate.count) {
                if(JSON.parse(JSON.stringify(chatUpdate)).messages[0].messageStubType !== "REVOKE"){
                    this.getMessageContent(chatUpdate.messages.all()[0]); // processa a mensagem
                }
            }
        });
        // this.conn.on('')
    }

    /**
     * processa a mensagem
     * @param {object} message menssagem contendo os dados para processamento
     */
    async getMessageContent(message) {
        // console.log(this.bot_number);
        checkUpdates(this);

        const bot_data = new BotData();
        let group_data = undefined;

        bot_data.all_chats = this.conn.chats.all();  // pega todos os grupos
        const message_data = await checkMessageData(message); // pega os dados da mensagem

        if (!message.message) return false; // se não for mensagem, não faz nada.
        if (message.key && message.key.remoteJid == 'status@broadcast') return false; // se for broadcast, não faz nada.
        if (message.key.fromMe) return false; // se for mensagem do bot, não faz nada.

        bot_data.from = message.key.remoteJid;  // pega o remetente da mensagem
        await this.conn.updatePresence(bot_data.from, Presence.available); // atualiza o status do remetente para online.
        await this.conn.chatRead(bot_data.from); // marca a mensagem como lida.
        bot_data.sender = bot_data.from; // pega o remetente da mensagem
        bot_data.sender_name = this.conn.contacts[bot_data.sender] ? this.conn.contacts[bot_data.sender].name : bot_data.sender; // pega o nome do remetente
        bot_data.is_group = bot_data.sender.endsWith("@g.us"); // verifica se é um grupo

        if (bot_data.is_group) { // se for um grupo
            bot_data.sender = message.participant // pega o remetente da mensagem
            const metadata = await this.conn.groupMetadata(bot_data.from) // pega os dados do grupo
            group_data = await checkGroupData(metadata, this.bot_number, bot_data.sender); // processa os dados do grupo
        }
        if (bot_data.sender === this.owner_jid || bot_data.from === this.owner_jid) { // se for o dono do bot
            bot_data.sender_is_owner = true; // define que o remetente é o dono do bot
        }
        if (message_data.body.startsWith(this.prefix)) { // se a mensagem começar com o prefixo
            return await commandHandler(this, message_data.body, {
                message_data,
                bot_data,
                group_data
            }); // processa a mensagem como comando
            // retorna se for command, evita que o bot atualize quando tiver recebendo comando.
        } else {
            await messageHandler(this, message_data.body, {
                message_data,
                bot_data,
                group_data
            }); // processa a mensagem como mensagem
        }
        if(this.has_updates) { // se tiver atualizações
            console.log(this.has_updates)
            console.log("Atualização dispoível!");
            console.log("Atualizando...");
            await this.conn.updatePresence(bot_data.from, Presence.unavailable);
            await updateBot(this, {
                message_data,
                bot_data,
                group_data
            }); // atualiza o bot
        }
    }

    /**
     * responde via mensagem de texto para o usuario.
     * @param {string} text texto a ser enviado.
     */
    async replyText(data, text, mention) {
        const recipient = data.bot_data.from;
        const context = data.message_data.context;
        // envia uma mensagem de texto para o usuario como resposta.
        await this.conn.updatePresence(recipient, Presence.composing); // atualiza o status do remetente para "escrevendo"
        await this.conn.sendMessage(recipient, text, MessageType.text, { // envia a mensagem
            quoted: context,
            contextInfo: {
                "mentionedJid": mention ? mention : ""
            }// se for uma mensagem de contexto, envia como contexto.
        });
        await this.conn.updatePresence(recipient, Presence.available); // atualiza o status do remetente para online.
    }

    /**
     * reponde enviando uma midia
     * @param {Buffer} media midia a ser enviada
     * @param {MessageType} message_type tipo da mensagem
     * @param {Mimetype} mime mime do arquivo a ser enviado
     * @param {string} caption legenda do arquivo
     */
    async replyMedia(data, media, message_type, mime, caption) {
        const recipient = data.bot_data.from;
        const context = data.message_data.context;
        // envia uma midia para o usuario como resposta.
        await this.conn.updatePresence(recipient, Presence.recording); // atualiza o status do remetente para "gravando"
        if (fs.existsSync(media)) { // se o arquivo existir
            // verifica se o arquivo existe localmente, se sim, o envia
            media = fs.readFileSync(media); // le o arquivo
        } else { // se não existir
            // se o arquivo não existir localmente, tenta fazer o download.
            media = await createMediaBuffer(media); // tenta fazer o download
            if(media.error) { // se não conseguir fazer o download
                caption = media.error.code, // pega o erro
                media = media.media // pega a midia do erro
            }
        }
        if (message_type === MessageType.sticker) { // se for um sticker
            // se for sticker, não pode enviar caption nem mime.
            await this.conn.sendMessage(recipient, media, message_type, {
                quoted: context
            })
        } else {
            await this.conn.sendMessage(recipient, media, message_type, { // envia a midia
                mimetype: mime ? mime : '',
                caption: (caption != undefined) ? caption : "",
                quoted: context
            })
        }
        await this.conn.updatePresence(recipient, Presence.available); // atualiza o status do remetente para online.
    }

    /**
     * envia mensagem de texto para alguem sem mencionar
     * @param {string} text texto a ser enviado
     * @param {string} to para quem enviar
     */
    async sendTextMessage(data, text, to) { // envia mensagem de texto para alguem sem mencionar
        const recipient = data.bot_data.from;
        // const context = data.message_data.context;
        await this.conn.updatePresence(recipient, Presence.composing); // atualiza o status do remetente para "escrevendo"
        const to_who = to ? to : recipient;  // define para quem enviar
        await this.conn.sendMessage(to_who, text, MessageType.text); // envia a mensagem
        await this.conn.updatePresence(to_who, Presence.available); // atualiza o status do remetente para online.
    }

    /**
     * envia mensagem de texto para alguem com mencion
     * @param {string} text texto a ser enviado
     * @param {string} mention quem mencionar
     */
    async sendTextMessageWithMention(text, mention) { // envia mensagem de texto para alguem com mencion
        const recipient = data.bot_data.from;
        // const context = data.message_data.context;
        await this.conn.updatePresence(recipient, Presence.composing); // atualiza o status do remetente para "escrevendo"
        await this.conn.sendMessage(recipient, text, MessageType.text, { // envia a mensagem
            contextInfo: {
                "mentionedJid": mention
            }
        });
        await this.conn.updatePresence(mention, Presence.available); // atualiza o status do remetente para online.
    }
}


let x = new Bot();  // cria um novo bot
x.connectToWa().catch(err => console.log("unexpected error: " + err)); // conecta ao whatsapp e inicia o bot.
