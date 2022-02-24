import { getCommandsByCategory, getAjuda } from "../docs/DOC_commands.js";
import { MessageType, Mimetype, GroupSettingChange, ChatModification } from '@adiwajshing/baileys';
import { getDataFromUrl, postDataToUrl, quotationMarkParser } from './functions.js';
import { createStickerFromMedia, convertGifToMp4, Waifu, NekoApi } from './user_functions.js';
import { Log } from "../logger/logger.js";
import KamTube from 'kamtube';
import fs from 'fs';

let error = "Algo deu errado"

// infos
async function start(data, bot) {
    return await bot.replyText(data, "Hey! Sou um simples bot, porém ainda estou em desevolvimento!\n\nGrupo oficial: https://chat.whatsapp.com/GiZaCU2nmtxIWeCfe98kvi\n\nCaso queira me apoiar no Patreon: https://www.patreon.com/kamuridesu\n\nO meu template: https://github.com/kamuridesu/WhatsappBot");
}

async function help(data, bot, args) {
    if (args.length >= 1) {
        const command_name = args[0];
        const command_data = await getAjuda(command_name);
        if (!command_data) return await bot.replyText(data, "Este comando não existe!");
        return await bot.replyText(data, command_data);
    }
    return await bot.replyText(data, await getCommandsByCategory());
}

async function bug(data, bot, args) {
    if (args.length < 1) {
        return await bot.replyText(data, "Por favor, digite o bug que você está reportando!");
    }
    const bug = args.join(" ");
    const sender = "wa.me/" + data.bot_data.sender.split("@")[0];
    await bot.sendTextMessage(data, "Bug reportado por: " + sender + "\n\n" + bug, bot.owner_jid);
    return await bot.replyText(data, "Bug reportado com sucesso! O abuso desse comando pode ser punido!");
}

async function traduzir(data, bot, args, routes_object) {
    if (args.length < 2) {
        return await bot.replyText(data, "Por favor, digite o idioma que você deseja traduzir e o texto que você deseja traduzir!");
    }
    const lang = args[0];
    const text = args.slice(1).join(" ");
    const host = routes_object.chatbot.host;
    const port = routes_object.chatbot.port;

    const response = await getDataFromUrl(`http://${host}:${port}/translate?text=` + text + "&target=" + lang, {}, "json");
    if (response.error) return await bot.replyText(data, "Algo deu errado! Verifique se o idioma é válido!");
    return await bot.replyText(data, response.text);
}

async function idiomas(data, bot, routes_object) {
    const host = routes_object.chatbot.host;
    const port = routes_object.chatbot.port;
    const response = await getDataFromUrl(`http://${host}:${port}/languages`, {}, "json");
    if (response.error) return await bot.replyText(data, "Algo deu errado!");
    let output = "Idiomas disponíveis:\n";
    for (const lang in response.text) {
        output += lang + ": " + response.text[lang] + "\n";
    }
    return await bot.replyText(data, output);
}

// midia
async function download(data, bot, args, video_audio) {
    // return await bot.replyText(data, "Desativado temporariamente!");
    let video_or_audio = video_audio ? "audio" : "video"
    if (args.length < 1) {
        return await bot.replyText(data, "Por favor, escolha um " + video_or_audio + " para baixar!");
    }
    let youtube = new KamTube();
    let argument = args.join(" "); // get the argument
    // regex para ver se o argument é um link   
    const regex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi;
    if (!regex.test(argument)) { // se o argumento não for um link
        try{
            argument = (await youtube.search(argument))[0].videoId; // busca o vídeo
        } catch(e){
            return await bot.replyText(data, "Houve um errro ao processar!");
        }
    } else {
        // replace youtu.be or youtube.com for ytb.trom.tf
        if (argument.includes("youtu.be")) {
            argument = argument.split("/");
            let id = 0;
            if ("shorts" in argument) {
                id = argument[4];
            } else {
                id = argument[3];
            }
            argument = id;
        } else if (argument.includes("youtube.com")) {
            argument = argument.replace("youtube.com/watch?=");
        }
    }
    await bot.replyText(data, "Aguarde enquanto eu baixo...");
    let video = null;
    try {
        video = (await youtube.download(argument, video_audio));
    } catch (e) {
        console.log(e);
        return await bot.replyText(data, "Houve um erro ao baixar");
    }
    console.log("Video downloaded!");
    if (video != null) {
        if (video_audio != "audio") {
            await bot.replyMedia(data, video.data, MessageType.video, Mimetype.mp4);
        } else {
            await bot.replyMedia(data, video.data, MessageType.audio, Mimetype.mp4Audio);
        }
        return; 
    } else {
        return await bot.replyText(data, "Houve um erro ao processar!");
    }
}

