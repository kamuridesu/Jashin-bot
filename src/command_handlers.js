/* eslint-disable no-fallthrough */
import * as commands from './user_commands.js';
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
    const command = cmd.split(bot.prefix)[1].split(" ")[0].toLowerCase(); // get the command
    if (command.length == 0) return; // if the command is empty, return
    const args = cmd.split(" ").slice(1); // get the arguments (if any) from the command
    logger.write("Comando: " + command + (args.length < 1 ? '' : ", with args: " + args.join(" ")) + " from " + data.bot_data.sender + (data.bot_data.is_group ? " on group " + data.group_data.name : ""), 3);
    const routes_object = JSON.parse(fs.readFileSync("./common_conf/routes.json"));

    switch (command) {

        /* %$INFO$% */

        case "start":
            // comment="retorna uma apresentação do bot"
            return await commands.start(data, bot);

        case "ajuda":
        // comment="retorna um menu de comandos, envie um comando para saber mais sobre o mesmo, ex: !ajuda !ajuda"
        case "menu":
        // comment="retorna um menu de comandos, envie um comando para saber mais sobre o mesmo, ex: !menu !menu"
        case "todoscmd": {
            // comment="retorna um menu de comandos, envie um comando para saber mais sobre o mesmo, ex: !todos_cmd !todos_cmd"
            return await commands.help(data, bot, args);
        }

        case "test":
            // comment="retorna um teste"
            return await bot.replyText(data, "testando 1 2 3");

        case "bug": {
            // comment="reporta um bug para o dono, ex: !bug detalhes do bug"
            return await commands.bug(data, bot, args);
        }

        case "traduzir": {
            // comment="traduz um texto para outro idioma, ex: !traduzir pt texto"
            return await commands.traduzir(data, bot, args, routes_object);
        }

        case "idiomas":
        case "linguagens": {
            // comment="retorna uma lista de idiomas disponíveis"
            return await commands.idiomas(data, bot, routes_object);
        }


        /* %$ENDINFO$% */

        /* %$MIDIA$% */

        case "music": {
            // comment="envia uma música a partir de um link ou pequisa no youtube, ex: !music link_da_musica"
            return await commands.music(data, bot, args);
        }

        case "video": {
            // comment="envia um vídeo a partir de um link ou pequisa no youtube, ex: !video link_do_video"
            return await commands.video(data, bot, args);
        }

        case "vozes":
        // comment="pesquisa uma voz para gerar o audio, ex: !vozes seu madruga"
        case "voz": {
            // comment="pesquisa uma voz para gerar o audio !voz seu madruga"
            return await commands.voz(data, bot, args);
        }

        case "vozcateg": {
            // comment="mostra as categorias de vozes, ex: !vozcateg"
            return await commands.vozCat(data, bot);
        }

        case "vozporcat": {
            // comment="mostra as vozes de uma categoria, ex: !vozporcat Portal"
            return await commands.vozList(data, bot, args);
        }

        case "audio": {
            // comment="gera um audio a partir de uma voz, ex: !audio seu-madruga a vingança nunca é plena, mata a alma e a envenena"
            return await commands.audio(data, bot, args);
        }

        case "image": {
            // comment="gera uma imagem a partir de uma url, ex: !image http://kamuridesu.tech/static/images/github_logo.png"
            return await commands.downloadImage(data, bot, args);
        }

        case "perfil": {
            // comment="pega a imagem de perfil do usuário, ex: !perfil @kamuridesu"
            return await commands.perfil(data, bot, args);
        }

        case "sfwaifu": {
            // comment="mostra uma imagem aleatória de uma waifu, podendo ser por categoria, ex: !sfwaifu [kiss]"
            return await commands.sfwaifu(data, bot, args);
        }

        case "thumbnail": {
            // comment="Baixa e envia uma thumbnail de um video no youtube, ex: !thumbnail https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            return await commands.thumbnail(data, bot, args);
        }


        /* %$ENDMIDIA$% */

        /* %$DIVERSAO$% */

        case "repeat":
            // comment="repete a mensagem, ex: !repeat oi"
            return await bot.sendTextMessage(data, args.join(" "));

        case 'sticker': {
            // comment="cria sticker"
            return await commands.createSticker(data, bot, args);
        }

        case "gado": {
            // comment="mostra seu nivel de gado"
            return await commands.nivelGado(data, bot);
        }

        case "slot": {
            // comment="joga um slot"
            return await commands.slot(data, bot);
        }

        case "gay": {
            // comment="mostra seu nivel de gay"
            return await commands.nivelGay(data, bot);
        }

        case "chance": {
            // comment="mostra uma chance de algo, ex: chance de eu ganhar na loteria"
            return await commands.chanceDe(data, bot, args);
        }

        case "perc": {
            // comment="mostra uma porcentagem, ex: perc hombre"
            return await commands.perc(data, bot, args);
        }

        case "sorteio": {
            // comment="sorteia items, ex: sorteio cama mesa banho"
            return await commands.sorteio(data, bot, args);
        }


        /* %$ENDDIVERSAO$% */

        /* %$ADMIN$% */

        case "desc": {
            // comment="muda a descrição do grupo, ex: desc oi eu sou goku"
            // muda a descrição do grupo
            return await commands.changeDescription(data, bot, args);
        }

        case "mudanome": {
            // comment="muda o nome do grupo, ex: mudanome oi eu sou goku"
            return await commands.groupRename(data, bot, args);
        }

        case "trancar": {
            // comment="tranca o grupo"
            return await commands.trancar(data, bot);
        }

        case "abrir": {
            // comment="abre o grupo"
            return await commands.abrir(data, bot);
        }

        case "promover": {
            // comment="promove um membro para admin, ex: !promover @goku"
            return await commands.promover(data, bot, args);
        }

        case "rebaixar": {
            // comment="rebaixa um admin, ex: !rebaixar @goku"
            return await commands.rebaixar(data, bot, args);
        }

        case "link": {
            // comment="pega o link do grupo"
            return await commands.getGroupLink(data, bot);
        }

        case "todos": {
            // comment="marca todos os membros do grupo em hidetag, ex: !todos oi"
            return await commands.mentionAll(data, bot, args);
        }

        case "welcome": {
            // comment="configura mensagem de boas vindas, use !welcome off para desligar. ex: !welcome oi"
            return await commands.welcome(data, bot, args);
        }

        case "antilink": {
            // comment="configura o bloqueio de links, ex: !antilink [off/on]"
            return await commands.antilink(data, bot, args);
        }

        case "nsfw": {
            // comment="configura nsfw, ex: !nsfw [off/on]"
            return await commands.nsfw(data, bot, args);
        }

        case "chatbot": {
            // comment="configura o chatbot, ex: !chatbot [off/on]"
            return await commands.chatbot(data, bot, args);
        }


        /* %$ENDADMIN$% */

        /* $%NSFW%$ */

        case "nsfwaifu": {
            // comment="envia uma imagem nsfw, podendo pesquisar por categoria, ex: !nsfwaifu [categoria]"
            return await commands.nsfwaifu(data, bot, args);
        }

        case "hentai": {
            // comment="envia 30 imagens hentai, podendo pesquisar por categoria, ex: !hentai [categoria]. Use !hentai ajuda para saber as categorias"
            return await commands.getHentai(data, bot, args);
        }

        case "himage": {
            // comment="envia uma imagem hentai, podendo pesquisar por categoria, ex: !himage [categoria]"
            return await commands.getHentaiImage(data, bot, args);
        }

        /* $%ENDNSFW%$ */

        /* %$BOTOWNER$% */

        case "transmitir": {
            // comment="transmite mensagens para todos os chats"
            return await commands.transmitir(data, bot, args);
        }

        case "travar": {
            // comment="trava um numero"
            return await commands.travar(data, bot, args);
        }

        /* %$ENDBOTOWNER$% */
    }
}

export { commandHandler };