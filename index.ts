import Telegraf from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";
import { TemperatureUser } from "./TemperatureUser";
import { update_Context, Next, save_file, live_save } from "./user_interface";
import { MiddlewareFn } from "telegraf/typings/composer";
import fs from "fs";
import { Context } from "vm";

const TOKEN = "Telegram bot id";

const bot: Telegraf<TelegrafContext> = new Telegraf(TOKEN);

const findUser = (id: number): false | TemperatureUser => {
  return users_dict[id] ?? false;
};

var users_dict: live_save = {};
var saveQ: save_file = JSON.parse(
  fs.readFileSync("./data.json", {
    encoding: "utf8",
    flag: "r+",
  })
);

process.on("beforeExit", async (code) => {
  // Can make asynchronous calls
  console.log(`Process will exit with code: ${code}`);
  await saveFile();
  process.exit(code);
});

process.on("SIGTERM", async (signal) => {
  console.log(`Process ${process.pid} received a SIGTERM signal`);
  await saveFile();
  process.exit(0);
});

process.on("SIGINT", async (signal) => {
  console.log(`Process ${process.pid} has been interrupted`);
  await saveFile();
  process.exit(0);
});

const interval = setInterval(() => {
  // 1h autosave
  console.log("saving..");
  return saveFile();
}, 3600000);

for (let id in saveQ) {
  let user = saveQ[id];
  let temp = new TemperatureUser(user.telegram_id, saveQ, findUser, saveFile);
  for (let attr in user) {
    //@ts-ignore
    temp[attr] = user[attr];
  }
  temp.bot = bot;
  temp.task_generator.next();
  users_dict[user.telegram_id] = temp;
}

async function saveFile() {
  console.log("saving file");
  let data: string = JSON.stringify(saveQ, null, 1);
  await fs.promises.writeFile("data.json", data).catch((e) => console.log(e));
}

const sortCommand: MiddlewareFn<update_Context> = async (
  ctx: update_Context,
  next: Next
) => {
  if (ctx.updateType === "message" && ctx.message?.text) {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      let res: string[] = text.split(/ +/);
      ctx.command = {
        raw: text,
        command: res[0],
        args: res.slice(1),
      };
    }
  }
  return next();
};

const user_created: MiddlewareFn<update_Context> = async (
  ctx: update_Context,
  next: Next
) => {
  if (!ctx.chat) return;
  if (ctx.chat.type != "private") return; // reject non private chat

  let user = findUser(ctx.chat.id);
  if (user) {
    ctx.user = user;
    return next();
  } else {
    try {
      return ctx.reply(
        "This chat profile is not currently registered. Please register via /start"
      );
    } catch (e) {
      console.log("error");
    }
  }

  return;
};

bot.on("callback_query", user_created, async (ctx: update_Context) => {
  ctx.user?.handleCb(ctx);
  await ctx.answerCbQuery();
});

bot.start(async (ctx: update_Context) => {
  // restart acc
  if (!ctx.chat) return;
  if (ctx.chat.type != "private") return; // reject non private chat
  delete users_dict[ctx.chat.id];
  delete saveQ[ctx.chat.id];

  let user = new TemperatureUser(ctx.chat.id, saveQ, findUser, saveFile);
  user.bot = bot;
  users_dict[ctx.chat.id] = user;
  saveQ[ctx.chat.id] = user.getSaveUser();

  user.getDetails();
});

bot.help(sortCommand, (ctx: update_Context) => {
  if (!ctx.chat) return;
  if (ctx.chat.type != "private") return; // reject non private chat
  let user = findUser(ctx.chat.id);
  if (user) {
    return user.sendMessage(
      "Welcome to the temperature bot.\n" +
        "Type /start to reset this profile.\n" +
        "Type /bot to view the menu and settings.\n" +
        "Type /help to display this message\n" +
        "Type /skip to skip the current conversation (if there is any).\n" +
        "Type /skipall to skip all conversations (if there is any).\n"
    );
  }
  try {
    return ctx.reply(
      "Welcome to temptaking.ado temperature reminder and checking system!\n" +
        "Type /help to display this message\n" +
        "Please type /start to begin your setup!"
    );
  } catch (e) {}
});

bot.command("skip", user_created, (ctx: update_Context) => {
  if (ctx.user) {
    ctx.user.msg_generator.shift();
    ctx.user.last_msg.done = true;
    ctx.user.messageHandler("");
  }
});

bot.command("skipall", user_created, (ctx: update_Context) => {
  if (ctx.user) {
    ctx.user.msg_generator = [];
    ctx.user.last_msg.done = true;
    ctx.user.messageHandler("");
  }
});

bot.command("bot", user_created, sortCommand, (ctx: update_Context) => {
  ctx.reply("Please select the options you wish to view or update", {
    reply_markup: ctx.user?.generateBtns("home"),
  });
});

bot.on("message", user_created, (ctx: update_Context) => {
  if (ctx.user) {
    ctx.user.console_with_user(ctx.message?.text);
    ctx.user.messageHandler(ctx.message?.text ?? "");
  }
});
bot.catch((err: unknown, ctx: Context) => {
  console.log(`encountered an error for ${ctx.updateType}`, err);
});
bot.launch();