async function voz(data, bot, args) {
    if (args.length < 1) { // se não houver argumento
        error = "Preciso do nome da voz a ser procurada!"; // mensagem de error
    } else {
        const name = args.join(" ").toLowerCase(); // pega o nome da voz
        const req_url = "https://api.uberduck.ai/voices?mode=tts-basic"; // url para requisição
        const response = await getDataFromUrl(req_url, {}, "json"); // requisita a API
        if (response.error) {
            return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
        }
        const voz = { "result": false, name: [] }; // cria um objeto para armazenar a voz
        for (let object of response) { // percorre a resposta
            if (object.display_name.toLowerCase().includes(name) || object.name.toLowerCase().includes(name)) { // se o nome da voz for igual ao nome da voz procurada
                voz.result = true; // define que a voz foi encontrada
                voz.name.push(object.name) // adiciona o nome da voz ao objeto
            }
        }
        if (voz.result) { // se a voz foi encontrada
            return await bot.replyText(data, "A voz existe! Use uma das opções abaixo: \n\n" + voz.name.join("\n")); // retorna a mensagem de sucesso
        } else {
            error = "A voz não existe"; // mensagem de erro
        }
    }
    return bot.replyText(data, error);
}

async function vozCat(data, bot) {
    const req_url = "https://api.uberduck.ai/voices?mode=tts-basic"; // url para requisição
    const response = await getDataFromUrl(req_url, {}, "json"); // requisita a API   
    if (response.error) {
        return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
    }
    let output = "--==Categorias==--\n\n"; // cria uma string para armazenar as categorias
    for (let object of response) { // percorre a resposta
        if (!output.includes(object.category)) { // se a categoria não foi adicionada
            output += object.category + "\n"; // adiciona a categoria ao objeto
        }
    }
    return await bot.replyText(data, output);
}

async function vozList(data, bot, args) {
    if (args.length < 1) { // se não houver argumento
        error = "Preciso do nome da categoria!"; // mensagem de erro
    }
    const name = args.join(" ").toLowerCase(); // pega o nome da categoria
    const req_url = "https://api.uberduck.ai/voices?mode=tts-basic"; // url para requisição
    const response = await getDataFromUrl(req_url, {}, "json"); // requisita a API
    if (response.error) {
        return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
    }
    let output = "--==Vozes==--\n\n"; // cria uma string para armazenar as vozes
    for (let object of response) { // percorre a resposta
        if (object.category.toLowerCase() == name) { // se a categoria for igual ao nome da categoria
            output += object.name + "\n"; // adiciona o nome da voz ao objeto
        }
    }
    return await bot.replyText(data, output);
}

async function audio(data, bot, args) {
    if (args.length < 2) { // se não houver argumento
        error = "Preciso do nome da voz e do conteudo para criar o audio!"; // mensagem de erro
    } else {
        const name = args[0].toLowerCase(); // pega o nome da voz
        const content = args.slice(1).join(" "); // pega o conteúdo
        // eslint-disable-next-line no-undef
        const keys = Buffer.from(`${bot.voice_synth.key}:${bot.voice_synth.secret}`).toString('base64'); // cria a chave
        await bot.replyText(data, "Aguarde alguns instantes enquanto processo..."); // mensagem de aguarde
        const response = await postDataToUrl(`https://api.uberduck.ai/speak`, JSON.stringify({ "speech": content, "voice": name }), { "Authorization": "Basic " + keys }); // requisita a API
        if (response.error) {
            return await bot.replyText(data, "Houve um erro ao processar! Verifique se o nome da voz é válido com o comando !voz"); // retorna a mensagem de erro
        }
        if (response.uuid) { // se a resposta tiver uuid
            const uuid = response.uuid; // pega o uuid
            let media = { "error": "Não foi possível baixar o audio!", finished_at: null }; // cria um objeto para armazenar o audio
            let count = 0; // contador
            do {
                if (count > 100) return await bot.replyText(data, "Houve um erro ao processar!"); // se o contador for maior que 100
                console.log("https://api.uberduck.ai/speak-status?uuid=" + uuid);
                media = await getDataFromUrl("https://api.uberduck.ai/speak-status?uuid=" + uuid, { "Authorization": "Basic " + keys }, "json"); // requisita a API
                if (media.error) {
                    return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
                }
                // espera 1 segundo
                await new Promise(resolve => setTimeout(resolve, 2000));
            } while (media.path == null);
            if (media.failed_at == null) { // se não houver erro
                return await bot.replyMedia(data, media.path, MessageType.audio, Mimetype.mp4Audio); // retorna a mensagem de sucesso
            }
        } else {
            error = "Houve um erro ao processar! Verifique se o nome da voz é válido com o comando !voz";
        }
    }
    return await bot.replyText(data, error);
}

