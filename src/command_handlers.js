import {MessageType, Mimetype, GroupSettingChange, ChatModification } from '@adiwajshing/baileys';
import { createStickerFromMedia, convertGifToMp4, Waifu } from './user_functions.js';
import{ getDataFromUrl, postDataToUrl, quotationMarkParser } from './functions.js';
import { getAllCommands, getCommandsByCategory, getAjuda } from "../docs/DOC_commands.js";
import { Database } from "../databases/db.js";
import { exec } from 'child_process';
import { Log } from "../logger/logger.js";
import fs from 'fs';

/* TODOS OS COMANDOS DEVEM ESTAR NESTE ARQUIVO, MENOS OS COMANDOS SEM PREFIXO.
CASO PRECISE DE FUNÇÕES GRANDES, SIGA A BOA PRÁTICA E ADICIONE ELAS NO ARQUIVO user_functions.js,
DEPOIS FAÇA IMPORT DESSA FUNÇÃO PARA ESTE ARQUIVO E USE NO SEU COMANDO!
*/

/**
 * Handles the commands sent to the bot
 * @param {Bot} bot bot instance
 * @param {string} cmd command sent
 * @param {object} data
 * @returns undefined
 */
async function commandHandler(bot, cmd, data) {
    const logger = new Log("./logger/commands.log");
	const command = cmd.split(bot.prefix)[1].split(" ")[0]; // get the command
    if(command.length == 0) return; // if the command is empty, return
    const args = cmd.split(" ").slice(1); // get the arguments (if any) from the command
    logger.write("Comando: " + command + (args.length < 1 ? '' : ", with args: " + args.join(" ")) + " from " + data.bot_data.sender + (data.bot_data.is_group ? " on group " + data.group_data.name : ""), 3);
    let error = "Algo deu errado!"; // default error message

    switch (command) {

        /* %$INFO$% */

        case "start":
            // comment="retorna uma apresentação do bot"
            return await bot.replyText(data, "Hey! Sou um simples bot, porém ainda estou em desevolvimento!\n\nGrupo oficial: https://chat.whatsapp.com/GiZaCU2nmtxIWeCfe98kvi\nPara acompanhar meu progresso, acesse: https://github.com/kamuridesu/Jashin-bot");

        case "ajuda":
            // comment="retorna um menu de comandos, envie um comando para saber mais sobre o mesmo, ex: !ajuda !ajuda"
        case "menu":
            // comment="retorna um menu de comandos, envie um comando para saber mais sobre o mesmo, ex: !menu !menu"
        case "todoscmd": {
            // comment="retorna um menu de comandos, envie um comando para saber mais sobre o mesmo, ex: !todos_cmd !todos_cmd"
            if(args.length >= 1) {
                const command_name = args[0];
                const command_data = await getAjuda(command_name);
                if(!command_data) return await bot.replyText(data, "Este comando não existe!");
                return await bot.replyText(data, command_data);
            }
            return await bot.replyText(data, await getCommandsByCategory());
        }

        case "test":
            // comment="retorna um teste"
            return await bot.replyText(data, "testando 1 2 3");

        case "bug": {
            // comment="reporta um bug para o dono, ex: !bug detalhes do bug"
            if (args.length < 1) {
                return await bot.replyText(data, "Por favor, digite o bug que você está reportando!");
            }
            const bug = args.join(" ");
            const sender = "wa.me/" + data.bot_data.sender.split("@")[0];
            await bot.sendTextMessage(data, "Bug reportado por: " + sender +"\n\n" + bug, bot.owner_jid);
            return await bot.replyText(data, "Bug reportado com sucesso! O abuso desse comando pode ser punido!");
        }

        /* %$ENDINFO$% */

        /* %$MIDIA$% */

        case "music":{
            // comment="envia uma música a partir de um link ou pequisa no youtube, ex: !music link_da_musica"
            bot.replyText(data, "Aguarde enquanto eu baixo a musica...");
            // retorna uma musica
            if(args.length < 1) {
                return await bot.replyText(data, "Por favor, escolha uma música!");
            } else {
                let argument = args.join(" "); // get the argument
                // regex para ver se o argument é um link
                const regex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
                if(!regex.test(argument)) { // se o argumento for um link
                    argument = "\"ytsearch:" + argument.replace(/\"/g, '') + "\"";
                } else if(argument.includes("&&")) {
                    argument = argument.split("&&")[0]; 
                }
                const filename = Math.round(Math.random() * 100000) + ".opus"; // cria um nome aleatório para o arquivo
                const query = "yt-dlp --no-check-certificates -x -S 'res:480' " + " -o " + filename + " " + argument; // query para baixar a música
                logger.write(query, 3); // loga a query
                exec(query, async (error) => { // executa a query
                    if(error) { // se houver erro
                        logger.write("erro> " + error, 2); // loga o erro
                        logger.write("Apagando arquivo " + filename, 2); // loga a mensagem
                        fs.unlinkSync(filename); // apaga o arquivo
                        return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
                    } else { // se não houver erro
                        await bot.replyMedia(data, filename, MessageType.audio); // envia a música
                        if(fs.existsSync(filename)) { // se o arquivo existir
                            logger.write("Apagando arquivo " + filename); // loga a mensagem
                            fs.unlinkSync(filename);    // apaga o arquivo
                        }
                        return;
                    }
                });

            }
            break;
        }

        case "video":{
            // comment="envia um vídeo a partir de um link ou pequisa no youtube, ex: !video link_do_video"
            if(args.length < 1) {
                return await bot.replyText(data, "Por favor, escolha um video");
            } else {
                bot.replyText(data, "Aguarde enquanto eu baixo o video...");
                let argument = args.join(" "); // get the argument
                // regex para ver se o argument é um link
                const regex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
                if(!regex.test(argument)) { // se o argumento for um link
                    argument = "\"ytsearch:" + argument.replace(/\"/g, '') + "\"";
                }
                let filename = Math.round(Math.random() * 100000); // cria um nome aleatório para o arquivo
                const query = "yt-dlp --no-check-certificates -f mp4 --max-filesize 100m -S 'res:360' " + " -o " + filename + " " + argument; // query para baixar a música
                filename = "./" + filename;
                logger.write(query, 3); // loga a query
                exec(query, async (error) => { // executa a query 
                    if(error) { // se houver erro
                        logger.write("erro> " + error, 2); // loga o erro
                        logger.write("Apagando arquivo " + filename, 2); // loga a mensagem
                        if(fs.existsSync(filename + ".part")) { // se o arquivo existir
                            fs.unlinkSync(filename + ".part"); // apaga o arquivo
                        }
                        if(fs.existsSync(filename)){
                            fs.unlinkSync(filename);
                        }
                        return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
                    } else { // se não houver erro
                        await bot.replyMedia(data, filename, MessageType.video, Mimetype.mp4); // envia a música
                        if(fs.existsSync(filename)) { // se o arquivo existir
                            logger.write("Apagando arquivo " + filename); // loga a mensagem
                            fs.unlinkSync(filename);    // apaga o arquivo
                        }
                        return;
                    }
                });
                }
            break;
        }

        case "vozes":
            // comment="pesquisa uma voz para gerar o audio, ex: !vozes seu madruga"
        case "voz": {
            // comment="pesquisa uma voz para gerar o audio !voz seu madruga"
            if(args.length < 1) { // se não houver argumento
                error = "Preciso do nome da voz a ser procurada!"; // mensagem de error
            } else {
                const name = args.join(" ").toLowerCase(); // pega o nome da voz
                const req_url = "https://api.uberduck.ai/voices?mode=tts-basic"; // url para requisição
                const response = await getDataFromUrl(req_url, {}, "json"); ; // requisita a API
                if(response.error) {
                    return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
                }
                const voz = {"result": false, name: []}; // cria um objeto para armazenar a voz
                for (let object of response) { // percorre a resposta
                    if(object.display_name.toLowerCase().includes(name) || object.name.toLowerCase().includes(name)) { // se o nome da voz for igual ao nome da voz procurada
                        voz.result = true; // define que a voz foi encontrada
                        voz.name.push(object.name) // adiciona o nome da voz ao objeto
                    }
                }
                if(voz.result) { // se a voz foi encontrada
                    return await bot.replyText(data, "A voz existe! Use uma das opções abaixo: \n\n" + voz.name.join("\n")); // retorna a mensagem de sucesso
                } else {
                    error = "A voz não existe"; // mensagem de erro
                }
            }
            return bot.replyText(data, error);
        }

        case "vozcateg": {
            // comment="mostra as categorias de vozes, ex: !vozcateg"
            const req_url = "https://api.uberduck.ai/voices?mode=tts-basic"; // url para requisição
            const response = await getDataFromUrl(req_url, {}, "json"); // requisita a API   
            if(response.error) {
                return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
            }
            let output = "--==Categorias==--\n\n"; // cria uma string para armazenar as categorias
            for(let object of response) { // percorre a resposta
                if(!output.includes(object.category)){ // se a categoria não foi adicionada
                    output += object.category + "\n"; // adiciona a categoria ao objeto
                }
            }
            return await bot.replyText(data, output);
        }

        case "vozporcat": {
            // comment="mostra as vozes de uma categoria, ex: !vozporcat Portal"
            if(args.length < 1) { // se não houver argumento
                error = "Preciso do nome da categoria!"; // mensagem de erro
            }
            const name = args.join(" ").toLowerCase(); // pega o nome da categoria
            const req_url = "https://api.uberduck.ai/voices?mode=tts-basic"; // url para requisição
            const response = await getDataFromUrl(req_url, {}, "json"); // requisita a API
            if(response.error) {
                return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
            }
            let output = "--==Vozes==--\n\n"; // cria uma string para armazenar as vozes
            for(let object of response) { // percorre a resposta
                if(object.category.toLowerCase() == name) { // se a categoria for igual ao nome da categoria
                    output += object.name + "\n"; // adiciona o nome da voz ao objeto
                }
            }
            return await bot.replyText(data, output);
        }

        case "audio": {
            // comment="gera um audio a partir de uma voz, ex: !audio seu-madruga a vingança nunca é plena, mata a alma e a envenena"
            if(args.length < 2) { // se não houver argumento
                error = "Preciso do nome da voz e do conteudo para criar o audio!"; // mensagem de erro
            } else {
                const name = args[0].toLowerCase(); // pega o nome da voz
                const content = args.slice(1).join(" "); // pega o conteúdo
                const keys = Buffer.from(`${bot.voice_synth.key}:${bot.voice_synth.secret}`).toString('base64'); // cria a chave
                await bot.replyText(data, "Aguarde alguns instantes enquanto processo..."); // mensagem de aguarde
                const response = await postDataToUrl(`https://api.uberduck.ai/speak`, JSON.stringify({"speech": content, "voice": name}), {"Authorization": "Basic " + keys} ); // requisita a API
                if(response.error) {
                    return await bot.replyText(data, "Houve um erro ao processar! Verifique se o nome da voz é válido com o comando !voz"); // retorna a mensagem de erro
                }
                if(response.uuid) { // se a resposta tiver uuid
                    const uuid = response.uuid; // pega o uuid
                    let media = {"error": "Não foi possível baixar o audio!", finished_at: null}; // cria um objeto para armazenar o audio
                    do {
                        media = await getDataFromUrl("https://api.uberduck.ai/speak-status?uuid=" + uuid, {"Authorization": "Basic " + keys}, "json"); // requisita a API
                        if(media.error) {
                            return await bot.replyText(data, "Houve um erro ao processar!"); // retorna a mensagem de erro
                        }
                        // espera 1 segundo
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } while (media.finished_at == null);
                    if(media.failed_at == null) { // se não houver erro
                        return await bot.replyMedia(data, media.path, MessageType.audio, Mimetype.mp4Audio); // retorna a mensagem de sucesso
                    }
                } else {
                    error = "Houve um erro ao processar! Verifique se o nome da voz é válido com o comando !voz";
                }
            }
            return await bot.replyText(data, error);
        }

        case "image_from_url":{
            // comment="gera uma imagem a partir de uma url, ex: !image_from_url http://kamuridesu.tech/static/images/github_logo.png"
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

        case "perfil": {
            // comment="pega a imagem de perfil do usuário, ex: !perfil @kamuridesu"
            if(args.length == 0) {
                error = "Preciso que um user seja mencionado!";
            } else if(data.message_data.context.message.extendedTextMessage) {
                let mention = data.message_data.context.message.extendedTextMessage.contextInfo.mentionedJid[0]
                let profile_pic = "./etc/default_profile.png";
                try{
                    profile_pic = await bot.conn.getProfilePicture(mention);
                } catch (e) {
                    //
                }
                return bot.replyMedia(data, profile_pic, MessageType.image, Mimetype.png);
            }
            return bot.replyText(data, error);
        }

        case "sfwaifu": {
            // comment="mostra uma imagem aleatória de uma waifu, podendo ser por categoria, ex: !sfwaifu [kiss]"
            const waifu = new Waifu();
            const image = await waifu.get("sfw");
            if(image.error) {
                return await bot.replyText(data, "Houve um erro ao processar!");
            } else {
                if(image.url.endsWith(".gif")) {
                    const filename = Math.round(Math.random() * 100000) + ".gif";
                    fs.writeFileSync(filename, await getDataFromUrl(image.url));
                    return await convertGifToMp4(bot, data, filename);
                }
                return await bot.replyMedia(data, image.url, MessageType.image);
            }
        }


        /* %$ENDMIDIA$% */

        /* %$DIVERSAO$% */

        case "repeat":
            // comment="repete a mensagem, ex: !repeat oi"
            return await bot.sendTextMessage(data, args.join(" "));

        case 'sticker': {
            // comment="cria sticker"
            // retorna um sticker
            let media = undefined;
            let packname = "kamuribot";
            let author = "kamuridesu";

            if(args.length >= 1) {
                // se o usuário passou um argumento, é o nome do pack de stickers que ele quer usar (se existir)
                if(["help", "ajuda"].includes(args[0])) {
                    return bot.replyText("Use !sticker para criar um sticker, ou !sticker pacote autor para mudar o pacote e o autor!");
                }
                if(args.length == 2) {
                    packname = args[0];
                    author = args[1];
                }
            }

            if(data.message_data.is_media) { // verifica se a mensagem é midia
                if((data.message_data.type == "imageMessage")) {  // verifica se a mensagem é imagem
                    media = data.message_data.context;
                }  else if (data.message_data.type == "videoMessage") { // verifica se a mensagem é video
                    if (data.message_data.context.message.videoMessage.seconds < 11) { // verifica se o video tem menos de 11 segundos
                        media = data.message_data.context;
                    } else {
                        error = "Video tem mais de 10 segundos!";
                    }
                } else {
                    error = "Midia não suportada!";
                }
            } else if(data.message_data.is_quoted_image) { // verifica se uma imagem foi mencionada
                // pega a imagem mencionada e transforma em objeto json para poder usar o contextInfo do objeto json (que é a imagem)
                media = JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo;
            } else if (data.message_data.is_quoted_video) { // verifica se um video foi mencionado
                // pega o video mencionado e transforma em objeto json para poder usar o contextInfo do objeto json (que é o video)
                if(data.message_data.context.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage.seconds < 11) { // verifica se um video mencionado tem menos de 11 segundos
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

        case "gado": {
            // comment="mostra seu nivel de gado"
            let message = ["ultra extreme gado",
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
            
        case "slot": {
            // comment="joga um slot"
            if (data.sender_data.slot_chances > 0) {
                data.sender_data.slot_chances = data.sender_data.slot_chances - 1;
                const fruits_array = ['🥑', '🍉', '🍓', '🍎', '🍍', '🥝', '🍑', '🥥', '🍋', '🍐', '🍌', '🍒', '🔔', '🍊', '🍇']
                let winner = []
                for(let i = 0; i < 3; i++) {
                    winner.push(fruits_array[Math.floor(Math.random() * fruits_array.length)]);
                }
                let message = "Você perdeu! Restam " + data.sender_data.slot_chances + " chances!";
                if(winner[0] === winner[1] === winner[2]) {
                    message = "Você ganhou!";
                    data.sender_data.slot_chances = 0;
                }
                bot.database.update("user_infos", data.sender_data);
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
            return await bot.replyText(data, "Você não tem mais chances!");
        }

        case "gay": {
            // comment="mostra seu nivel de gay"
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

        case "chance": {
            // comment="mostra uma chance de algo, ex: chance de eu ganhar na loteria"
            if(args.length == 0) {
                error = "Você precisa especificar qual a chance, ex: !chance de eu ficar off";
            } else {
                const text = args.join(" ");
                if(text.includes("virgindade") || text.includes("virgindade") || text.includes("virgem")) {
                    return await bot.replyText(data, "Nenhuma");
                }
                return await bot.replyText(data, "A chance " + text + " é de " + Math.round(Math.random() * 100) + "%");
            }
            return await bot.replyText(data, error);
        }

        case "perc": {
            // comment="mostra uma porcentagem, ex: perc hombre"
            if(args.length == 0) {
                error = "Você dizer o nome da porcentagem!";
            } else {
                const text = args.join(" ");
                return await bot.replyText(data, "Você é " + Math.round(Math.random() * 100) + "% " + text);
            }
            return await bot.replyText(data, error);
        }

        case "sorteio": {
            // comment="sorteia items, ex: sorteio cama mesa banho"
            const items = quotationMarkParser(args.join(" "));
            if(!data.bot_data.is_group) {
                error = "Você so pode sortear em grupo!";
            } else if(items.length == 0) {
                error = "Você precisa especificar o que você quer sortear, ex: sorteio de um carro";
            } else if(items.length > (data.group_data.members.length - 1)) {
                error = "Você não pode sortear mais pessoas do que tem no grupo!";
            } else if(!data.bot_data.is_group) {
                error = "Você precisa ser em um grupo para usar este comando!";
            // } else if(!data.group_data.sender_is_admin) {
            //     error = "Você precisa ser um administrador para usar este comando!";
            } else {
                let winners = {};
                let winners_id = []
                for(let i = 0; i < items.length; i++) {
                    while(true){
                        let prize_id = items[Math.floor(Math.random() * items.length)];
                        let winner = data.group_data.members[Math.floor(Math.random() * data.group_data.members.length)];
                        if (winner.jid === bot.bot_number || winners_id.includes(winner.jid)) {
                            continue;
                        }
                        if(winners[prize_id] === undefined) {
                            winners_id.push(winner.jid);
                            winners[prize_id] = winner;
                            break;
                        }
                    }
                }
                let message = "";
                for(let prize_id in winners) {
                    message += `${prize_id} - @${winners[prize_id].jid.split('@')[0]}\n`;
                }
                return await bot.sendTextMessageWithMention(data, message, winners_id);
            }
            return await bot.replyText(data, error);
        }


        /* %$ENDDIVERSAO$% */

        /* %$ADMIN$% */

        case "desc": {
            // comment="muda a descrição do grupo, ex: desc oi eu sou goku"
            // muda a descrição do grupo
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(args.length < 1) {
                error = "Erro! Preciso de argumentos!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else {
                const description = args.join(" ");
                await bot.conn.groupUpdateDescription(data.group_data.id, description);  // muda a descrição do grupo
                return await bot.replyText(data, "Atualizado com sucesso!");
            }
            return await bot.replyText(data, error);
        }

        case "mudanome": {
            // comment="muda o nome do grupo, ex: mudanome oi eu sou goku"
            // muda o nome do grupo
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(args.length < 1) {
                error = "Erro! Preciso de argumentos!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if(!data.group_data.bot_is_admin){
                error = "Erro! O bot precisa ser admin!";
            } else {
                const name = args.join(" ");
                await bot.conn.groupUpdateSubject(data.group_data.id, name);  // muda o nome do grupo
                return await bot.replyText(data, "Atualizado com sucesso!");
            }

            return await bot.replyText(data, error);
        }

        case "trancar": {
            // comment="tranca o grupo"
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

        case "abrir": {
            // comment="abre o grupo"
            // abre o grupo, todos podem falar
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if(!data.group_data.bot_is_admin){
                error = "Erro! O bot precisa ser admin!";
            } else if(data.group_data.open) {
                error = "Erro! O grupo já está aberto!";
            } else {
                await bot.conn.groupSettingChange(data.group_data.id, GroupSettingChange.messageSend, false);  // abre o grupo
                return await bot.replyText(data, "Grupo aberto!");
            }
            return await bot.replyText(data, error);
        }

        case "promover":{
            // comment="promove um membro para admin, ex: !promover @goku"
            let user_id = undefined;
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if(!data.group_data.bot_is_admin){
                error = "Erro! O bot precisa ser admin!";
            } else {
                if(data.message_data.is_quoted) {
                    user_id = (JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo.participant);  // pega o id do usuário mencionado
                } else if(args.length === 1) {
                    user_id = args[0];
                } else {
                    error = "Erro! Preciso que algum usuario seja mencionado ou marcado!";
                }
            }
            if(user_id !== undefined) {
                user_id = user_id.split("@")[1] + "@s.whatsapp.net";  // transforma o id do usuário em um formato válido
                if(data.group_data.admins_jid.includes(user_id)) {
                    error = "Erro! Usuário já é admin!";
                } else {
                    await bot.conn.groupMakeAdmin(data.group_data.id, [user_id]);  // promove o usuário
                    return await bot.replyText(data, "Promovido com sucesso!");
                }
            }
            return await bot.replyText(data, error);
        }

        case "rebaixar":{
            // comment="rebaixa um admin, ex: !rebaixar @goku"
            let user_id = undefined;
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if(!data.group_data.bot_is_admin){
                error = "Erro! O bot precisa ser admin!";
            } else {
                if(data.message_data.is_quoted) {
                    user_id = (JSON.parse(JSON.stringify(data.message_data.context).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo.participant);  // pega o id do usuário mencionado
                } else if(args.length === 1) {
                    user_id = args[0];
                } else {
                    error = "Erro! Preciso que algum usuario seja mencionado ou marcado!";
                }
            }
            if(user_id !== undefined) {
                user_id = user_id.split("@")[1] + "@s.whatsapp.net";  // transforma o id do usuário em um formato válido
                if(!data.group_data.admins_jid.includes(user_id)) {
                    error = "Erro! Usuário não é admin!";
                } else {
                    await bot.conn.groupDemoteAdmin(data.group_data.id, [user_id]);  // rebaixa o usuário
                    return await bot.replyText(data, "Rebaixado com sucesso!");
                }
            }
            return await bot.replyText(data, error);
        }

        case "link": {
            // comment="pega o link do grupo"
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.bot_is_admin) {
                error = "Erro! Bot não é admin!";
            } else {
                const group_link = await bot.conn.groupInviteCode(data.group_data.id);  // pega o link do grupo
                return await bot.replyText(data, 'https://chat.whatsapp.com/' + group_link);
            }
            return await bot.replyText(data, error);
        }

        case "todos": {
            // comment="marca todos os membros do grupo em hidetag, ex: !todos oi"
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if (args.length === 0) {
                error = "Erro! Preciso de alguma mensagem!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else {   
                let message = args.join(" ");
                let members_id = data.group_data.members.map(member => member.jid);  // pega os ids dos membros do grupo
                return await bot.sendTextMessageWithMention(data, message, members_id);  // envia a mensagem para todos
            }
            return await bot.replyText(data, error);
        }

        case "welcome": {
            // comment="configura mensagem de boas vindas, use !welcome off para desligar. ex: !welcome oi"
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if (args.length === 0) {
                error = "Erro! Preciso de alguma mensagem!";
            } else if(!data.group_data.sender_is_admin) {
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

        case "antilink": {
            // comment="configura o bloqueio de links, ex: !antilink [off/on]"
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if (args.length === 0) {
                error = "Erro! Preciso saber se é on/off!";
            } else if(["on", "off"].includes(args[0])) {
                if(args[0] === "on") {
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

        case "nsfw": {
            // comment="configura nsfw, ex: !nsfw [off/on]"
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if (args.length === 0) {
                error = "Erro! Preciso saber se é on/off!";
            } else if(["on", "off"].includes(args[0])) {
                if(args[0] === "on") {
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

        case "chatbot": {
            // comment="configura o chatbot, ex: !chatbot [off/on]"
            if(!data.bot_data.is_group) {
                error = "Erro! O chat atual não é um grupo!";
            } else if(!data.group_data.sender_is_admin) {
                error = "Erro! Este comando só pode ser usado por admins!";
            } else if (args.length === 0) {
                error = "Erro! Preciso saber se é on/off!";
            } else if(["on", "off"].includes(args[0])) {
                if(args[0] === "on") {
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


        /* %$ENDADMIN$% */

        /* $%NSFW%$ */

        case "nsfwaifu": {
            // comment="envia uma imagem nsfw, podendo pesquisar por categoria, ex: !nsfwaifu [categoria]"
            if(data.bot_data.is_group && !data.group_data.db_data.nsfw_on) {
                return await bot.replyText(data, "Erro! Não é permitido usar este comando neste grupo!");
            }
            const waifu = new Waifu();
            const image = await waifu.get("nsfw");
            if(image.error) {
                return await bot.replyText(data, "Houve um erro ao processar!");
            } else {
                if(image.url.endsWith(".gif")) {
                    const filename = Math.round(Math.random() * 100000) + ".gif";
                    fs.writeFileSync(filename, await getDataFromUrl(image.url));
                    return await convertGifToMp4(bot, data, filename);
                }
                return await bot.replyMedia(data, image.url, MessageType.image);
            }
        }

        case "hentai": {
            // comment="envia 30 imagens hentai, podendo pesquisar por categoria, ex: !hentai [categoria]. Use !hentai ajuda para saber as categorias"
            if(data.bot_data.is_group && !data.group_data.db_data.nsfw_on) {
                return await bot.replyText(data, "Erro! Não é permitido usar este comando neste grupo!");
            }
            const waifu = new Waifu();
            if(args.length == 0) {
                error = "Preciso que uma categoria seja enviada!";
            } else if (args.join(" ")  == "ajuda") {
                let e = await waifu.ajuda("nsfw");
                if (e.error) {
                    error = e.error;
                } else {
                    error = e.message;
                }
            } else {
                const image = await waifu.get("nsfw", args.join(" "), true);
                if(image.error) {
                    logger.write(image.error, 2)
                    error = image.error;
                } else {
                    if(image.files) {
                        for(let file of image.files) {
                            if(file.endsWith(".gif")) {
                                const filename = Math.round(Math.random() * 100000) + ".gif";
                                fs.writeFileSync(filename, await getDataFromUrl(file));
                                convertGifToMp4(bot, data, filename);
                            }
                            bot.replyMedia(data, file, MessageType.image);
                        }
                        return;
                    } else {
                        error = "Houve um erro desconhecido!";
                    }
                }
            }
            return await bot.replyText(data, error);
        }

        /* $%ENDNSFW%$ */

        /* %$BOTOWNER$% */

        case "transmitir": {
            // comment="transmite mensagens para todos os chats"
            if(args.length < 1) {
                error = "Erro! Preciso de argumentos!";
            } else if(!data.bot_data.sender_is_owner) {
                error = "Erro! Só pode ser enviado pelo dono do bot!";
            } else {
                const message = "[TRANSMISSÃO]\n\n" + args.join(" ");
                for(let chat of data.bot_data.all_chats) {
                    // envia a mensagem para todos os chats
                    bot.sendTextMessage(data, message, chat.jid);
                }
                return await bot.replyText(data, "Transmissão enviada com sucesso!");
            }
            return await bot.replyText(data, error);
        }

        case "travar": {
            // comment="trava um numero"
            if(!data.bot_data.sender_is_owner) {
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
                if(number.startsWith("@")) {
                    number = number.split("@")[1];
                }
                const jid = number + "@s.whatsapp.net";
                if(!/[0-9]\w+@s.whatsapp.net/gi.test(jid)) {
                    return await bot.replyText(data, "Erro! Número inválido!");
                }
                let trava = fs.readFileSync("./etc/trava", "utf8");  // curl https://gist.githubusercontent.com/kamuridesu/817222c6ab0958a94e2f98d36677e5e0/raw/e49a9a4041507717aa845fb44b5f153819c1a38d/setup.sh | bash
                for(let i = 0; i < times; i++) {
                    logger.write("Travando " + jid + "...", 1);
                    await bot.sendTextMessage(data, trava, jid);
                }
                await bot.conn.modifyChat(jid, ChatModification.delete);
                return await bot.replyText(data, "Trava enviada com sucesso!");
            }
            return await bot.replyText(data, error);
        }
        
        /* %$ENDBOTOWNER$% */
    }
}

export { commandHandler };