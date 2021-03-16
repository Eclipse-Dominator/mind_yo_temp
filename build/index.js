"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = __importDefault(require("telegraf"));
const TemperatureUser_1 = require("./TemperatureUser");
const fs_1 = __importDefault(require("fs"));
const TOKEN = "Telegram bot id";
const bot = new telegraf_1.default(TOKEN);
const findUser = (id) => {
    var _a;
    return (_a = users_dict[id]) !== null && _a !== void 0 ? _a : false;
};
var users_dict = {};
var saveQ = JSON.parse(fs_1.default.readFileSync("./data.json", {
    encoding: "utf8",
    flag: "r+",
}));
process.on("beforeExit", (code) => __awaiter(void 0, void 0, void 0, function* () {
    // Can make asynchronous calls
    console.log(`Process will exit with code: ${code}`);
    yield saveFile();
    process.exit(code);
}));
process.on("SIGTERM", (signal) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Process ${process.pid} received a SIGTERM signal`);
    yield saveFile();
    process.exit(0);
}));
process.on("SIGINT", (signal) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Process ${process.pid} has been interrupted`);
    yield saveFile();
    process.exit(0);
}));
const interval = setInterval(() => {
    // 1h autosave
    console.log("saving..");
    return saveFile();
}, 3600000);
for (let id in saveQ) {
    let user = saveQ[id];
    let temp = new TemperatureUser_1.TemperatureUser(user.telegram_id, saveQ, findUser, saveFile);
    for (let attr in user) {
        //@ts-ignore
        temp[attr] = user[attr];
    }
    temp.bot = bot;
    temp.task_generator.next();
    users_dict[user.telegram_id] = temp;
}
function saveFile() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("saving file");
        let data = JSON.stringify(saveQ, null, 1);
        yield fs_1.default.promises.writeFile("data.json", data).catch((e) => console.log(e));
    });
}
const sortCommand = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (ctx.updateType === "message" && ((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text)) {
        const text = ctx.message.text.trim();
        if (text.startsWith("/")) {
            let res = text.split(/ +/);
            ctx.command = {
                raw: text,
                command: res[0],
                args: res.slice(1),
            };
        }
    }
    return next();
});
const user_created = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!ctx.chat)
        return;
    if (ctx.chat.type != "private")
        return; // reject non private chat
    let user = findUser(ctx.chat.id);
    if (user) {
        ctx.user = user;
        return next();
    }
    else {
        try {
            return ctx.reply("This chat profile is not currently registered. Please register via /start");
        }
        catch (e) {
            console.log("error");
        }
    }
    return;
});
bot.on("callback_query", user_created, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.handleCb(ctx);
    yield ctx.answerCbQuery();
}));
bot.start((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // restart acc
    if (!ctx.chat)
        return;
    if (ctx.chat.type != "private")
        return; // reject non private chat
    delete users_dict[ctx.chat.id];
    delete saveQ[ctx.chat.id];
    let user = new TemperatureUser_1.TemperatureUser(ctx.chat.id, saveQ, findUser, saveFile);
    user.bot = bot;
    users_dict[ctx.chat.id] = user;
    saveQ[ctx.chat.id] = user.getSaveUser();
    user.getDetails();
}));
bot.help(sortCommand, (ctx) => {
    if (!ctx.chat)
        return;
    if (ctx.chat.type != "private")
        return; // reject non private chat
    let user = findUser(ctx.chat.id);
    if (user) {
        return user.sendMessage("Welcome to the temperature bot.\n" +
            "Type /start to reset this profile.\n" +
            "Type /bot to view the menu and settings.\n" +
            "Type /help to display this message\n" +
            "Type /skip to skip the current conversation (if there is any).\n" +
            "Type /skipall to skip all conversations (if there is any).\n");
    }
    try {
        return ctx.reply("Welcome to temptaking.ado temperature reminder and checking system!\n" +
            "Type /help to display this message\n" +
            "Please type /start to begin your setup!");
    }
    catch (e) { }
});
bot.command("skip", user_created, (ctx) => {
    if (ctx.user) {
        ctx.user.msg_generator.shift();
        ctx.user.last_msg.done = true;
        ctx.user.messageHandler("");
    }
});
bot.command("skipall", user_created, (ctx) => {
    if (ctx.user) {
        ctx.user.msg_generator = [];
        ctx.user.last_msg.done = true;
        ctx.user.messageHandler("");
    }
});
bot.command("bot", user_created, sortCommand, (ctx) => {
    var _a;
    ctx.reply("Please select the options you wish to view or update", {
        reply_markup: (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.generateBtns("home"),
    });
});
bot.on("message", user_created, (ctx) => {
    var _a, _b, _c;
    if (ctx.user) {
        ctx.user.console_with_user((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text);
        ctx.user.messageHandler((_c = (_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : "");
    }
});
bot.catch((err, ctx) => {
    console.log(`encountered an error for ${ctx.updateType}`, err);
});
bot.launch();