async function downloadImage(data, bot, args) {
    // retorna uma imagem de uma url
    // baixa uma imagem a partir de uma url e baixa a imagem
    if (args.length < 1) {
        error = "Error! Preciso que uma url seja passad!";
    } else if (args.length > 1) {
        error = "Error! Muitos argumentos!";
    } else {
        return await bot.replyMedia(data, args[0], MessageType.image, Mimetype.png);
    }
    return await bot.replyText(data, error);
}

async function perfil(data, bot, args) {
    if (args.length == 0) {
        error = "Preciso que um user seja mencionado!";
    } else if (data.message_data.context.message.extendedTextMessage) {
        let mention = data.message_data.context.message.extendedTextMessage.contextInfo.mentionedJid[0]
        let profile_pic = "./etc/default_profile.png";
        try {
            profile_pic = await bot.conn.getProfilePicture(mention);
        } catch (e) {
            //
        }
        return bot.replyMedia(data, profile_pic, MessageType.image, Mimetype.png);
    }
    return bot.replyText(data, error);
}

async function sfwaifu(data, bot) {
    const waifu = new Waifu();
    const image = await waifu.get("sfw");
    if (image.error) {
        return await bot.replyText(data, "Houve um erro ao processar!");
    } else {
        if (image.url.endsWith(".gif")) {
            const filename = Math.round(Math.random() * 100000) + ".gif";
            fs.writeFileSync(filename, await getDataFromUrl(image.url));
            return await convertGifToMp4(bot, data, filename);
        }
        return await bot.replyMedia(data, image.url, MessageType.image);
    }
}

async function createSticker(data, bot, args) {
    // retorna um sticker
    let media = undefined;
    let packname = "kamuribot";
    let author = "kamuridesu";

    if (args.length >= 1) {
        // se o usuário passou um argumento, é o nome do pack de stickers que ele quer usar (se existir)
        if (["help", "ajuda"].includes(args[0])) {
            return bot.replyText("Use !sticker para criar um sticker, ou !sticker pacote autor para mudar o pacote e o autor!");
        }
        if (args.length == 2) {
            packname = args[0];
            author = args[1];
        }
    }

    if (data.message_data.is_media) { // verifica se a mensagem é midia
        if ((data.message_data.type == "imageMessage")) {  // verifica se a mensagem é imagem
            media = data.message_data.context;
        } else if (data.message_data.type == "videoMessage") { // verifica se a mensagem é video
            if (data.message_data.context.message.videoMessage.seconds < 11) { // verifica se o video tem menos de 11 segundos
                media = data.message_data.context;
            } else {
                error = "Video tem mais de 10 segundos!";
            }
        } else {
            error = "Midia não suportada!";
        }
    } else if (data.message_data.is_quoted_image) { // verifica se uma imagem foi mencionada
        // pega a imagem mencionada e transforma em objeto json para poder usar o contextInfo do objeto json (que é a imagem)
        media = JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo;
    } else if (data.message_data.is_quoted_video) { // verifica se um video foi mencionado
        // pega o video mencionado e transforma em objeto json para poder usar o contextInfo do objeto json (que é o video)
        if (data.message_data.context.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage.seconds < 11) { // verifica se um video mencionado tem menos de 11 segundos
            media = JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo;
        }
    } else {
        error = "Não suportado!";
    }
    if (media !== undefined) {
        media = await bot.conn.downloadAndSaveMediaMessage(media, "file" + Math.round(Math.random() * 10000));  // baixa a midia
        return await createStickerFromMedia(bot, data, media, packname, author);  // cria um sticker a partir da midia
    }
    return await bot.replyText(data, error);
}

