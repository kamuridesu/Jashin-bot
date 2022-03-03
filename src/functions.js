import pkg from "@adiwajshing/baileys"
const { downloadContentFromMessage } = pkg;
import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import { Log } from "../logger/logger.js";

/* FUNÇOES NECESSÁRIAS PARA O FUNCIONAMENTO IDEAL DO BOT
NÃO PODEM SER MODIFICADAS OU EXCLUÍDAS SEM O CONHECIMENTO NECESSÁRIO PARA MODIFICAR AS OUTRAS!
*/

/**
 * Checks for update, compares the actual version with the version on my repo.
 * @param {Bot} bot bot instance
 */
async function checkUpdates(bot) {
    // checks for updates on github
    let actual_version = JSON.parse(fs.readFileSync("./package.json")).version;  // get actual version
    try{
        const response = await axios({
            method: "get",
            url: "https://raw.githubusercontent.com/kamuridesu/Jashin-bot/main/package.json",  // get version from github
            headers: {
                "DNT": 1,
                "Upgrade-Insecure-Request": 1
            },
            responseType: 'blob'
        });
        bot.has_updates = (response.data.version != actual_version);  // check if there is an update
    } catch (e) {
        bot.logger.write(e, 2)
    }
}

/**
 * Updates the bot, on fail sends message to bot owner.
 * @param {Bot} bot bot instance
 */
async function updateBot(bot, data) {
    // updates the bot
    exec("git pull origin main", (error) => {
        bot.logger.write("Rodando git pull", 3);
        if(error){
            bot.logger.write(error, 2);
            bot.sendTextMessage(data, "Não foi possivel atualizar> " + error, bot.owner_jid);  // send error message to owner
        }
    })
}

/**
 * Checks the metadata for one group
 * @param {object} group_metadata 
 * @param {string} bot_number 
 * @param {string} sender 
 * @returns {object} group_data;
 */
