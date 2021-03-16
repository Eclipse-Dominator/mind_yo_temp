"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemperatureUser = void 0;
const axios_1 = __importDefault(require("axios"));
const qs = __importStar(require("query-string"));
axios_1.default.defaults.timeout = 10000;
class TemperatureUser {
    constructor(telegram_id, saveQ, findUser, saveFile) {
        this.telegram_id = telegram_id;
        this.saveQ = saveQ;
        this.findUser = findUser;
        this.saveFile = saveFile;
        this.uid = "";
        this.name = "";
        this.overviewCode = "";
        this.groupCode = "";
        this.pin = "";
        this.msg_generator = [];
        this.last_msg = { value: undefined, done: true };
        this.AM_PM_timer_check = ["", ""];
        this.AM_PM_timer_group = ["", ""];
        this.filter_list = [];
        this.careful_submission = false;
        this.groupName = "";
        this.overviewName = "";
        this.task_list = [];
        this.last5range_check = [];
        this.last5range_individual_check = [];
        this.idQueryParams = "https://temptaking.ado.sg/group/";
        this.tempSubmission = "https://temptaking.ado.sg/group/MemberSubmitTemperature";
        this.tempHistory = "https://temptaking-ne.ado.sg/group/MemberListPastRecords";
        this.grpHistory = "https://temptaking.ado.sg/overview/ListGroupTemperatureRecords";
        this.task_generator = this.taskloop();
        this.task_generator.next();
    }
    getTelegramID(uid) {
        for (let teleId in this.saveQ) {
            if (this.saveQ[teleId].uid == uid)
                return teleId;
        }
        return false;
    }
    getSaveUser() {
        return {
            telegram_id: this.telegram_id,
            AM_PM_timer_check: this.AM_PM_timer_check,
            AM_PM_timer_group: this.AM_PM_timer_group,
            groupCode: this.groupCode,
            groupName: this.groupName,
            name: this.name,
            overviewCode: this.overviewCode,
            overviewName: this.overviewName,
            pin: this.pin,
            task_list: this.task_list,
            uid: this.uid,
            filter_list: this.filter_list,
            careful_submission: this.careful_submission,
        };
    }
    saveProfile() {
        this.saveQ[this.telegram_id] = this.getSaveUser();
        this.saveFile();
    }
    displayProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendMessage(`Name: ${this.name}\n` +
                `UserID: ${this.uid}\n` +
                `Group: ${this.groupName}\n` +
                `GroupID: ${this.groupCode}\n` +
                `AM Reminder: ${this.AM_PM_timer_check[0] == ""
                    ? "Not set yet"
                    : this.AM_PM_timer_check[0] + " daily"}\n` +
                `PM Reminder: ${this.AM_PM_timer_check[1] == ""
                    ? "Not set yet"
                    : this.AM_PM_timer_check[1] + " daily"}\n`);
            if (this.overviewCode) {
                yield this.sendMessage(`Overview: ${this.overviewName}\n` +
                    `OverviewID: ${this.overviewCode}\n` +
                    `Group AM Check: ${this.AM_PM_timer_group[0] == ""
                        ? "Not set yet"
                        : this.AM_PM_timer_group[0] + " daily"}\n` +
                    `Group PM Check: ${this.AM_PM_timer_group[1] == ""
                        ? "Not set yet"
                        : this.AM_PM_timer_group[1] + " daily"}\n`);
                if (this.filter_list.length)
                    yield this.sendMessage("Filter List:\n" + this.filter_list.join("\n"));
                else
                    yield this.sendMessage("Filter List:\nNo filters has been added!");
            }
        });
    }
    readDate(dateString) {
        //read ddmmyyyy or ddmmyyyy hh:mm and returns a Date object
        try {
            dateString = dateString.trim();
            let res = dateString.split(/ +/);
            let date, time, hh, mm;
            if (res.length == 2) {
                [date, time] = res;
                [hh, mm] = time.split(":").map((x) => parseInt(x));
            }
            else {
                date = res[0];
                hh = mm = 0;
            }
            let [day, month, year] = date.split("/").map((x) => parseInt(x));
            if (month > 12 || day > 31 || month < 1 || day < 1 || year < 2020)
                return false;
            let returnable_date = new Date(year, month - 1, day, hh, mm);
            if (returnable_date.toString() == "Invalid Date")
                throw "invalid date";
            return new Date(year, month - 1, day, hh, mm);
        }
        catch (e) {
            return false;
        }
    }
    *taskloop() {
        this.console_with_user(`initializing program for ${this.telegram_id}`);
        let lastTimeToDoTask = "-1";
        let lastTask;
        let schedule;
        while (1) {
            let log = yield; // calls this when there is a change to the Queuelist
            //this.console_with_user(`Called by ${log}\n`) for debugging
            this.saveProfile();
            if (this.task_list.length) {
                if (lastTask == this.task_list[0] &&
                    lastTimeToDoTask == this.task_list[0].date_time_scheduled) {
                    // no change from last set time cos same object
                    continue;
                }
                else {
                    // new task added
                    // or
                    // somewhere the next task object is changed
                    clearTimeout(schedule);
                    let lastTask = this.task_list[0];
                    let current_time = new Date();
                    let next_time = this.readDate(lastTask.date_time_scheduled);
                    if (!next_time)
                        continue;
                    schedule = setTimeout(this.doTask.bind(this), next_time.getTime() - current_time.getTime(), lastTask);
                    lastTimeToDoTask = lastTask.date_time_scheduled;
                }
            }
        }
    }
    add_to_genQ(generator, silence = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.msg_generator.push(generator);
            if (!this.last_msg.done) {
                if (!silence)
                    yield this.sendMessage("There is currently a task in queue, will append this task after the current one is complete. \nYou can Type /skip to skip the current task");
            }
            else {
                yield this.messageHandler("");
            }
        });
    }
    handleCb(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ctx.callbackQuery || !ctx.callbackQuery.data)
                return false;
            switch (ctx.callbackQuery.data) {
                case "goto_home":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("home"));
                    break;
                case "goto_settings":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("settings"));
                    break;
                case "goto_acc":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("acc_settings"));
                    break;
                case "goto_indi":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("individual"));
                    break;
                case "goto_group":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("group"));
                    break;
                case "goto_temp_submit":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("submit"));
                    break;
                case "goto_temp_force":
                    yield ctx.editMessageReplyMarkup(this.generateBtns("submit_force"));
                    break;
                case "submit":
                    yield this.add_to_genQ(this.submitTemperatureGen());
                    break;
                case "submit_am":
                    yield this.add_to_genQ(this.submitTemperatureGen(new Date().toLocaleDateString("en-GB"), // date
                    "AM" // meridies
                    ));
                    break;
                case "submit_pm":
                    yield this.add_to_genQ(this.submitTemperatureGen(new Date().toLocaleDateString("en-GB"), // date
                    "PM" // meridies
                    ));
                    break;
                case "force_submit":
                    yield this.add_to_genQ(this.submitTemperatureGen(undefined, undefined, undefined, false));
                    break;
                case "force_submit_am":
                    yield this.add_to_genQ(this.submitTemperatureGen(new Date().toLocaleDateString("en-GB"), "AM", undefined, false));
                    break;
                case "force_submit_pm":
                    yield this.add_to_genQ(this.submitTemperatureGen(new Date().toLocaleDateString("en-GB"), "PM", undefined, false));
                    break;
                case "change_grp":
                    yield this.add_to_genQ(this.addTempAccGen());
                    break;
                case "change_overview":
                    yield this.add_to_genQ(this.addOverviewGen());
                    break;
                case "change_pin":
                    yield this.add_to_genQ(this.updatePinGen());
                    break;
                case "grp_reminder":
                    yield this.add_to_genQ(this.setReminderGen(true));
                    break;
                case "indi_reminder":
                    yield this.add_to_genQ(this.setReminderGen(false));
                    break;
                case "safe_off":
                    this.careful_submission = false;
                    this.saveProfile();
                    yield this.sendMessage(`Safe submit has been disabled`, undefined, undefined, undefined, { remove_keyboard: true });
                    yield ctx.editMessageReplyMarkup(this.generateBtns("settings"));
                    break;
                case "safe_on":
                    this.careful_submission = true;
                    this.saveProfile();
                    yield this.sendMessage(`Safe submit has been enabled`, undefined, undefined, undefined, { remove_keyboard: true });
                    yield ctx.editMessageReplyMarkup(this.generateBtns("settings"));
                    break;
                case "update_filter":
                    yield this.add_to_genQ(this.addNewFilterGen());
                    break;
                case "view_profile":
                    yield this.displayProfile();
                    break;
                case "check":
                    yield this.add_to_genQ(this.tempCheckGen(false));
                    break;
                case "check_today":
                    yield this.add_to_genQ(this.tempCheckGen(false, new Date().toLocaleDateString("en-GB")));
                    break;
                case "range_check":
                    yield this.add_to_genQ(this.rangeCheckGen(false));
                    break;
                case "grp_check_today":
                    yield this.add_to_genQ(this.tempCheckGen(true, new Date().toLocaleDateString("en-GB")));
                    break;
                case "grp_check":
                    yield this.add_to_genQ(this.tempCheckGen(true));
                    break;
                case "range_grp_check":
                    yield this.add_to_genQ(this.rangeCheckGen(true));
                    break;
                case "remind_grp":
                    if (ctx.callbackQuery.message) {
                        yield ctx.replyWithChatAction("typing");
                        yield this.remindMsg(ctx.callbackQuery.message.message_id);
                        yield ctx.editMessageReplyMarkup();
                    }
                    break;
                case "fill_temp":
                    if (ctx.callbackQuery.message) {
                        yield ctx.replyWithChatAction("typing");
                        yield this.fillReplyMsg(ctx.callbackQuery.message.message_id);
                        yield ctx.editMessageReplyMarkup();
                    }
                    break;
            }
            return true;
        });
    }
    generateBtns(state) {
        switch (state) {
            case "acc_settings":
                return {
                    inline_keyboard: [
                        [{ text: "Update Group 🏘️", callback_data: "change_grp" }],
                        this.overviewCode
                            ? [
                                {
                                    text: "Update Overview Url",
                                    callback_data: "change_overview",
                                },
                            ]
                            : [
                                {
                                    text: "Add Overview Url ➕",
                                    callback_data: "change_overview",
                                },
                            ],
                        [{ text: "Update password 📲", callback_data: "change_pin" }],
                        [{ text: "👈🏻 Back", callback_data: "goto_settings" }],
                    ],
                };
            case "settings":
                return {
                    inline_keyboard: [
                        [
                            {
                                text: "Edit Account Information ✍🏽",
                                callback_data: "goto_acc",
                            },
                        ],
                        [
                            { text: "Group Reminder ⏰", callback_data: "grp_reminder" },
                            {
                                text: "Individual Reminder ⏰",
                                callback_data: "indi_reminder",
                            },
                        ],
                        this.careful_submission
                            ? [
                                {
                                    text: "Safe Submission ON ✔️",
                                    callback_data: "safe_off",
                                },
                            ]
                            : [{ text: "Safe Submission OFF ❌", callback_data: "safe_on" }],
                        this.overviewCode
                            ? [
                                {
                                    text: "Update filter 🌪️",
                                    callback_data: "update_filter",
                                },
                            ]
                            : [
                                {
                                    text: "Add Overview Url ➕",
                                    callback_data: "change_overview",
                                },
                            ],
                        [{ text: "👈🏻 Back", callback_data: "goto_home" }],
                    ],
                };
            case "home":
                return {
                    inline_keyboard: [
                        [
                            {
                                text: "Display Profile 🧑🏽",
                                callback_data: "view_profile",
                            },
                        ],
                        [
                            {
                                text: "Submit Temperatures 🌡️",
                                callback_data: "goto_temp_submit",
                            },
                        ],
                        [
                            {
                                text: "Individual Temperature Check 🔎🌡️",
                                callback_data: "goto_indi",
                            },
                        ],
                        this.overviewCode
                            ? [
                                {
                                    text: "Group Temperature Check 🔎🌡️",
                                    callback_data: "goto_group",
                                },
                            ]
                            : [
                                {
                                    text: "Add Overview Url ➕",
                                    callback_data: "change_overview",
                                },
                            ],
                        [{ text: "Settings ⚙️", callback_data: "goto_settings" }],
                    ],
                };
            case "individual":
                return {
                    inline_keyboard: [
                        [{ text: "Temperature Check 🔎", callback_data: "check" }],
                        [{ text: "Check Today 🗓️", callback_data: "check_today" }],
                        [
                            {
                                text: "Range Temperature Check 📅",
                                callback_data: "range_check",
                            },
                        ],
                        [{ text: "👈🏻 Back", callback_data: "goto_home" }],
                    ],
                };
            case "group":
                return {
                    inline_keyboard: [
                        [
                            {
                                text: "Group Temperature Check 🔎",
                                callback_data: "grp_check",
                            },
                        ],
                        [{ text: "Check Today 🗓️", callback_data: "grp_check_today" }],
                        [
                            {
                                text: "Range Temperature Check 📅",
                                callback_data: "range_grp_check",
                            },
                        ],
                        [{ text: "👈🏻 Back", callback_data: "goto_home" }],
                    ],
                };
            case "submit":
                return {
                    inline_keyboard: [
                        this.careful_submission
                            ? [
                                {
                                    text: "Change to Force Submit 🕶",
                                    callback_data: "goto_temp_force",
                                },
                            ]
                            : [],
                        [{ text: "Submit a Temperature 🌡️", callback_data: "submit" }],
                        new Date() >=
                            this.readDate(new Date().toLocaleDateString("en-GB") + " 12:00")
                            ? [
                                { text: "Submit AM Today ☀️", callback_data: "submit_am" },
                                { text: "Submit PM Today 🌕", callback_data: "submit_pm" },
                            ]
                            : [{ text: "Submit AM Today ☀️", callback_data: "submit_am" }],
                        [{ text: "👈🏻 Back", callback_data: "goto_home" }],
                    ],
                };
            case "submit_force":
                return {
                    inline_keyboard: [
                        [
                            {
                                text: "Change to Normal Submit 👓",
                                callback_data: "goto_temp_submit",
                            },
                        ],
                        [
                            {
                                text: "Submit a Temperature 🌡️",
                                callback_data: "force_submit",
                            },
                        ],
                        new Date() >=
                            this.readDate(new Date().toLocaleDateString("en-GB") + " 12:00")
                            ? [
                                {
                                    text: "Submit AM Today ☀️",
                                    callback_data: "force_submit_am",
                                },
                                {
                                    text: "Submit PM Today 🌕",
                                    callback_data: "force_submit_pm",
                                },
                            ]
                            : [
                                {
                                    text: "Submit AM Today ☀️",
                                    callback_data: "force_submit_am",
                                },
                            ],
                        [{ text: "👈🏻 Back", callback_data: "goto_home" }],
                    ],
                };
            default:
                break;
        }
    }
    addTasktoQ(task) {
        // add task sorted into Queue
        if (this.task_list.length) {
            let date = this.readDate(task.date_time_scheduled);
            if (!date)
                return;
            let i = 0;
            for (i in this.task_list) {
                let checkdate = this.readDate(this.task_list[i].date_time_scheduled);
                if (date < checkdate) {
                    this.task_list.splice(parseInt(i), 0, task);
                    break;
                }
            }
            if (i == this.task_list.length - 1) {
                this.task_list.push(task);
            }
        }
        else {
            this.task_list.push(task);
        }
        this.task_generator.next();
    }
    doTask(task) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (new Date() < this.readDate(task.date_time_scheduled)) {
                // removes task for whatever reason
                this.task_list.shift();
                this.task_generator.next();
                return;
            }
            let reply_msg = "";
            yield this.sendMessage(`Doing routine check for your ${task.overview_reminder ? "group's" : ""} temperature submissions by ${task.date_time_scheduled}.`);
            let res = false;
            let submission_res = false;
            if (task.overview_reminder) {
                // group check
                res = yield this.groupTempCheck(task.date_scheduled, task.meridies == "PM" ? "BOTH" : "AM");
                if (res) {
                    reply_msg += res.msg;
                }
                else
                    reply_msg += res;
            }
            else {
                // individual check
                submission_res = yield this.TempSubmissionCheck(task.date_scheduled, task.meridies);
                if (submission_res) {
                    reply_msg += submission_res.msg;
                }
                else
                    reply_msg += false;
            }
            if (reply_msg == "false") {
                yield this.sendMessage(`An error occured while trying to check ${task.date_scheduled} for ${task.overview_reminder ? "group" : "you"}. Please do a manual check if necessary.`);
            }
            else {
                let msgId = yield this.sendMessage(reply_msg, undefined, true, undefined, res
                    ? {
                        inline_keyboard: [
                            [{ text: "Remind users", callback_data: "remind_grp" }],
                        ],
                    }
                    : undefined);
                if (msgId) {
                    if (res) {
                        this.last5range_check.push({
                            msgId: msgId,
                            past_checks: res.data,
                        });
                        while (this.last5range_check.length > 5) {
                            let obj = this.last5range_check.shift();
                            try {
                                yield ((_a = this.bot) === null || _a === void 0 ? void 0 : _a.telegram.editMessageReplyMarkup(this.telegram_id, obj === null || obj === void 0 ? void 0 : obj.msgId.slice(-1)[0], undefined, undefined));
                            }
                            catch (e) { }
                        }
                    }
                    else if (submission_res) {
                        this.fillIn(submission_res.data);
                    }
                }
            }
            this.task_list.shift();
            this.updateCompletedTask(task);
            this.task_generator.next();
        });
    }
    updateCompletedTask(task) {
        let index = 0;
        let nextTime = "";
        if (task.meridies == "PM")
            index = 1;
        if (task.overview_reminder) {
            nextTime = this.AM_PM_timer_group[index];
        }
        else {
            nextTime = this.AM_PM_timer_check[index];
        }
        if (nextTime == "")
            return; //removes task
        let new_date = this.readDate(task.date_time_scheduled);
        if (new_date) {
            new_date.setDate(new_date.getDate() + 1);
            task.date_scheduled = new_date.toLocaleDateString("en-GB");
            task.time_scheduled = nextTime;
            task.date_time_scheduled = task.date_scheduled + " " + nextTime;
            this.addTasktoQ(task);
        }
        return;
    }
    updateScheduleParam(overview_reminder, meridies, time) {
        if (time == "remove") {
            time = "";
        }
        else if (!this.validTime(time))
            return "invalid time format!";
        let index = meridies == "AM" ? 0 : 1;
        if (overview_reminder) {
            if (this.overviewCode == "")
                return "You do not have an overview code, add it in settings in /app";
            this.AM_PM_timer_group[index] = time;
        }
        else {
            this.AM_PM_timer_check[index] = time;
        }
        if (time == "") {
            // remove relevant task
            this.task_list = this.task_list.filter((x) => !(x.overview_reminder == overview_reminder &&
                x.meridies == meridies.toUpperCase()));
            this.saveProfile();
            this.task_generator.next();
            return "Task removed!";
        }
        else {
            let res = this.check_duplicate_task(overview_reminder, meridies);
            if (res) {
                res.time_scheduled = time;
                res.date_time_scheduled = res.date_scheduled + " " + time;
                this.removeTask(res);
                this.addTasktoQ(res);
                this.saveProfile();
                this.task_generator.next();
                return "Tasks succesfully updated!";
            }
            if (this.add_task(overview_reminder, meridies)) {
                this.saveProfile();
                this.task_generator.next();
                return "schedule successfully added";
            }
            return "task failed to be added";
        }
    }
    removeTask(task) {
        this.task_list = this.task_list.filter((x) => !(x.overview_reminder == task.overview_reminder &&
            x.meridies == task.meridies.toUpperCase()));
    }
    validTime(time) {
        let [hh, mm] = time.split(":").map((x) => parseInt(x));
        let timeObj = new Date(0, 0, 0, hh, mm);
        if (timeObj.toLocaleTimeString() == "Invalid Date")
            return false;
        return true;
    }
    check_duplicate_task(overview_reminder, meridies) {
        // returns false of task do not exist
        // returns the task if it matches the task
        for (let t of this.task_list) {
            if (t.overview_reminder == overview_reminder && t.meridies == meridies) {
                // task alr exist
                return t;
            }
        }
        return false;
    }
    add_task(overview_reminder, meridies) {
        let index = meridies == "AM" ? 0 : 1;
        let nextTime = "";
        if (overview_reminder) {
            nextTime = this.AM_PM_timer_group[index];
        }
        else {
            nextTime = this.AM_PM_timer_check[index];
        }
        if (nextTime == "")
            return false;
        let task = {
            date_scheduled: "",
            meridies: meridies,
            time_scheduled: nextTime,
            overview_reminder: overview_reminder,
            date_time_scheduled: "",
        };
        let new_date = new Date();
        task.date_scheduled = new_date.toLocaleDateString("en-GB");
        task.date_time_scheduled = task.date_scheduled + " " + nextTime;
        this.addTasktoQ(task); // updates tasklist
        return true;
    }
    rangeTempSubmissionCheck(sDate, eDate) {
        return __awaiter(this, void 0, void 0, function* () {
            let startDate = this.readDate(sDate);
            let endDate = this.readDate(eDate);
            if (!(startDate && endDate)) {
                yield this.sendMessage("Invalid date format");
                return false;
            }
            if (startDate > endDate) {
                yield this.sendMessage("Invalid date range");
                return false;
            }
            let query = {
                groupCode: this.groupCode,
                memberId: this.uid,
                pin: this.pin,
                startDate: sDate,
                endDate: eDate,
                timezone: "Asia/Singapore",
            };
            try {
                let results = (yield axios_1.default.post(`${this.tempHistory}?${qs.stringify(query)}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
                    },
                })).data; //checkHistoryEntry
                if (!results.length) {
                    yield this.sendMessage("Your pin is invalid, change it in settings in /app!");
                    return false;
                }
                let dataStored = [];
                let msg_to_return = `<u>Your missing submissions from ${sDate} to ${eDate}</u>\n`;
                for (let result of results) {
                    let [AM, PM] = this.checkHistoryEntry(result);
                    if (!(AM && PM)) {
                        if (AM == PM) {
                            dataStored.push({ date: result.date, meridies: "BOTH" });
                            msg_to_return += `Missing: ${result.date} BOTH\n`;
                        }
                        else if (!AM) {
                            dataStored.push({ date: result.date, meridies: "AM" });
                            msg_to_return += `Missing: ${result.date} AM\n`;
                        }
                        else {
                            dataStored.push({ date: result.date, meridies: "PM" });
                            msg_to_return += `Missing: ${result.date} PM\n`;
                        }
                    }
                }
                return { msg: msg_to_return, data: dataStored };
            }
            catch (error) {
                this.console_with_user(error);
                yield this.sendMessage("An error occured while connecting to the server");
                return false;
            }
        });
    }
    TempSubmissionCheck(date, meridies) {
        return __awaiter(this, void 0, void 0, function* () {
            this.console_with_user("running");
            let response = yield this.validateTempSubmission(date, meridies);
            if (response.network_error) {
                yield this.sendMessage("An error occured while to connect to the server!");
                return false;
            }
            if (response.pinErr) {
                yield this.sendMessage("The pin for your profile is incorrect, change it in settings in /app");
                return false;
            }
            let ret = { data: [], msg: "" };
            if (response.response) {
                ret.msg = "You have already submitted both temperatures.";
                return ret;
            }
            else {
                if (meridies == "BOTH" && response.raw) {
                    ret.msg =
                        "You have yet to submit your temperature for " +
                            date +
                            " " +
                            (response.raw[0] ? "" : "AM") +
                            (response.raw[0] == response.raw[1] ? " & " : "") +
                            (response.raw[1] ? "" : "PM") +
                            ".";
                }
                else {
                    ret.msg = `You have yet to submit your temperature for ${date} ${meridies}.`;
                }
                ret.data.push({ date: date, meridies: meridies });
                return ret;
            }
        });
    }
    groupRangeTempCheck(sDate, eDate, search_filter) {
        return __awaiter(this, void 0, void 0, function* () {
            let startDate = this.readDate(sDate);
            let endDate = this.readDate(eDate);
            if (!(startDate && endDate)) {
                yield this.sendMessage("Invalid date format");
                return false;
            }
            if (startDate > endDate) {
                yield this.sendMessage("Invalid date range");
                return false;
            }
            let replyData = { remind_list: [], reminder: this.name };
            let reply_title = `<u>*Temperature Result from ${sDate} to ${eDate}*</u>\n`;
            let reply_msg = "";
            while (startDate <= endDate) {
                let date = startDate.toLocaleDateString("en-GB");
                let res = yield this.groupTempCheck(date, "BOTH", search_filter);
                if (!res)
                    return false;
                let body_to_add = res.msg;
                if (body_to_add.slice(-3, -1) != "👍")
                    reply_msg += body_to_add + "\n"; // 👍 takes up 2 length
                replyData.remind_list = [
                    ...replyData.remind_list,
                    ...res.data.remind_list,
                ];
                replyData.remind_list = this.merge_items(replyData.remind_list, (x) => x.telegram_id, (x1, x2) => {
                    x1.missing_entries = [...x1.missing_entries, ...x2.missing_entries];
                    return x1;
                });
                startDate.setDate(startDate.getDate() + 1);
            }
            if (reply_msg == "")
                reply_msg = "Everyone in your filter group has submitted!";
            return { msg: reply_title + reply_msg, data: replyData };
        });
    }
    groupTempCheck(date, meridies, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = {
                overviewCode: this.overviewCode,
                date: date,
                timezone: "Asia/Singapore",
            };
            let search_filters = [];
            if (filter == undefined || filter == "")
                search_filters = this.filter_list;
            else if (filter.toUpperCase() == "NULL")
                search_filters = [];
            else
                search_filters = [filter.trim() + " "];
            try {
                if (this.overviewCode == "") {
                    yield this.sendMessage("Your profile does not contain an overview code, please add it in settings in /app");
                    return false;
                }
                let results = (yield axios_1.default.post(this.grpHistory, qs.stringify(query), {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
                    },
                })).data;
                if (results == null) {
                    yield this.sendMessage("The overview code provided is invalid, change it in settings in /app");
                    return false;
                }
                let reply = {
                    data: { remind_list: [], reminder: this.name },
                    msg: "",
                };
                let reply_title = `<u>*${date}*</u>\n`;
                let reply_body = "";
                let merge_arr = [];
                for (let search_filter of search_filters) {
                    if (search_filter != "" && search_filter != undefined) {
                        search_filter = search_filter.toUpperCase();
                        merge_arr = [
                            ...merge_arr,
                            ...results.members.filter((x) => x.identifier.toUpperCase().includes(search_filter)),
                        ];
                    }
                }
                if (search_filters.length != 0) {
                    results.members = this.remove_dup(merge_arr, (x) => parseInt(x.id));
                }
                for (let member of results.members) {
                    //this.console_with_user(`Checking ${member.identifier}`)
                    let AM = false;
                    let PM = false;
                    for (let entry of member.tempRecords) {
                        let timeSubmit = parseFloat(entry.recordForDateTime.split(":")[0]);
                        if (timeSubmit < 12) {
                            AM = true;
                        }
                        else {
                            PM = true;
                        }
                    }
                    if (meridies == "BOTH" || meridies == "") {
                        if (new Date() < this.readDate(date + " 12:00"))
                            meridies = "AM";
                    }
                    if (meridies == "AM") {
                        if (!AM) {
                            reply_body += `<b>${member.identifier}</b> missing <i>AM</i>.\n`;
                            // push user
                            let teleId = this.getTelegramID(member.id);
                            if (teleId) {
                                reply.data.remind_list.push({
                                    uid: member.id,
                                    telegram_id: teleId,
                                    name: member.identifier,
                                    missing_entries: [{ date: date, meridies: "AM" }],
                                });
                            }
                        }
                    }
                    else if (meridies == "PM") {
                        if (!PM) {
                            reply_body += `<b>${member.identifier}</b> missing <i>PM</i>.\n`;
                            let teleId = this.getTelegramID(member.id);
                            if (teleId) {
                                reply.data.remind_list.push({
                                    uid: member.id,
                                    telegram_id: teleId,
                                    name: member.identifier,
                                    missing_entries: [{ date: date, meridies: "PM" }],
                                });
                            }
                        }
                    }
                    else if (!(AM && PM)) {
                        let teleId = this.getTelegramID(member.id);
                        if (AM == PM) {
                            reply_body += `<b>${member.identifier}</b> : missing <i>AM</i> and <i>PM</i>.\n`;
                            if (teleId) {
                                reply.data.remind_list.push({
                                    uid: member.id,
                                    telegram_id: teleId,
                                    name: member.identifier,
                                    missing_entries: [{ date: date, meridies: "BOTH" }],
                                });
                            }
                        }
                        else if (!AM) {
                            reply_body += `<b>${member.identifier}</b> : missing <i>AM</i>.\n`;
                            if (teleId) {
                                reply.data.remind_list.push({
                                    uid: member.id,
                                    telegram_id: teleId,
                                    name: member.identifier,
                                    missing_entries: [{ date: date, meridies: "AM" }],
                                });
                            }
                        }
                        else {
                            reply_body += `<b>${member.identifier}</b> : missing <i>PM</i>.\n`;
                            if (teleId) {
                                reply.data.remind_list.push({
                                    uid: member.id,
                                    telegram_id: teleId,
                                    name: member.identifier,
                                    missing_entries: [{ date: date, meridies: "PM" }],
                                });
                            }
                        }
                    }
                }
                if (reply_body == "")
                    reply_body += "Everyone submitted.👍\n"; //👍 functions as an check in range search
                reply.msg = reply_title + reply_body;
                return reply;
            }
            catch (e) {
                yield this.sendMessage(`an error occured trying to retrieve data on ${date}`);
                return {
                    msg: `${date}\nAn error occured trying to retrieve data from this date\n`,
                    data: { remind_list: [], reminder: "" },
                };
            }
        });
    }
    validateTempSubmission(date, meridies) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = {
                groupCode: this.groupCode,
                memberId: this.uid,
                pin: this.pin,
                startDate: date,
                endDate: date,
                timezone: "Asia/Singapore",
            };
            try {
                this.console_with_user(`${this.tempHistory}?${qs.stringify(query)}`);
                let res = (yield axios_1.default.post(`${this.tempHistory}?${qs.stringify(query)}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
                    },
                })).data;
                this.console_with_user(res);
                if (!res.length)
                    return { network_error: false, pinErr: true };
                let result = this.checkHistoryEntry(res[0]);
                if (meridies === "AM") {
                    return {
                        network_error: false,
                        response: result[0],
                        raw: result,
                        pinErr: false,
                    };
                }
                else if (meridies === "PM") {
                    return {
                        network_error: false,
                        response: result[1],
                        raw: result,
                        pinErr: false,
                    };
                }
                else {
                    return {
                        network_error: false,
                        response: result[0] && result[1],
                        raw: result,
                        pinErr: false,
                    };
                }
            }
            catch (error) {
                this.console_with_user(error);
                return { network_error: true };
            }
        });
    }
    checkHistoryEntry(entry) {
        return [!!entry.latestAM, !!entry.latestPM];
    }
    FindNextUrl(url, search_string) {
        try {
            let url_params = url.split("/");
            let next_param = false;
            for (let param of url_params) {
                if (param == search_string)
                    next_param = true;
                else if (next_param) {
                    return param;
                }
            }
            return false;
        }
        catch (e) {
            return false;
        }
    }
    saveGroupCode(url) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let result = this.FindNextUrl(url, "group");
            if (result) {
                this.groupCode = result;
                let dataRes = yield this.loadGrpData();
                if (dataRes.error && ((_a = dataRes.err) === null || _a === void 0 ? void 0 : _a.valueOf()) == "INVALID")
                    return false;
                else if (dataRes.error) {
                    yield this.sendMessage("there seems to be an error when communicating with the server!\nTry again later!");
                    yield this.sendMessage("To exit the process, type /skip");
                    return false;
                }
                else {
                    this.groupName = (_b = dataRes.response) === null || _b === void 0 ? void 0 : _b.groupName;
                    return true;
                }
            }
            return false;
        });
    }
    saveOverviewCode(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = this.FindNextUrl(url, "overview");
                if (result) {
                    this.overviewCode = result;
                    let query = {
                        overviewCode: this.overviewCode,
                        date: "20/8/2020",
                        timezone: "Asia/Singapore",
                    };
                    let response = (yield axios_1.default.post(this.grpHistory, qs.stringify(query), {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
                        },
                    })).data;
                    if (response == null) {
                        return false;
                    }
                    else {
                        this.overviewName = response.groupName;
                        this.saveProfile();
                        return true;
                    }
                }
                return false;
            }
            catch (e) {
                yield this.sendMessage("unable to connect to the ado servers. saving overview code anyway..." +
                    "\nYou can change it later under settings in /app");
                return true;
            }
        });
    }
    sendMessage(msg, silence, html, telegramId = this.telegram_id, MarkupObj) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (msg.trim() == "")
                return false;
            let charLength = 4096;
            if (html)
                charLength = 1500; // markup text fails after 1500 char
            try {
                let msgIdList = [];
                if (msg.length >= charLength) {
                    // no markup obj reply
                    let index_to_cut = msg.substr(0, charLength).search(/(\n).*$/);
                    let res1 = yield this.sendMessage(msg.substr(0, index_to_cut), silence, html, telegramId);
                    let res2 = yield this.sendMessage(msg.substr(index_to_cut), silence, html, telegramId, MarkupObj);
                    if (res1)
                        msgIdList = msgIdList.concat(res1);
                    if (res2)
                        msgIdList = msgIdList.concat(res2);
                    return msgIdList;
                }
                else {
                    let res = (_b = (yield ((_a = this.bot) === null || _a === void 0 ? void 0 : _a.telegram.sendMessage(telegramId, msg, {
                        parse_mode: html ? "HTML" : undefined,
                        disable_notification: silence !== null && silence !== void 0 ? silence : false,
                        reply_markup: MarkupObj !== null && MarkupObj !== void 0 ? MarkupObj : undefined,
                    })))) === null || _b === void 0 ? void 0 : _b.message_id;
                    if (res)
                        return [res];
                    return false;
                }
            }
            catch (e) {
                return false;
            }
        });
    }
    loadGrpData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //get request for grp
                let result = (yield axios_1.default.get(`${this.idQueryParams}${this.groupCode}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
                    },
                })).data;
                //string manipulation to retrieve json data from get result
                result = result.split("loadContents('")[1];
                //checking if the id is valid
                result = result.split(`', '');`);
                if (result.length == 1)
                    throw "INVALID";
                //retrive result
                return { error: false, response: JSON.parse(result[0]) };
            }
            catch (e) {
                this.console_with_user(e);
                return { error: true, err: e };
            }
        });
    }
    submitTemp(date, meridies, temperature) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = {
                groupCode: this.groupCode,
                date: date,
                meridies: meridies.toUpperCase(),
                memberId: this.uid,
                temperature: temperature,
                pin: this.pin,
            };
            try {
                let res = yield axios_1.default.post(`${this.tempSubmission}`, qs.stringify(query), {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
                    },
                });
                switch (res.data) {
                    case "Please enter your pin.<br/>":
                        yield this.sendMessage("you do not have a pin, please update it in settings under /app");
                        return false;
                    case "Wrong pin.":
                        yield this.sendMessage("your pin is incorrect, please update it in settings under /app");
                        return false;
                    case "Member does not exist.":
                        yield this.sendMessage("your member id is incorrect, please update it in settings under /app");
                        return false;
                    case "Group does not exist.":
                        yield this.sendMessage("your group id is incorrect, please update it in settings under /app");
                        return false;
                    case "OK":
                        this.console_with_user("temperature submitted");
                        return true;
                    default:
                        this.console_with_user("unknown response.");
                        return "network_err";
                }
            }
            catch (error) {
                return "network_err";
            }
        });
    }
    messageHandler(msg) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.msg_generator.length)
                return;
            while (this.msg_generator.length) {
                do {
                    this.last_msg = yield this.msg_generator[0].next(msg); // true
                } while (!this.last_msg.done && !((_a = this.last_msg.value) !== null && _a !== void 0 ? _a : true));
                if (this.last_msg.done) {
                    this.msg_generator.shift();
                }
                else {
                    return;
                }
            }
            return;
        });
    }
    setReminderGen(overview_reminder, meridies, time) {
        return __asyncGenerator(this, arguments, function* setReminderGen_1() {
            let result = false;
            const name = overview_reminder ? "your group's" : "your";
            if (!meridies) {
                yield __await(this.sendMessage(`Enter AM if you want to be reminded of ${name} AM submission daily.`));
                yield __await(this.sendMessage(`Enter PM if you want to be reminded of ${name} temperature submission daily.`, undefined, undefined, undefined, {
                    keyboard: [[{ text: "AM" }], [{ text: "PM" }]],
                    one_time_keyboard: true,
                }));
                while (!result) {
                    yield yield __await(true);
                    let res = yield yield __await(false);
                    if (res) {
                        res = res.toUpperCase();
                        if (res == "AM" || res == "PM") {
                            meridies = res;
                            break;
                        }
                    }
                    yield __await(this.sendMessage(`Invalid Response!`));
                }
            }
            else {
                if (meridies != "AM" && meridies != "PM")
                    yield __await(this.sendMessage(`Invalid Meridies.`));
            }
            if (!time) {
                yield __await(this.sendMessage(`Enter the time you wish to be informed of ${name} temperature check.`, undefined, undefined, undefined, { remove_keyboard: true }));
                yield __await(this.sendMessage(`Enter remove if you wished to delete this daily reminder.`));
                while (!result) {
                    yield yield __await(true);
                    let res = yield yield __await(false);
                    if (res.toUpperCase() == "REMOVE") {
                        time = "remove";
                        result = true;
                    }
                    else if (this.validTime(res)) {
                        time = res;
                        result = true;
                    }
                    else {
                        yield __await(this.sendMessage(`Invalid format. Time should be of 24h format: HH:MM`));
                    }
                }
            }
            else if (!this.validTime(time) && time != "remove") {
                yield __await(this.sendMessage(`Invalid format. Time should be of 24h format: HH:MM`));
            }
            let msg = this.updateScheduleParam(overview_reminder, meridies, time);
            yield __await(this.sendMessage(msg));
            return yield __await(true);
        });
    }
    submitTemperatureGen(date, meridies, temperature, safe_check = this.careful_submission) {
        return __asyncGenerator(this, arguments, function* submitTemperatureGen_1() {
            let result = false;
            meridies = meridies === null || meridies === void 0 ? void 0 : meridies.toUpperCase();
            if (!date) {
                yield __await(this.sendMessage(`Please enter the date for the temperature you wish to submit`));
                while (!result) {
                    yield yield __await(true);
                    date = yield yield __await(false);
                    if (!this.readDate(date !== null && date !== void 0 ? date : " ")) {
                        yield __await(this.sendMessage(`Invalid date. Date should be of format DD:MM:YYYY`));
                    }
                    else {
                        result = true;
                    }
                }
            }
            else if (!this.readDate(date)) {
                yield __await(this.sendMessage(`Invalid date. Date should be of format DD:MM:YYYY`));
            }
            result = false;
            if (!meridies) {
                while (!result) {
                    yield __await(this.sendMessage(`Please enter either AM or PM for the meridies you want to submit!`));
                    yield yield __await(true);
                    meridies = yield yield __await(false);
                    meridies = meridies.toUpperCase();
                    if (meridies && (meridies == "AM" || meridies == "PM")) {
                        result = true;
                        break;
                    }
                }
            }
            else if (!(meridies == "AM" || meridies == "PM")) {
                yield __await(this.sendMessage(`Please enter either AM or PM for the meridies you want to submit!`));
                return yield __await(true);
            }
            if ((meridies == "PM" && new Date() < this.readDate(date + " 12:00")) ||
                (meridies == "AM" && new Date() < this.readDate(date + " 00:00"))) {
                yield __await(this.sendMessage(`You can't submit this temperature yet!`));
                return yield __await(true);
            }
            if (safe_check) {
                let validator = yield __await(this.validateTempSubmission(date, meridies));
                if (validator.network_error) {
                    yield __await(this.sendMessage(`unable to connect to the server to check your temperature. Continuing anyway...\nType /skip if you do not wish to submit the temperature`));
                }
                else if (validator.response) {
                    yield __await(this.sendMessage(`You have already submitted your temperature for ${date} ${meridies}`));
                    return yield __await(true);
                }
            }
            let submission_temperature = 36.0;
            result = false;
            if (!temperature) {
                yield __await(this.sendMessage(`Please enter your temperature for ${date} ${meridies}`));
                while (!result) {
                    yield yield __await(true);
                    submission_temperature = parseFloat(yield yield __await(false));
                    if (submission_temperature <= 45 &&
                        submission_temperature >= 30 &&
                        !isNaN(submission_temperature)) {
                        result = true; // valid temp range
                    }
                    else {
                        yield __await(this.sendMessage(`Please enter a valid temperature`));
                        continue;
                    }
                }
            }
            else {
                submission_temperature = parseFloat(temperature);
                if (!(submission_temperature <= 45 &&
                    submission_temperature >= 30 &&
                    !isNaN(submission_temperature))) {
                    yield __await(this.sendMessage(`Please enter a valid temperature`));
                    return yield __await(true);
                }
            }
            let res = yield __await(this.submitTemp(date, meridies, submission_temperature));
            if (res == "network_err") {
                yield __await(this.sendMessage(`We were unable to submit your temperature due to a network error`));
            }
            else if (res) {
                yield __await(this.sendMessage(`Temperature submitted`));
            }
            else {
                yield __await(this.sendMessage(`We were unable to submit your temperature due to invalid information`));
            }
            return yield __await(true);
        });
    }
    safeSubmitGen(enable) {
        return __asyncGenerator(this, arguments, function* safeSubmitGen_1() {
            let result = false;
            if (enable == undefined) {
                yield __await(this.sendMessage(`Do you wish to enable safe submission mode?`));
                yield __await(this.sendMessage(`With this turned on, it will disallow you to submit duplicate submissions when submitting temperatures. \n\nYou can still use force submit to submit it or turn it off in settings under /app\n\nThe downside is it might lead to slow connection should the history function of the temptaking.ado site be down!`, undefined, undefined, undefined, {
                    keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                    one_time_keyboard: true,
                }));
                while (!result) {
                    yield yield __await(true);
                    let res = yield yield __await(false);
                    if (res.toUpperCase() == "YES") {
                        this.careful_submission = true;
                        yield __await(this.sendMessage(`Safe submit has been enabled`, undefined, undefined, undefined, { remove_keyboard: true }));
                        return yield __await(true);
                    }
                    else if (res.toUpperCase() == "NO") {
                        this.careful_submission = false;
                        yield __await(this.sendMessage(`Safe submit has been disabled`, undefined, undefined, undefined, { remove_keyboard: true }));
                        return yield __await(true);
                    }
                    yield __await(this.sendMessage(`Invalid response`));
                }
            }
            else {
                this.careful_submission = enable;
                yield __await(this.sendMessage(`safe submit has been ${enable ? "enabled" : "disabled"}.`));
            }
            return yield __await(true);
        });
    }
    addNewFilterGen() {
        return __asyncGenerator(this, arguments, function* addNewFilterGen_1() {
            let result = false;
            while (!result) {
                yield __await(this.sendMessage(`Please enter a list of filter names to add on to the filter list or type /empty to clear out filter list`));
                yield __await(this.sendMessage("(You can use + to act as trailing or leading white spaces)\n" +
                    "(e.g. if your names appear as P3 <xxx>, you can enter P3+ to display only the names containing P3 when using range_checks)\n" +
                    "(you can also add multiple filters to directly search for names if there is no prominent identifier or intersecting identifiers)"));
                yield __await(this.sendMessage(`Current list:\n${this.filter_list.join("\n")}`));
                yield yield __await(true);
                let reply = yield yield __await(false);
                if (reply == "/empty") {
                    this.filter_list = [];
                    yield __await(this.sendMessage(`The filter list has been emptied`));
                }
                else {
                    this.filter_list = this.filter_list.concat(reply.split("\n").map((x) => x.trim().replace("+", " ")));
                }
                yield __await(this.sendMessage("Do you wish to add more to the filter list?", undefined, undefined, undefined, {
                    keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                    one_time_keyboard: true,
                }));
                result = true;
                yield yield __await(true);
                reply = yield yield __await(false);
                if (reply.toUpperCase() == "YES")
                    result = false;
            }
            this.saveProfile();
            yield __await(this.sendMessage(`filter list has been updated\nCurrent filter list:\n${this.filter_list.join("\n")}`, undefined, undefined, undefined, { remove_keyboard: true }));
            return yield __await(true);
        });
    }
    addOverviewGen(url) {
        return __asyncGenerator(this, arguments, function* addOverviewGen_1() {
            let result = false;
            if (url == undefined) {
                let overviewCodeUrl;
                yield __await(this.sendMessage("If you have access rights to the overview site, please enter the overview site url. Type NA if it's not applicable to you."));
                yield __await(this.sendMessage("The url are of format:\n https://temptaking.ado.sg/overview/xxxxxxxxx"));
                while (!result) {
                    // get overviewcode
                    yield yield __await(true);
                    overviewCodeUrl = yield yield __await(false);
                    if (overviewCodeUrl == "NA") {
                        this.overviewCode = "";
                        this.overviewName = "";
                        this.saveProfile();
                        yield __await(this.sendMessage("skipping..."));
                        return yield __await(true);
                    }
                    result = yield __await(this.saveOverviewCode(overviewCodeUrl));
                    if (!result) {
                        yield __await(this.sendMessage("Please enter a VALID overview url for your temperature taking group"));
                    }
                    else {
                        this.saveProfile();
                        yield __await(this.sendMessage("Overview code has been saved!"));
                        return yield __await(true);
                    }
                }
            }
            else {
                result = yield __await(this.saveOverviewCode(url));
                if (!result) {
                    yield __await(this.sendMessage("The url provided is invalid!"));
                }
                else {
                    this.saveProfile();
                    yield __await(this.sendMessage("Overview code has been saved!"));
                }
            }
            return yield __await(true);
        });
    }
    updatePinGen() {
        return __asyncGenerator(this, arguments, function* updatePinGen_1() {
            yield __await(this.sendMessage("Please enter your new password!"));
            while (1) {
                yield yield __await(true);
                let new_pin = yield yield __await(false);
                if (new_pin.length == 4 && !isNaN(new_pin)) {
                    yield __await(this.sendMessage("Pin has been updated"));
                    this.pin = new_pin;
                    break;
                }
                yield __await(this.sendMessage("Invalid pin format!"));
            }
            this.saveProfile();
            return yield __await(true);
        });
    }
    addTempAccGen() {
        var _a, _b;
        return __asyncGenerator(this, arguments, function* addTempAccGen_1() {
            let result = false;
            let groupCodeUrl;
            yield __await(this.sendMessage("Please enter a your temperature taking group url"));
            yield __await(this.sendMessage("The url are of format\n https://temptaking.ado.sg/group/xxxxxxxxx"));
            while (!result) {
                // save groupCode
                yield yield __await(true);
                groupCodeUrl = yield yield __await(false);
                result = yield __await(this.saveGroupCode(groupCodeUrl));
                if (!result) {
                    yield __await(this.sendMessage("Please enter a VALID temperature taking group url"));
                }
            }
            let dataRes = yield __await(this.loadGrpData());
            if (dataRes.error) {
                this.msg_generator.shift();
                this.last_msg.done = true;
                this.messageHandler("");
                yield __await(this.sendMessage("an error occured while trying to load the data."));
                return yield __await(true);
            }
            let grp_members = (_b = (_a = dataRes.response) === null || _a === void 0 ? void 0 : _a.members) !== null && _b !== void 0 ? _b : [];
            let member_names = grp_members.map((member) => [
                {
                    text: member.identifier,
                },
            ]);
            result = false;
            let temp_name = "";
            while (!result) {
                yield __await(this.sendMessage("Please select in exactly your name found in the list!", undefined, undefined, undefined, { keyboard: member_names, one_time_keyboard: true }));
                // get id and name
                yield yield __await(true);
                temp_name = yield yield __await(false);
                for (let member of grp_members) {
                    if (member.identifier == temp_name) {
                        this.uid = member.id;
                        this.name = member.identifier;
                        result = true;
                        break;
                    }
                }
            }
            result = false;
            yield __await(this.sendMessage("Please enter your pin, this bot will send a temperature history request to the ado server to verify your profile."));
            while (!result) {
                yield yield __await(true);
                let pin = yield yield __await(false);
                if (pin.length == 4 && !isNaN(pin)) {
                    this.pin = pin;
                    yield __await(this.sendMessage("Verifying profile... Please be patient!"));
                    let res = yield __await(this.validateTempSubmission("31/08/2020", "AM"));
                    if (res.network_error) {
                        yield __await(this.sendMessage("We've encountered a network error while trying to verify the profile\n We will proceed as normal if you wish to change your pin afterwards, you can change it in settings."));
                        break;
                    }
                    else if (!res.pinErr) {
                        yield __await(this.sendMessage("Profile has been verified!"));
                        break;
                    }
                    else {
                        yield __await(this.sendMessage("Pin is incorrect, please try again!"));
                        continue;
                    }
                }
                yield __await(this.sendMessage("Invalid Pin"));
            }
            this.saveProfile();
            return yield __await(true);
        });
    }
    tempCheckGen(group, date) {
        var _a;
        return __asyncGenerator(this, arguments, function* tempCheckGen_1() {
            if (date == undefined) {
                yield __await(this.sendMessage("Please enter the date you wish to check."));
                while (1) {
                    yield yield __await(true);
                    date = yield yield __await(false);
                    let dateObj = this.readDate(date);
                    if (dateObj)
                        break;
                    yield __await(this.sendMessage("Invalid date. Dates should be of format DD:MM:YYYY"));
                }
            }
            else {
                let dateObj = this.readDate(date);
                if (!dateObj) {
                    yield __await(this.sendMessage("Invalid date. Dates should be of format DD:MM:YYYY"));
                    return yield __await(true);
                }
            }
            if (!group) {
                let result = yield __await(this.TempSubmissionCheck(date, "BOTH"));
                if (result) {
                    yield __await(this.sendMessage(result.msg, false, true));
                    this.fillIn(result.data);
                }
            }
            else {
                let result = yield __await(this.groupTempCheck(date, "BOTH", undefined));
                if (result) {
                    let msgId = yield __await(this.sendMessage(result.msg, false, true, undefined, {
                        inline_keyboard: [
                            [{ text: "Remind users", callback_data: "remind_grp" }],
                        ],
                    }));
                    if (msgId) {
                        this.last5range_check.push({
                            msgId: msgId,
                            past_checks: result.data,
                        });
                        while (this.last5range_check.length > 5) {
                            let obj = this.last5range_check.shift();
                            try {
                                yield __await(((_a = this.bot) === null || _a === void 0 ? void 0 : _a.telegram.editMessageReplyMarkup(this.telegram_id, obj === null || obj === void 0 ? void 0 : obj.msgId.slice(-1)[0], undefined, undefined)));
                            }
                            catch (e) { }
                        }
                    }
                }
            }
            return yield __await(true);
        });
    }
    rangeCheckGen(group, s_date, e_date) {
        var _a, _b, _c;
        return __asyncGenerator(this, arguments, function* rangeCheckGen_1() {
            if (s_date == undefined) {
                yield __await(this.sendMessage("Please enter the starting date."));
                while (1) {
                    yield yield __await(true);
                    s_date = yield yield __await(false);
                    let dateObj = this.readDate(s_date);
                    if (dateObj)
                        break;
                    yield __await(this.sendMessage("Invalid date. Dates should be of format DD:MM:YYYY"));
                }
            }
            else {
                let dateObj = this.readDate(s_date);
                if (!dateObj) {
                    yield __await(this.sendMessage("Invalid date. Dates should be of format DD:MM:YYYY"));
                    return yield __await(true);
                }
            }
            if (e_date == undefined) {
                yield __await(this.sendMessage('Please enter ending date. \nEnter "today" (without quotes) if you want the end date to be today.'));
                while (1) {
                    yield yield __await(true);
                    e_date = yield yield __await(false);
                    if (e_date == "today") {
                        e_date = new Date().toLocaleDateString("en-GB");
                        break;
                    }
                    let dateObj = this.readDate(e_date);
                    if (dateObj)
                        break;
                    yield __await(this.sendMessage("Invalid date. Dates should be of format DD:MM:YYYY"));
                }
            }
            else {
                let dateObj = this.readDate(e_date);
                if (!dateObj) {
                    yield __await(this.sendMessage("Invalid date. Dates should be of format DD:MM:YYYY"));
                    return yield __await(true);
                }
            }
            yield __await(((_a = this.bot) === null || _a === void 0 ? void 0 : _a.telegram.sendChatAction(this.telegram_id, "typing")));
            if (group) {
                let result = yield __await(this.groupRangeTempCheck(s_date, e_date));
                if (result) {
                    let msgId = yield __await(this.sendMessage(result.msg, false, true, undefined, {
                        inline_keyboard: [
                            [{ text: "Remind users", callback_data: "remind_grp" }],
                        ],
                    }));
                    if (msgId) {
                        this.last5range_check.push({
                            msgId: msgId,
                            past_checks: result.data,
                        });
                        while (this.last5range_check.length > 5) {
                            let obj = this.last5range_check.shift();
                            try {
                                yield __await(((_b = this.bot) === null || _b === void 0 ? void 0 : _b.telegram.editMessageReplyMarkup(this.telegram_id, obj === null || obj === void 0 ? void 0 : obj.msgId.slice(-1)[0], undefined, undefined)));
                            }
                            catch (e) { }
                        }
                    }
                }
            }
            else {
                let result = yield __await(this.rangeTempSubmissionCheck(s_date, e_date));
                if (result) {
                    let msgId = yield __await(this.sendMessage(result.msg, undefined, true, undefined, {
                        inline_keyboard: [
                            [
                                {
                                    text: "Fill in mising temperatures",
                                    callback_data: "fill_temp",
                                },
                            ],
                        ],
                    }));
                    if (msgId) {
                        this.last5range_individual_check.push({
                            msgId: msgId,
                            past_checks: result.data,
                        });
                        while (this.last5range_individual_check.length > 5) {
                            let obj = this.last5range_individual_check.shift();
                            try {
                                yield __await(((_c = this.bot) === null || _c === void 0 ? void 0 : _c.telegram.editMessageReplyMarkup(this.telegram_id, obj === null || obj === void 0 ? void 0 : obj.msgId.slice(-1)[0], undefined, undefined)));
                            }
                            catch (e) { }
                        }
                    }
                }
            }
            return yield __await(true);
        });
    }
    YesNoGen(question, yesFun, noFun) {
        return __asyncGenerator(this, arguments, function* YesNoGen_1() {
            let exeFun = function () {
                return __asyncGenerator(this, arguments, function* () {
                    return yield __await(true);
                });
            };
            while (1) {
                yield __await(this.sendMessage(question, undefined, undefined, undefined, {
                    keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
                    one_time_keyboard: true,
                }));
                yield yield __await(true);
                let reply = (yield yield __await(false)).toUpperCase();
                if (reply == "YES") {
                    if (yesFun)
                        exeFun = yesFun;
                    break;
                }
                else if (reply == "NO") {
                    if (noFun)
                        exeFun = noFun;
                    break;
                }
            }
            let acGen = exeFun();
            let result = false;
            let res;
            let reply = "";
            while (!result) {
                do {
                    res = yield __await(acGen.next(reply));
                    if (res.done) {
                        res.value = false;
                        result = true;
                    }
                    yield yield __await(res.value);
                } while (!res.done && !res.value);
                if (res.value && !res.done)
                    reply = yield yield __await(false);
            }
            return yield __await(true);
        });
    }
    conditonalGen(condition, trueGen, falseGen) {
        return __asyncGenerator(this, arguments, function* conditonalGen_1() {
            let exeFun = function () {
                return __asyncGenerator(this, arguments, function* () {
                    return yield __await(true);
                });
            };
            if (yield __await(condition())) {
                if (trueGen)
                    exeFun = trueGen;
            }
            else {
                if (falseGen)
                    exeFun = falseGen;
            }
            let acGen = exeFun();
            let result = false;
            let res;
            let reply = "";
            while (!result) {
                do {
                    res = yield __await(acGen.next(reply));
                    if (res.done) {
                        res.value = false;
                        result = true;
                    }
                    yield yield __await(res.value);
                } while (!res.done && !res.value);
                if (res.value && !res.done)
                    reply = yield yield __await(false);
            }
            return yield __await(true);
        });
    }
    sendMessageGen(msg, silence, html, telegramId = this.telegram_id, MarkupObj) {
        return __asyncGenerator(this, arguments, function* sendMessageGen_1() {
            yield __await(this.sendMessage(msg, silence, html, telegramId, MarkupObj));
            return yield __await(true);
        });
    }
    getDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.add_to_genQ(this.addTempAccGen(), true);
            yield this.add_to_genQ(this.safeSubmitGen(), true);
            yield this.add_to_genQ(this.addOverviewGen(), true);
            yield this.add_to_genQ(this.conditonalGen(() => this.overviewCode == "", undefined, () => {
                return this.YesNoGen("Do you wish to add a list of filters to the group list?\n", () => this.addNewFilterGen(), undefined);
            }), true);
            yield this.add_to_genQ(this.conditonalGen(() => this.uid != "", () => this.sendMessageGen("Thank you for setting up your profile", undefined, undefined, undefined, { remove_keyboard: true }), () => this.sendMessageGen("Some key informations is missing, please /start and register again!", undefined, undefined, undefined, { remove_keyboard: true })), true);
        });
    }
    remindMsg(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let range_check of this.last5range_check) {
                if (range_check.msgId.includes(msgId)) {
                    let failure_list = [];
                    let success_list = [];
                    for (let reminder of range_check.past_checks.remind_list) {
                        if (yield this.remindUser(reminder, range_check.past_checks.reminder)) {
                            success_list.push(reminder.name);
                        }
                        else {
                            failure_list.push(reminder.name);
                        }
                    }
                    if (success_list.length) {
                        yield this.sendMessage("The following members have been informed:\n" +
                            success_list.join("\n"));
                        return;
                    }
                    if (failure_list.length) {
                        yield this.sendMessage("Msg failed to deliver to the following registered users:\n" +
                            failure_list.join("\n"));
                        return;
                    }
                    if (!(failure_list.length && success_list.length)) {
                        yield this.sendMessage("None of the members in the list has a registered profile in this telegram bot!");
                        return;
                    }
                }
            }
            yield this.sendMessage("The message is no longer available to be used. only the last 5 group check is saved. do a /check_grp <date> and /remind on the result ");
        });
    }
    pushMessage(msg_gen, entry) {
        if (entry.meridies == "BOTH") {
            msg_gen.push(this.submitTemperatureGen(entry.date, "AM"));
            msg_gen.push(this.submitTemperatureGen(entry.date, "PM"));
        }
        else {
            msg_gen.push(this.submitTemperatureGen(entry.date, entry.meridies));
        }
    }
    fillIn(missing_entries) {
        // fills in individual entries from a past ranged check
        for (let entry of missing_entries) {
            this.pushMessage(this.msg_generator, entry);
        }
        if (this.last_msg.done) {
            this.messageHandler("");
        }
    }
    fillReplyMsg(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let range_check of this.last5range_individual_check) {
                if (range_check.msgId.includes(msgId)) {
                    yield this.sendMessage("sending you the fill in list...\nType /skip or /skipall to skip one or all of the submissions respectively");
                    this.fillIn(range_check.past_checks);
                    return;
                }
            }
            yield this.sendMessage("The message is no longer available to be used. only the last 5 individual RANGE check is saved. do a /check <sdate> <edate> and /fill on the result ");
        });
    }
    remindUser(missing_entries, reminder) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = true;
            let reminded_user = this.findUser(missing_entries.telegram_id);
            if (!reminded_user)
                return false;
            yield reminded_user.sendMessage(`You have been reminded by ${reminder} to send your temperature for the following:`);
            for (let entry of missing_entries.missing_entries) {
                let success = yield reminded_user.sendMessage(`${entry.date}: ${entry.meridies} submissions`);
                if (!success)
                    res = false;
                reminded_user.pushMessage(reminded_user.msg_generator, entry);
            }
            if (reminded_user.last_msg.done) {
                reminded_user.messageHandler("");
            }
            return res;
        });
    }
    merge_items(arr1, indexfunc, mergefunc) {
        let recordObj = {};
        let returnArr = [];
        for (let value of arr1) {
            let key = indexfunc(value);
            if (recordObj[key]) {
                recordObj[key] = mergefunc(recordObj[key], value);
            }
            else
                recordObj[key] = value;
        }
        for (let key in recordObj) {
            returnArr.push(recordObj[key]);
        }
        return returnArr;
    }
    console_with_user(text) {
        console.log(this.telegram_id, text);
    }
    remove_dup(arr1, indexfunc) {
        // O(n) solution to removing duplicate with key map hashing
        let recordObj = {};
        let returnArr = [];
        for (let value of arr1) {
            let key = indexfunc(value);
            recordObj[key] = value;
        }
        for (let key in recordObj) {
            returnArr.push(recordObj[key]);
        }
        return returnArr;
    }
}
exports.TemperatureUser = TemperatureUser;