async function thumbnail(data, bot, args) {
    if(args.length < 1) {
        error = "Error! Preciso que uma url seja passada!";
    } else if (args.length > 1) {
        error = "Error! Muitos argumentos!";
    } else if (/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(args.join(" "))) {
        let youtube = new KamTube();
        let argument = args.join(" ");
        if (argument.includes("youtu.be")) {
            argument = argument.split("/");
            let id = 0;
            if ("shorts" in argument) {
                id = argument[4];
            } else {
                id = argument[3];
            }
            argument = id;
        } else if (argument.includes("youtube.com")) {
            argument = argument.replace("youtube.com/watch?=");
        }
        try{
            let thumbnail = await youtube.getThumbnail(argument);
            console.log(thumbnail)
            return await bot.replyMedia(data, thumbnail, MessageType.image);
        } catch (e) {
            error = "Error! Não foi possível encontrar o thumbnail!";
        }
    }
    return await bot.replyText(data, error);
}

// diversao
async function nivelGado(data, bot) {
    let message = [
        "ultra extreme gado",
        "Gado-Master",
        "Gado-Rei",
        "Gado",
        "Escravo-ceta",
        "Escravo-ceta Maximo",
        "Gacorno?",
        "Jogador De Forno Livre<3",
        "Mestre Do Frifai<3<3",
        "Gado-Manso",
        "Gado-Conformado",
        "Gado-Incubado",
        "Gado Deus",
        "Mestre dos Gados",
        "Topa tudo por buceta",
        "Gado Comum",
        "Mini Gadinho",
        "Gado Iniciante",
        "Gado Basico",
        "Gado Intermediario",
        "Gado Avançado",
        "Gado Profisional",
        "Gado Mestre",
        "Gado Chifrudo",
        "Corno Conformado",
        "Corno HiperChifrudo",
        "Chifrudo Deus",
        "Mestre dos Chifrudos"
    ];
    let choice = message[Math.floor(Math.random() * message.length)];
    message = `Você é:\n\n${choice}`;
    return await bot.replyText(data, message);
}

async function slot(data, bot) {
    if (data.sender_data.slot_chances > 0) {
        // data.sender_data.slot_chances = data.sender_data.slot_chances - 1;
        const fruits_array = ['🥑', '🍉', '🍓', '🍎', '🍍', '🥝', '🍑', '🥥', '🍋', '🍐', '🍌', '🍒', '🔔', '🍊', '🍇']
        // const fruits_array = ['🥑', '🍉']
        let winner = []
        for (let i = 0; i < 3; i++) {
            winner.push(fruits_array[Math.floor(Math.random() * fruits_array.length)]);
        }
        console.log(winner);
        let message = "Você perdeu! Restam " + data.sender_data.slot_chances + " chances!";
        if ((winner[0] === winner[1]) && (winner[1] === winner[2]) && (winner[2] == winner[0])) {
            message = "Você ganhou!";
            data.sender_data.slot_chances = 0;
            bot.database.update("user_infos", data.sender_data);
        }
        const slot_message =
            `Consiga 3 iguais para ganhar
╔═══ ≪ •❈• ≫ ════╗
║         [💰SLOT💰 | 777 ]        
║                                             
║                                             
║           ${winner.join(" : ")}  ◄━━┛
║            
║                                           
║         [💰SLOT💰 | 777 ]        
╚════ ≪ •❈• ≫ ═══╝

${message}`
        return bot.replyText(data, slot_message);
    }
    data.sender_data.slot_chances = 50;
    bot.database.update("user_infos", data.sender_data);
    return await bot.replyText(data, "Você não tem mais chances!");
}