async function checkGroupData(group_metadata, bot_number, sender) {
    // checks the metadata for one group
    let group_data = {
        name: undefined,
        id: undefined,
        members: undefined,
        owner: undefined,
        sender_is_group_owner: undefined,
        bot_is_admin: false,
        sender_is_admin: undefined,
        admins: [],
        description: undefined,
        locked: false,
        open: true,
        welcome_on: false,
    }

    group_data.name = group_metadata.subject
    group_data.id = group_metadata.id;
    group_data.members = group_metadata.participants;
    group_data.owner = group_metadata.owner;
    group_data.locked = group_metadata.announce !== undefined ? JSON.parse(JSON.stringify(group_metadata.announce).replace(/"/g, '')) : false;  // check if group is locked or not (if it has an announcement)
    group_data.open = !group_data.locked;  // check if group is open or not (if it has an announcement)
    // group_data.bot_is_admin = group_data.admins_jid.includes(bot_number);
    // group_data.sender_is_admin = group_data.admins_jid.includes(sender);
    for(let i = 0; i < group_data.members.length; i++){
        if(group_data.members[i].id == bot_number){
            if(group_data.members[i].admin == "admin" || group_data.members[i].admin == "superadmin"){
                group_data.bot_is_admin = true;
            }
        }
        if(group_data.members[i].id == sender){
            if(group_data.members[i].admin == "admin" || group_data.members[i].admin == "superadmin"){
                group_data.sender_is_admin = true;
            }
        }
        if(group_data.members[i].admin == "admin" || group_data.members[i].admin == "superadmin"){
            group_data.admins.push(group_data.members[i].id);
        }
    }
    group_data.sender_is_group_owner = group_data.owner == sender;
    group_data.description = group_metadata.desc;
    return group_data;
}

/**
 * Checks the message data and populate a data object
 * @param {object} message message instance to check data
 * @returns {object} message_data with all retrieved information
 */
async function checkMessageData(message) {
    // checks the message data and populate a data object
    let message_data = {
        context: undefined,
        type: undefined,
        body: undefined,
        is_media: false,
        is_quoted_text: false,
        is_quoted_video: false,
        is_quoted_image: false,
        is_quoted_audio: false,
        is_quoted_sticker: false,

    }
    const type = Object.keys(message.message)[0];  // get message type (text, image, video, audio, sticker, location, contact, etc)
    message_data.type = type;
    message_data.context = message;
    message_data.is_media = (type === 'imageMessage' || type === 'videoMessage');

    let body = '';

    // get message body
    if (type == 'conversation') {
        body = message.message.conversation;
    } else if (type == "imageMessage") {
        body = message.message.imageMessage.caption;
    } else if (type == "videoMessage") {
        body = message.message.videoMessage.caption;
    } else if(type == "extendedTextMessage") {
        body = message.message.extendedTextMessage.text;
    }
    message_data.body = body;

    // check if message is a quoted message
    if (type === "extendedTextMessage") {
        const message_string = JSON.stringify(message.message);
        message_data.is_quoted_text = message_string.includes("conversation");
        message_data.is_quoted_audio = message_string.includes("audioMessage");
        message_data.is_quoted_image = message_string.includes("imageMessage");
        message_data.is_quoted_video = message_string.includes("videoMessage");
        message_data.is_quoted_sticker = message_string.includes("stickerMessage");
    }
    return message_data;
}

/**
 * Create buffer from downloaded media
 * @param {string} url url where the media will be downloaded
 * @param {object} options options to download
 * @returns {object} with response data or error
 */
async function getDataFromUrl(url, header, responsetype, options) {
    url = encodeURI(url);
    const logger = new Log("./logger/functions.log");
    // logger.write("Downloading media from url: " + url, 3);
    // create buffer from downloaded media
    try {
        options ? options : {}
        const response = await axios({
            method: "get",
            url: url,
            headers: header ? header : {
                "DNT": 1,
                "Upgrade-Insecure-Request": 1
            },
            ...options,
            responseType: responsetype ? responsetype : 'arraybuffer'
        })
        // logger.write("Media downloaded", 3);
        return response.data
    } catch (e) {
        logger.write(e, 2)
        return {media: fs.readFileSync("./etc/error_image.png"), error: e}  // return error image
    }
}


async function postDataToUrl(url, data, header, options) {
    const logger = new Log("./logger/functions.log");
    try {
        options ? options : {}
        const response = await axios( {
            method: "post",
            url: url,
            headers : header ? header : {
                "DNT": 1,
                "Upgrade-Insecure-Request": 1
            },
            data: data ? data : "",
            ...options,
            responseType: "json"
        });
        return response.data
    } catch (e) {
        logger.write(e, 2)
        return {media: fs.readFileSync("./etc/error_image.png"), error: e}  // return error image
    }
}


function checkNumberInMessage(text) {
    const regex = /@[0-9]{12}/g;
    if(regex.test(text)) {
        return text.match(regex).map(number => number.replace("@", "") + "@s.whatsapp.net");
    }
    return "";
}

function quotationMarkParser(text) {
    // separate the text into words, except if inside quotation marks
    if(!text) {
        return [];
    }
    let words = text.split(/\s+/);
    let in_quotes = false;
    let quote_start = 0;
    let quote_end = 0;
    let quote_words = [];
    for(let i = 0; i < words.length; i++) {
        if(words[i].startsWith("\"")) {
            if(words[i].endsWith("\"")) {
                const word = words[i].replace(/"/g, "").trim();
                if (word != "") {
                    quote_words.push(word);
                }
            }
            else if(!in_quotes) {
                in_quotes = true;
                quote_start = i;
            }
        } else if(words[i].endsWith("\"")) {
            in_quotes = false;
            quote_end = i;
            let quote = words.slice(quote_start, quote_end + 1).join(" ").replace(/"/g, "").trim();
            if (quote != "") {
                quote_words.push(quote);
            }
        } else {
            if(!in_quotes) {
                const word = words[i].trim();
                if (word != "") {
                    quote_words.push(word);
                }
            }
        }
    }
    return quote_words;
}


function checkType(media, type, mime) {
    if (type == "image") {
        return {
            image: media,
            mimetype: mime
        }
    } else if (type == "video") {
        return {
            video: media,
            mimetype: mime
        }
    } else if (type == "audio") {
        return {
            audio: media,
            mimetype: mime
        }
    }
}


async function getMediaFromMessage(message, media) {
    let content = undefined;
    if (message.type == "imageMessage" || message.is_quoted_image) {
        content = await downloadContentFromMessage(media.message.imageMessage, "image");
    } else if (message.type == "videoMessage" || message.is_quoted_video) {
        content = await downloadContentFromMessage(media.message.videoMessage, "video");
    } else if (message.type == "audioMessage" || message.is_quoted_audio) {
        content = await downloadContentFromMessage(media.message.audioMessage, "audio");
    }
    let buffer = Buffer.from([]);
    for await(const chunk of content) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}


async function downloadAndSaveMediaMessage(message, media, path) {
    const content = await getMediaFromMessage(message, media);
    fs.writeFileSync(path, content);
    return path;
}

export { checkGroupData, getDataFromUrl, checkMessageData, checkUpdates, updateBot, postDataToUrl, checkNumberInMessage, quotationMarkParser, checkType, getMediaFromMessage, downloadAndSaveMediaMessage };