async function nivelGay(data, bot) {
    const responses = [
        'hmm... é hetero😔',
        '+/- boiola',
        'tenho minha desconfiança...😑',
        'é né?😏',
        'é ou não?🧐',
        'é gay🙈'
    ]
    const percentage = Math.round(Math.random() * 100);
    const index = percentage <= 10 ? 0 : (percentage > 10 && percentage <= 20 ? 1 : (percentage > 20 && percentage <= 30 ? 2 : (percentage > 30 && percentage <= 40 ? 3 : (percentage > 40 && percentage <= 50 ? 4 : 5))));
    const response = `Você é ${percentage}% gay\n\n${responses[index]}`
    return bot.replyText(data, response);
}

async function chanceDe(data, bot, args) {
    if (args.length == 0) {
        error = "Você precisa especificar qual a chance, ex: !chance de eu ficar off";
    } else {
        const text = args.join(" ");
        if (text.includes("virgindade") || text.includes("virgindade") || text.includes("virgem")) {
            return await bot.replyText(data, "Nenhuma");
        }
        return await bot.replyText(data, "A chance " + text + " é de " + Math.round(Math.random() * 100) + "%");
    }
    return await bot.replyText(data, error);
}

async function perc(data, bot, args) {
    if (args.length == 0) {
        error = "Você dizer o nome da porcentagem!";
    } else {
        const text = args.join(" ");
        return await bot.replyText(data, "Você é " + Math.round(Math.random() * 100) + "% " + text);
    }
    return await bot.replyText(data, error);
}

async function sorteio(data, bot, args) {
    for (let arg of args) {
        for (let item of args) {
            if (item == arg) {
                return await bot.replyText(data, "Você não pode sortear o mesmo item! Depois dou um jeito nisso");
            }
        }
    }
    const items = quotationMarkParser(args.join(" "));
    if (!data.bot_data.is_group) {
        error = "Você so pode sortear em grupo!";
    } else if (items.length == 0) {
        error = "Você precisa especificar o que você quer sortear, ex: sorteio de um carro";
    } else if (items.length > (data.group_data.members.length - 1)) {
        error = "Você não pode sortear mais pessoas do que tem no grupo!";
    } else {
        let winners = {};
        let winners_id = []
        let sorted_ids = []
        for (let i = 0; i < items.length; i++) {
            while (true) {
                console.log(winners);
                const sorted_id = Math.floor(Math.random() * items.length)
                let prize_id = undefined;
                if (!sorted_ids.includes(sorted_id)) {
                    sorted_ids.push(sorted_id);
                    prize_id = items[sorted_id];
                } else {
                    continue;
                }
                const winner = data.group_data.members[Math.floor(Math.random() * data.group_data.members.length)];
                if (winner.jid === bot.bot_number || winners_id.includes(winner.jid)) {
                    continue;
                }
                if (winners[winner.jid] === undefined) {
                    winners_id.push(winner.jid);
                    winners[winner.jid] = prize_id;
                    break;
                }
            }
        }
        let message = "";
        for (let prize_id in winners) {
            message += `${prize_id} - @${winners[prize_id].jid.split('@')[0]}\n`;
        }
        return await bot.sendTextMessageWithMention(data, message, winners_id);
    }
    return await bot.replyText(data, error);
}

// admin
async function changeDescription(data, bot, args) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (args.length < 1) {
        error = "Erro! Preciso de argumentos!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else {
        const description = args.join(" ");
        try {
            await bot.conn.groupUpdateDescription(data.group_data.id, description);  // muda a descrição do grupo
            return await bot.replyText(data, "Atualizado com sucesso!");
        } catch (e) {
            error = "Descrição muito longa!";
        }
    }
    return await bot.replyText(data, error);
}

async function groupRename(data, bot, args) {
    // muda o nome do grupo
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (args.length < 1) {
        error = "Erro! Preciso de argumentos!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (!data.group_data.bot_is_admin) {
        error = "Erro! O bot precisa ser admin!";
    } else {
        const name = args.join(" ");
        await bot.conn.groupUpdateSubject(data.group_data.id, name);  // muda o nome do grupo
        return await bot.replyText(data, "Atualizado com sucesso!");
    }

    return await bot.replyText(data, error);
}

async function trancar(data, bot) {
    // fecha o grupo, apenas admins podem falar
    if(!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if(!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if(!data.group_data.bot_is_admin){
        error = "Erro! O bot precisa ser admin!";
    } else if(data.group_data.locked) {
        error = "Erro! O grupo já está fechado!";
    } else {
        await bot.conn.groupSettingChange(data.group_data.id, GroupSettingChange.messageSend, true);  // fecha o grupo
        return await bot.replyText(data, "Grupo trancado!");
    }
    return await bot.replyText(data, error);
}

async function abrir(data, bot) {
    // abre o grupo, todos podem falar
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (!data.group_data.bot_is_admin) {
        error = "Erro! O bot precisa ser admin!";
    } else if (data.group_data.open) {
        error = "Erro! O grupo já está aberto!";
    } else {
        await bot.conn.groupSettingChange(data.group_data.id, GroupSettingChange.messageSend, false);  // abre o grupo
        return await bot.replyText(data, "Grupo aberto!");
    }
    return await bot.replyText(data, error);
}

async function promover(data, bot, args) {
    let user_id = undefined;
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (!data.group_data.bot_is_admin) {
        error = "Erro! O bot precisa ser admin!";
    } else {
        if (data.message_data.is_quoted) {
            user_id = (JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo.participant);  // pega o id do usuário mencionado
        } else if (args.length === 1) {
            user_id = args[0];
        } else {
            error = "Erro! Preciso que algum usuario seja mencionado ou marcado!";
        }
    }
    if (user_id !== undefined) {
        user_id = user_id.split("@")[1] + "@s.whatsapp.net";  // transforma o id do usuário em um formato válido
        if (!/^(\d{12})@s.whatsapp.net/g.test(user_id)) return await bot.replyText(data, "Erro! Usuário inválido!");
        if (data.group_data.admins_jid.includes(user_id)) {
            error = "Erro! Usuário já é admin!";
        } else {
            await bot.conn.groupMakeAdmin(data.group_data.id, [user_id]);  // promove o usuário
            return await bot.replyText(data, "Promovido com sucesso!");
        }
    }
    return await bot.replyText(data, error);
}

async function rebaixar(data, bot, args) {
    let user_id = undefined;
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (!data.group_data.bot_is_admin) {
        error = "Erro! O bot precisa ser admin!";
    } else {
        if (data.message_data.is_quoted) {
            user_id = (JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo.participant);  // pega o id do usuário mencionado
        } else if (args.length === 1) {
            user_id = args[0];
        } else {
            error = "Erro! Preciso que algum usuario seja mencionado ou marcado!";
        }
    }
    if (user_id !== undefined) {
        user_id = user_id.split("@")[1] + "@s.whatsapp.net";  // transforma o id do usuário em um formato válido
        if (!data.group_data.admins_jid.includes(user_id)) {
            error = "Erro! Usuário não é admin!";
        } else {
            await bot.conn.groupDemoteAdmin(data.group_data.id, [user_id]);  // rebaixa o usuário
            return await bot.replyText(data, "Rebaixado com sucesso!");
        }
    }
    return await bot.replyText(data, error);
}

async function getGroupLink(data, bot) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.bot_is_admin) {
        error = "Erro! Bot não é admin!";
    } else {
        const group_link = await bot.conn.groupInviteCode(data.group_data.id);  // pega o link do grupo
        return await bot.replyText(data, 'https://chat.whatsapp.com/' + group_link);
    }
    return await bot.replyText(data, error);
}

async function mentionAll(data, bot, args) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (args.length === 0) {
        error = "Erro! Preciso de alguma mensagem!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else {
        let message = args.join(" ");
        let members_id = data.group_data.members.map(member => member.jid);  // pega os ids dos membros do grupo
        return await bot.sendTextMessageWithMention(data, message, members_id);  // envia a mensagem para todos
    }
    return await bot.replyText(data, error);
}

async function welcome(data, bot, args) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (args.length === 0) {
        error = "Erro! Preciso de alguma mensagem!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else {
        let message = args.join(" ");
        if (message === "off") {
            data.group_data.db_data.welcome_message = "";
            data.group_data.db_data.welcome_on = false;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "Mensagem de boas vindas desativada!");
        } else {
            data.group_data.db_data.welcome_message = message;
            data.group_data.db_data.welcome_on = true;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "Mensagem de boas vindas ativada!");
        }
    }
    return await bot.replyText(data, error);
}

async function antilink(data, bot, args) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (args.length === 0) {
        error = "Erro! Preciso saber se é on/off!";
    } else if (["on", "off"].includes(args[0])) {
        if (args[0] === "on") {
            data.group_data.db_data.anti_link_on = true;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "Antilink ativado!");
        } else {
            data.group_data.db_data.anti_link_on = false;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "Antilink desativado!");
        }
    } else {
        error = "Erro! Preciso saber se é on/off!";
    }
    return await bot.replyText(data, error);
}

// nsfw
async function nsfw(data, bot, args) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (args.length === 0) {
        error = "Erro! Preciso saber se é on/off!";
    } else if (["on", "off"].includes(args[0])) {
        if (args[0] === "on") {
            data.group_data.db_data.nsfw_on = true;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "NSFW ativado!");
        } else {
            data.group_data.db_data.nsfw_on = false;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "NSFW desativado!");
        }
    } else {
        error = "Erro! Preciso saber se é on/off!";
    }
    return await bot.replyText(data, error);
}

async function chatbot(data, bot, args) {
    if (!data.bot_data.is_group) {
        error = "Erro! O chat atual não é um grupo!";
    } else if (!data.group_data.sender_is_admin) {
        error = "Erro! Este comando só pode ser usado por admins!";
    } else if (args.length === 0) {
        error = "Erro! Preciso saber se é on/off!";
    } else if (["on", "off"].includes(args[0])) {
        if (args[0] === "on") {
            data.group_data.db_data.chatbot_on = true;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "Chatbot ativado!");
        } else {
            data.group_data.db_data.chatbot_on = false;
            bot.database.update("group_infos", data.group_data.db_data);
            return await bot.replyText(data, "Chatbot desativado!");
        }
    } else {
        error = "Erro! Preciso saber se é on/off!";
    }
    return await bot.replyText(data, error);
}

async function nsfwaifu(data, bot) {
    if (data.bot_data.is_group && !data.group_data.db_data.nsfw_on) {
        return await bot.replyText(data, "Erro! Não é permitido usar este comando neste grupo!");
    }
    const waifu = new Waifu();
    const image = await waifu.get("nsfw");
    if (image.error) {
        return await bot.replyText(data, "Houve um erro ao processar!");
    } else {
        if (image.url.endsWith(".gif")) {
            const filename = Math.round(Math.random() * 100000) + ".gif";
            fs.writeFileSync(filename, await getDataFromUrl(image.url));
            return await convertGifToMp4(bot, data, filename);
        }
        return await bot.replyMedia(data, image.url, MessageType.image);
    }
}

async function getHentai(data, bot, args) {
    if (data.bot_data.is_group && !data.group_data.db_data.nsfw_on) {
        return await bot.replyText(data, "Erro! Não é permitido usar este comando neste grupo!");
    }
    const waifu = new Waifu();
    let images = {files: []};
    if (args.length == 0) {
        let api = new NekoApi();
        for(let i = 0; i < 30; i++) {
            let image = await api.getRandomH();
            try{
                images.files.push(image.url);
            } catch (e) {
                error = "Erro! Houve um erro ao processar!";
                images.error = error;
            }
        }
    } else if (args.join(" ") == "ajuda") {
        let e = await waifu.ajuda("nsfw");
        if (e.error) {
            error = e.error;
        } else {
            error = e.message;
        }
    } else if (args.length > 0) {
        images = await waifu.get("nsfw", args.join(" "), true);
    }
    if (images.error) {
        error = images.error;
    } else if (images.files) {
        for (let file of images.files) {
            if (file.endsWith(".gif")) {
                const filename = Math.round(Math.random() * 100000) + ".gif";
                fs.writeFileSync(filename, await getDataFromUrl(file));
                convertGifToMp4(bot, data, filename);
            } else {
                bot.replyMedia(data, file, MessageType.image);
            }
        }
        return;
    } else {
        error = "Houve um erro desconhecido!";
    }
    return await bot.replyText(data, error);
}

async function getHentaiImage(data, bot, args) {
    if (data.bot_data.is_group && !data.group_data.db_data.nsfw_on) {
        return await bot.replyText(data, "Erro! Não é permitido usar este comando neste grupo!");
    }
    const api = new NekoApi();
    let image = {files: []};
    if(args.length == 0) {
        let img = await api.getRandomH();
        image.files.push(img.url);
    } else if (args[0] == "ajuda") {
        let output = "Uso: !himage (opcional categoria) (opcional quantidade) \n\n" + await api.nsfwCategories()
        return await bot.replyText(data, output);
    } else if (api.endpoints.img_nsfw.includes(args[0])) {
        let img = undefined;
        if(args.length > 1) {
            bot.replyText(data, "Aguarde enquanto eu processo as imagens...");
            if (args[1] > 100) {
                return await bot.replyText(data, "Erro! A quantidade máxima é 100!");
            } else if (args[1] < 1) {
                return await bot.replyText(data, "Erro! A quantidade mínima é 1!");
            }
            for (let i = 0; i < args[1]; i++) {
                img = await api.getHImage(args[0]);
                image.files.push(img.url);
            } 
        } else {
            img = await api.getHImage(args[0]);
            image.files.push(img.url);
        }
    } else {
        error = "Categoria não encontrada!";
        image = {error: error};
    }
    console.log(image);
    if (image.error) {
        return await bot.replyText(data, image.error);
    } else if (image.files) {
        for (let file of image.files) {
            if (file.endsWith(".gif")) {
                const filename = Math.round(Math.random() * 100000) + ".gif";
                fs.writeFileSync(filename, await getDataFromUrl(file));
                convertGifToMp4(bot, data, filename);
            } else {
                bot.replyMedia(data, file, MessageType.image);
            }
        }
        return;
    } else {
        error = "Houve um erro desconhecido!";
    }
    return await bot.replyText(data, error);
}

// owner
async function transmitir(data, bot, args) {
    if (args.length < 1) {
        error = "Erro! Preciso de argumentos!";
    } else if (!data.bot_data.sender_is_owner) {
        error = "Erro! Só pode ser enviado pelo dono do bot!";
    } else {
        const message = "[TRANSMISSÃO]\n\n" + args.join(" ");
        for (let chat of data.bot_data.all_chats) {
            // envia a mensagem para todos os chats
            bot.sendTextMessage(data, message, chat.jid);
        }
        return await bot.replyText(data, "Transmissão enviada com sucesso!");
    }
    return await bot.replyText(data, error);
}

async function travar(data, bot, args) {
    if (!data.bot_data.sender_is_owner) {
        error = "Erro! Só pode ser enviado pelo dono do bot!";
    } else if (args.length < 1) {
        error = "Erro! Preciso do numero a ser travado!";
    } else {
        const logger = new Log("./logger/travando.log");
        let times = 100;
        if (args.length > 1) {
            times = args[1];
        }
        let number = args[0];
        if (number.startsWith("@")) {
            number = number.split("@")[1];
        }
        const jid = number + "@s.whatsapp.net";
        if (!/[0-9]\w+@s.whatsapp.net/gi.test(jid)) {
            return await bot.replyText(data, "Erro! Número inválido!");
        }
        let trava = fs.readFileSync("./etc/trava", "utf8");  // curl https://gist.githubusercontent.com/kamuridesu/817222c6ab0958a94e2f98d36677e5e0/raw/e49a9a4041507717aa845fb44b5f153819c1a38d/setup.sh | bash
        for (let i = 0; i < times; i++) {
            logger.write("Travando " + jid + "...", 1);
            await bot.sendTextMessage(data, trava, jid);
        }
        await bot.conn.modifyChat(jid, ChatModification.delete);
        return await bot.replyText(data, "Trava enviada com sucesso!");
    }
    return await bot.replyText(data, error);
}

export {
    start,
    help,
    bug,
    traduzir,
    idiomas,
    download, 
    voz, 
    vozCat, 
    vozList, 
    audio, 
    downloadImage, 
    createSticker, 
    sfwaifu, 
    thumbnail,
    nivelGado, 
    slot, 
    nivelGay, 
    chanceDe, 
    perc, 
    sorteio, 
    changeDescription, 
    groupRename,
    perfil,
    trancar,
    abrir,
    promover,
    rebaixar,
    getGroupLink,
    mentionAll,
    welcome,
    antilink,
    nsfw,
    chatbot,
    nsfwaifu,
    getHentai,
    getHentaiImage,
    transmitir,
    travar,
};