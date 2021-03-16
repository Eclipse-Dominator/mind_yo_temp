import axios from "axios";
import * as qs from "query-string";
import {
  validateTempSubmissionResponse,
  tempHistoryEntry,
  grpDataResponse,
  grpUser,
  task,
  overviewResponse,
  save_user,
  save_file,
  past_grp_checks,
  grpMissingEntryResponse,
  past_grp_check_messages,
  missing_user_entries,
  overviewUser,
  missing_entry,
  past_indivual_check,
  past_individual_check_messages,
  update_Context,
} from "./user_interface";
import Telegraf from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";
import {
  ExtraReplyMessage,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from "telegraf/typings/telegram-types";

axios.defaults.timeout = 10000;
export class TemperatureUser {
  uid: number | string = "";
  name: string = "";
  overviewCode: string = "";
  groupCode: string = "";
  pin: string | number = "";
  msg_generator: AsyncGenerator<unknown, boolean, string>[] = [];
  last_msg: IteratorResult<any, any> = { value: undefined, done: true };
  bot: Telegraf<TelegrafContext> | undefined;
  task_generator: Generator<unknown, void, string | undefined>;
  AM_PM_timer_check: [string, string] = ["", ""];
  AM_PM_timer_group: [string, string] = ["", ""];
  filter_list: string[] = [];
  careful_submission: boolean = false;
  groupName: string = "";
  overviewName: string = "";

  task_list: task[] = [];
  last5range_check: past_grp_check_messages[] = [];
  last5range_individual_check: past_individual_check_messages[] = [];

  idQueryParams = "https://temptaking.ado.sg/group/";
  tempSubmission = "https://temptaking.ado.sg/group/MemberSubmitTemperature";
  tempHistory = "https://temptaking-ne.ado.sg/group/MemberListPastRecords";
  grpHistory = "https://temptaking.ado.sg/overview/ListGroupTemperatureRecords";

  constructor(
    public telegram_id: number,
    private saveQ: save_file,
    private findUser: (arg: number) => false | TemperatureUser,
    private saveFile: () => Promise<void>
  ) {
    this.task_generator = this.taskloop();
    this.task_generator.next();
  }

  getTelegramID(uid: number): number | false {
    for (let teleId in this.saveQ) {
      if (this.saveQ[teleId].uid == uid) return (teleId as unknown) as number;
    }
    return false;
  }

  getSaveUser(): save_user {
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

  async displayProfile(): Promise<void> {
    await this.sendMessage(
      `Name: ${this.name}\n` +
        `UserID: ${this.uid}\n` +
        `Group: ${this.groupName}\n` +
        `GroupID: ${this.groupCode}\n` +
        `AM Reminder: ${
          this.AM_PM_timer_check[0] == ""
            ? "Not set yet"
            : this.AM_PM_timer_check[0] + " daily"
        }\n` +
        `PM Reminder: ${
          this.AM_PM_timer_check[1] == ""
            ? "Not set yet"
            : this.AM_PM_timer_check[1] + " daily"
        }\n`
    );

    if (this.overviewCode) {
      await this.sendMessage(
        `Overview: ${this.overviewName}\n` +
          `OverviewID: ${this.overviewCode}\n` +
          `Group AM Check: ${
            this.AM_PM_timer_group[0] == ""
              ? "Not set yet"
              : this.AM_PM_timer_group[0] + " daily"
          }\n` +
          `Group PM Check: ${
            this.AM_PM_timer_group[1] == ""
              ? "Not set yet"
              : this.AM_PM_timer_group[1] + " daily"
          }\n`
      );
      if (this.filter_list.length)
        await this.sendMessage("Filter List:\n" + this.filter_list.join("\n"));
      else await this.sendMessage("Filter List:\nNo filters has been added!");
    }
  }

  readDate(dateString: string): Date | false {
    //read ddmmyyyy or ddmmyyyy hh:mm and returns a Date object
    try {
      dateString = dateString.trim();
      let res = dateString.split(/ +/);
      let date: string, time: string, hh: number, mm: number;
      if (res.length == 2) {
        [date, time] = res;
        [hh, mm] = time.split(":").map((x) => parseInt(x));
      } else {
        date = res[0];
        hh = mm = 0;
      }
      let [day, month, year] = date.split("/").map((x) => parseInt(x));
      if (month > 12 || day > 31 || month < 1 || day < 1 || year < 2020)
        return false;
      let returnable_date = new Date(year, month - 1, day, hh, mm);
      if (returnable_date.toString() == "Invalid Date") throw "invalid date";
      return new Date(year, month - 1, day, hh, mm);
    } catch (e) {
      return false;
    }
  }

  *taskloop(): Generator<unknown, void, string | undefined> {
    this.console_with_user(`initializing program for ${this.telegram_id}`);
    let lastTimeToDoTask: string = "-1";
    let lastTask: task | undefined;
    let schedule: NodeJS.Timeout | number | undefined;
    while (1) {
      let log = yield; // calls this when there is a change to the Queuelist
      //this.console_with_user(`Called by ${log}\n`) for debugging
      this.saveProfile();

      if (this.task_list.length) {
        if (
          lastTask == this.task_list[0] &&
          lastTimeToDoTask == this.task_list[0].date_time_scheduled
        ) {
          // no change from last set time cos same object
          continue;
        } else {
          // new task added
          // or
          // somewhere the next task object is changed
          clearTimeout(schedule as NodeJS.Timeout);
          let lastTask = this.task_list[0];
          let current_time = new Date();
          let next_time = this.readDate(lastTask.date_time_scheduled);
          if (!next_time) continue;
          schedule = setTimeout(
            this.doTask.bind(this),
            next_time.getTime() - current_time.getTime(),
            lastTask
          );
          lastTimeToDoTask = lastTask.date_time_scheduled;
        }
      }
    }
  }

  async add_to_genQ(
    generator: AsyncGenerator<unknown, boolean, string>,
    silence: boolean = false
  ): Promise<void> {
    this.msg_generator.push(generator);
    if (!this.last_msg.done) {
      if (!silence)
        await this.sendMessage(
          "There is currently a task in queue, will append this task after the current one is complete. \nYou can Type /skip to skip the current task"
        );
    } else {
      await this.messageHandler("");
    }
  }

  async handleCb(ctx: update_Context): Promise<boolean> {
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) return false;

    switch (ctx.callbackQuery.data) {
      case "goto_home":
        await ctx.editMessageReplyMarkup(this.generateBtns("home"));
        break;
      case "goto_settings":
        await ctx.editMessageReplyMarkup(this.generateBtns("settings"));
        break;
      case "goto_acc":
        await ctx.editMessageReplyMarkup(this.generateBtns("acc_settings"));
        break;
      case "goto_indi":
        await ctx.editMessageReplyMarkup(this.generateBtns("individual"));
        break;
      case "goto_group":
        await ctx.editMessageReplyMarkup(this.generateBtns("group"));
        break;
      case "goto_temp_submit":
        await ctx.editMessageReplyMarkup(this.generateBtns("submit"));
        break;
      case "goto_temp_force":
        await ctx.editMessageReplyMarkup(this.generateBtns("submit_force"));
        break;
      case "submit":
        await this.add_to_genQ(this.submitTemperatureGen());
        break;
      case "submit_am":
        await this.add_to_genQ(
          this.submitTemperatureGen(
            new Date().toLocaleDateString("en-GB"), // date
            "AM" // meridies
          )
        );
        break;
      case "submit_pm":
        await this.add_to_genQ(
          this.submitTemperatureGen(
            new Date().toLocaleDateString("en-GB"), // date
            "PM" // meridies
          )
        );
        break;
      case "force_submit":
        await this.add_to_genQ(
          this.submitTemperatureGen(undefined, undefined, undefined, false)
        );
        break;
      case "force_submit_am":
        await this.add_to_genQ(
          this.submitTemperatureGen(
            new Date().toLocaleDateString("en-GB"),
            "AM",
            undefined,
            false
          )
        );
        break;
      case "force_submit_pm":
        await this.add_to_genQ(
          this.submitTemperatureGen(
            new Date().toLocaleDateString("en-GB"),
            "PM",
            undefined,
            false
          )
        );
        break;
      case "change_grp":
        await this.add_to_genQ(this.addTempAccGen());
        break;
      case "change_overview":
        await this.add_to_genQ(this.addOverviewGen());
        break;
      case "change_pin":
        await this.add_to_genQ(this.updatePinGen());
        break;
      case "grp_reminder":
        await this.add_to_genQ(this.setReminderGen(true));
        break;
      case "indi_reminder":
        await this.add_to_genQ(this.setReminderGen(false));
        break;
      case "safe_off":
        this.careful_submission = false;
        this.saveProfile();
        await this.sendMessage(
          `Safe submit has been disabled`,
          undefined,
          undefined,
          undefined,
          { remove_keyboard: true }
        );
        await ctx.editMessageReplyMarkup(this.generateBtns("settings"));
        break;
      case "safe_on":
        this.careful_submission = true;
        this.saveProfile();
        await this.sendMessage(
          `Safe submit has been enabled`,
          undefined,
          undefined,
          undefined,
          { remove_keyboard: true }
        );
        await ctx.editMessageReplyMarkup(this.generateBtns("settings"));
        break;
      case "update_filter":
        await this.add_to_genQ(this.addNewFilterGen());
        break;
      case "view_profile":
        await this.displayProfile();
        break;
      case "check":
        await this.add_to_genQ(this.tempCheckGen(false));
        break;
      case "check_today":
        await this.add_to_genQ(
          this.tempCheckGen(false, new Date().toLocaleDateString("en-GB"))
        );
        break;
      case "range_check":
        await this.add_to_genQ(this.rangeCheckGen(false));
        break;
      case "grp_check_today":
        await this.add_to_genQ(
          this.tempCheckGen(true, new Date().toLocaleDateString("en-GB"))
        );
        break;
      case "grp_check":
        await this.add_to_genQ(this.tempCheckGen(true));
        break;
      case "range_grp_check":
        await this.add_to_genQ(this.rangeCheckGen(true));
        break;
      case "remind_grp":
        if (ctx.callbackQuery.message) {
          await ctx.replyWithChatAction("typing");
          await this.remindMsg(ctx.callbackQuery.message.message_id);
          await ctx.editMessageReplyMarkup();
        }
        break;
      case "fill_temp":
        if (ctx.callbackQuery.message) {
          await ctx.replyWithChatAction("typing");
          await this.fillReplyMsg(ctx.callbackQuery.message.message_id);
          await ctx.editMessageReplyMarkup();
        }
        break;
    }

    return true;
  }
  generateBtns(
    state:
      | "acc_settings"
      | "settings"
      | "home"
      | "individual"
      | "group"
      | "submit"
      | "submit_force"
  ): InlineKeyboardMarkup | undefined {
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

  addTasktoQ(task: task): void {
    // add task sorted into Queue
    if (this.task_list.length) {
      let date = this.readDate(task.date_time_scheduled);
      if (!date) return;
      let i: string | number = 0;
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
    } else {
      this.task_list.push(task);
    }
    this.task_generator.next();
  }

  async doTask(task: task): Promise<void> {
    if (new Date() < this.readDate(task.date_time_scheduled)) {
      // removes task for whatever reason
      this.task_list.shift();
      this.task_generator.next();
      return;
    }
    let reply_msg: string = "";
    await this.sendMessage(
      `Doing routine check for your ${
        task.overview_reminder ? "group's" : ""
      } temperature submissions by ${task.date_time_scheduled}.`
    );
    let res: grpMissingEntryResponse | false = false;
    let submission_res: past_indivual_check | false = false;
    if (task.overview_reminder) {
      // group check
      res = await this.groupTempCheck(
        task.date_scheduled,
        task.meridies == "PM" ? "BOTH" : "AM"
      );
      if (res) {
        reply_msg += res.msg;
      } else reply_msg += res;
    } else {
      // individual check
      submission_res = await this.TempSubmissionCheck(
        task.date_scheduled,
        task.meridies
      );
      if (submission_res) {
        reply_msg += submission_res.msg;
      } else reply_msg += false;
    }
    if (reply_msg == "false") {
      await this.sendMessage(
        `An error occured while trying to check ${task.date_scheduled} for ${
          task.overview_reminder ? "group" : "you"
        }. Please do a manual check if necessary.`
      );
    } else {
      let msgId = await this.sendMessage(
        reply_msg,
        undefined,
        true,
        undefined,
        res
          ? {
              inline_keyboard: [
                [{ text: "Remind users", callback_data: "remind_grp" }],
              ],
            }
          : undefined
      );

      if (msgId) {
        if (res) {
          this.last5range_check.push({
            msgId: msgId,
            past_checks: res.data,
          });
          while (this.last5range_check.length > 5) {
            let obj = this.last5range_check.shift();
            try {
              await this.bot?.telegram.editMessageReplyMarkup(
                this.telegram_id,
                obj?.msgId.slice(-1)[0],
                undefined,
                undefined
              );
            } catch (e) {}
          }
        } else if (submission_res) {
          this.fillIn(submission_res.data);
        }
      }
    }
    this.task_list.shift();
    this.updateCompletedTask(task);
    this.task_generator.next();
  }

  updateCompletedTask(task: task): void {
    let index: number = 0;
    let nextTime: string = "";
    if (task.meridies == "PM") index = 1;
    if (task.overview_reminder) {
      nextTime = this.AM_PM_timer_group[index];
    } else {
      nextTime = this.AM_PM_timer_check[index];
    }
    if (nextTime == "") return; //removes task
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

  updateScheduleParam(
    overview_reminder: boolean,
    meridies: "AM" | "PM",
    time: string | "remove"
  ) {
    if (time == "remove") {
      time = "";
    } else if (!this.validTime(time)) return "invalid time format!";
    let index: number = meridies == "AM" ? 0 : 1;
    if (overview_reminder) {
      if (this.overviewCode == "")
        return "You do not have an overview code, add it in settings in /app";
      this.AM_PM_timer_group[index] = time;
    } else {
      this.AM_PM_timer_check[index] = time;
    }
    if (time == "") {
      // remove relevant task
      this.task_list = this.task_list.filter(
        (x) =>
          !(
            x.overview_reminder == overview_reminder &&
            x.meridies == meridies.toUpperCase()
          )
      );
      this.saveProfile();
      this.task_generator.next();
      return "Task removed!";
    } else {
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

  removeTask(task: task): void {
    this.task_list = this.task_list.filter(
      (x) =>
        !(
          x.overview_reminder == task.overview_reminder &&
          x.meridies == task.meridies.toUpperCase()
        )
    );
  }

  validTime(time: string): boolean {
    let [hh, mm] = time.split(":").map((x) => parseInt(x));
    let timeObj = new Date(0, 0, 0, hh, mm);
    if (timeObj.toLocaleTimeString() == "Invalid Date") return false;
    return true;
  }

  check_duplicate_task(
    overview_reminder: boolean,
    meridies: "AM" | "PM"
  ): task | false {
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

  add_task(overview_reminder: boolean, meridies: "AM" | "PM"): boolean {
    let index: number = meridies == "AM" ? 0 : 1;
    let nextTime: string = "";

    if (overview_reminder) {
      nextTime = this.AM_PM_timer_group[index];
    } else {
      nextTime = this.AM_PM_timer_check[index];
    }
    if (nextTime == "") return false;
    let task: task = {
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

  async rangeTempSubmissionCheck(
    sDate: string,
    eDate: string
  ): Promise<past_indivual_check | false> {
    let startDate = this.readDate(sDate);
    let endDate = this.readDate(eDate);
    if (!(startDate && endDate)) {
      await this.sendMessage("Invalid date format");
      return false;
    }
    if (startDate > endDate) {
      await this.sendMessage("Invalid date range");
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
      let results: tempHistoryEntry[] = (
        await axios.post(`${this.tempHistory}?${qs.stringify(query)}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
          },
        })
      ).data; //checkHistoryEntry
      if (!results.length) {
        await this.sendMessage(
          "Your pin is invalid, change it in settings in /app!"
        );
        return false;
      }
      let dataStored: missing_entry[] = [];
      let msg_to_return: string = `<u>Your missing submissions from ${sDate} to ${eDate}</u>\n`;
      for (let result of results) {
        let [AM, PM] = this.checkHistoryEntry(result);
        if (!(AM && PM)) {
          if (AM == PM) {
            dataStored.push({ date: result.date, meridies: "BOTH" });
            msg_to_return += `Missing: ${result.date} BOTH\n`;
          } else if (!AM) {
            dataStored.push({ date: result.date, meridies: "AM" });
            msg_to_return += `Missing: ${result.date} AM\n`;
          } else {
            dataStored.push({ date: result.date, meridies: "PM" });
            msg_to_return += `Missing: ${result.date} PM\n`;
          }
        }
      }
      return { msg: msg_to_return, data: dataStored };
    } catch (error) {
      this.console_with_user(error);
      await this.sendMessage("An error occured while connecting to the server");
      return false;
    }
  }

  async TempSubmissionCheck(
    date: string,
    meridies: "AM" | "PM" | "BOTH"
  ): Promise<past_indivual_check | false> {
    this.console_with_user("running");
    let response: validateTempSubmissionResponse = await this.validateTempSubmission(
      date,
      meridies
    );
    if (response.network_error) {
      await this.sendMessage(
        "An error occured while to connect to the server!"
      );
      return false;
    }
    if (response.pinErr) {
      await this.sendMessage(
        "The pin for your profile is incorrect, change it in settings in /app"
      );
      return false;
    }
    let ret: past_indivual_check = { data: [], msg: "" };
    if (response.response) {
      ret.msg = "You have already submitted both temperatures.";
      return ret;
    } else {
      if (meridies == "BOTH" && response.raw) {
        ret.msg =
          "You have yet to submit your temperature for " +
          date +
          " " +
          (response.raw[0] ? "" : "AM") +
          (response.raw[0] == response.raw[1] ? " & " : "") +
          (response.raw[1] ? "" : "PM") +
          ".";
      } else {
        ret.msg = `You have yet to submit your temperature for ${date} ${meridies}.`;
      }
      ret.data.push({ date: date, meridies: meridies });
      return ret;
    }
  }

  async groupRangeTempCheck(
    sDate: string,
    eDate: string,
    search_filter?: string
  ): Promise<grpMissingEntryResponse | false> {
    let startDate = this.readDate(sDate);
    let endDate = this.readDate(eDate);
    if (!(startDate && endDate)) {
      await this.sendMessage("Invalid date format");
      return false;
    }
    if (startDate > endDate) {
      await this.sendMessage("Invalid date range");
      return false;
    }

    let replyData: past_grp_checks = { remind_list: [], reminder: this.name };

    let reply_title: string = `<u>*Temperature Result from ${sDate} to ${eDate}*</u>\n`;
    let reply_msg: string = "";
    while (startDate <= endDate) {
      let date: string = startDate.toLocaleDateString("en-GB");
      let res: grpMissingEntryResponse | false = await this.groupTempCheck(
        date,
        "BOTH",
        search_filter
      );

      if (!res) return false;
      let body_to_add = res.msg;
      if (body_to_add.slice(-3, -1) != "👍") reply_msg += body_to_add + "\n"; // 👍 takes up 2 length
      replyData.remind_list = [
        ...replyData.remind_list,
        ...res.data.remind_list,
      ];
      replyData.remind_list = this.merge_items(
        replyData.remind_list,
        (x) => x.telegram_id,
        (x1, x2) => {
          x1.missing_entries = [...x1.missing_entries, ...x2.missing_entries];
          return x1;
        }
      );
      startDate.setDate(startDate.getDate() + 1);
    }
    if (reply_msg == "")
      reply_msg = "Everyone in your filter group has submitted!";
    return { msg: reply_title + reply_msg, data: replyData };
  }

  async groupTempCheck(
    date: string,
    meridies: "AM" | "PM" | "BOTH" | "",
    filter?: string
  ): Promise<grpMissingEntryResponse | false> {
    let query = {
      overviewCode: this.overviewCode,
      date: date,
      timezone: "Asia/Singapore",
    };
    let search_filters: string[] = [];
    if (filter == undefined || filter == "") search_filters = this.filter_list;
    else if (filter.toUpperCase() == "NULL") search_filters = [];
    else search_filters = [filter.trim() + " "];

    try {
      if (this.overviewCode == "") {
        await this.sendMessage(
          "Your profile does not contain an overview code, please add it in settings in /app"
        );
        return false;
      }
      let results: overviewResponse = (
        await axios.post(this.grpHistory, qs.stringify(query), {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
          },
        })
      ).data;

      if (results == null) {
        await this.sendMessage(
          "The overview code provided is invalid, change it in settings in /app"
        );
        return false;
      }

      let reply: grpMissingEntryResponse = {
        data: { remind_list: [], reminder: this.name },
        msg: "",
      };

      let reply_title: string = `<u>*${date}*</u>\n`;
      let reply_body: string = "";
      let merge_arr: overviewUser[] = [];
      for (let search_filter of search_filters) {
        if (search_filter != "" && search_filter != undefined) {
          search_filter = search_filter.toUpperCase();
          merge_arr = [
            ...merge_arr,
            ...results.members.filter((x) =>
              x.identifier.toUpperCase().includes(search_filter as string)
            ),
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
          } else {
            PM = true;
          }
        }

        if (meridies == "BOTH" || meridies == "") {
          if (new Date() < this.readDate(date + " 12:00")) meridies = "AM";
        }
        if (meridies == "AM") {
          if (!AM) {
            reply_body += `<b>${member.identifier}</b> missing <i>AM</i>.\n`;
            // push user
            let teleId: number | false = this.getTelegramID(
              (member.id as unknown) as number
            );
            if (teleId) {
              reply.data.remind_list.push({
                uid: member.id,
                telegram_id: teleId,
                name: member.identifier,
                missing_entries: [{ date: date, meridies: "AM" }],
              });
            }
          }
        } else if (meridies == "PM") {
          if (!PM) {
            reply_body += `<b>${member.identifier}</b> missing <i>PM</i>.\n`;
            let teleId: number | false = this.getTelegramID(
              (member.id as unknown) as number
            );
            if (teleId) {
              reply.data.remind_list.push({
                uid: member.id,
                telegram_id: teleId,
                name: member.identifier,
                missing_entries: [{ date: date, meridies: "PM" }],
              });
            }
          }
        } else if (!(AM && PM)) {
          let teleId: number | false = this.getTelegramID(
            (member.id as unknown) as number
          );
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
          } else if (!AM) {
            reply_body += `<b>${member.identifier}</b> : missing <i>AM</i>.\n`;
            if (teleId) {
              reply.data.remind_list.push({
                uid: member.id,
                telegram_id: teleId,
                name: member.identifier,
                missing_entries: [{ date: date, meridies: "AM" }],
              });
            }
          } else {
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
      if (reply_body == "") reply_body += "Everyone submitted.👍\n"; //👍 functions as an check in range search
      reply.msg = reply_title + reply_body;
      return reply;
    } catch (e) {
      await this.sendMessage(
        `an error occured trying to retrieve data on ${date}`
      );
      return {
        msg: `${date}\nAn error occured trying to retrieve data from this date\n`,
        data: { remind_list: [], reminder: "" },
      };
    }
  }

  async validateTempSubmission(
    date: string,
    meridies: "AM" | "PM" | "BOTH"
  ): Promise<validateTempSubmissionResponse> {
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
      let res: tempHistoryEntry[] = (
        await axios.post(`${this.tempHistory}?${qs.stringify(query)}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
          },
        })
      ).data;
      this.console_with_user(res);
      if (!res.length) return { network_error: false, pinErr: true };
      let result: [boolean, boolean] = this.checkHistoryEntry(res[0]);
      if (meridies === "AM") {
        return {
          network_error: false,
          response: result[0],
          raw: result,
          pinErr: false,
        };
      } else if (meridies === "PM") {
        return {
          network_error: false,
          response: result[1],
          raw: result,
          pinErr: false,
        };
      } else {
        return {
          network_error: false,
          response: result[0] && result[1],
          raw: result,
          pinErr: false,
        };
      }
    } catch (error) {
      this.console_with_user(error);
      return { network_error: true };
    }
  }

  checkHistoryEntry(entry: tempHistoryEntry): [boolean, boolean] {
    return [!!entry.latestAM, !!entry.latestPM];
  }

  FindNextUrl(url: string, search_string: string): string | false {
    try {
      let url_params: string[] = url.split("/");
      let next_param: boolean = false;
      for (let param of url_params) {
        if (param == search_string) next_param = true;
        else if (next_param) {
          return param;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async saveGroupCode(url: string): Promise<boolean> {
    let result: string | false = this.FindNextUrl(url, "group");
    if (result) {
      this.groupCode = result;
      let dataRes: grpDataResponse = await this.loadGrpData();
      if (dataRes.error && dataRes.err?.valueOf() == "INVALID") return false;
      else if (dataRes.error) {
        await this.sendMessage(
          "there seems to be an error when communicating with the server!\nTry again later!"
        );
        await this.sendMessage("To exit the process, type /skip");
        return false;
      } else {
        this.groupName = dataRes.response?.groupName as string;
        return true;
      }
    }
    return false;
  }

  async saveOverviewCode(url: string): Promise<boolean> {
    try {
      let result: string | false = this.FindNextUrl(url, "overview");
      if (result) {
        this.overviewCode = result;
        let query = {
          overviewCode: this.overviewCode,
          date: "20/8/2020",
          timezone: "Asia/Singapore",
        };
        let response: overviewResponse = (
          await axios.post(this.grpHistory, qs.stringify(query), {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "User-Agent":
                "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
            },
          })
        ).data;

        if (response == null) {
          return false;
        } else {
          this.overviewName = response.groupName;
          this.saveProfile();
          return true;
        }
      }
      return false;
    } catch (e) {
      await this.sendMessage(
        "unable to connect to the ado servers. saving overview code anyway..." +
          "\nYou can change it later under settings in /app"
      );
      return true;
    }
  }

  async sendMessage(
    msg: string,
    silence?: boolean,
    html?: boolean,
    telegramId: number = this.telegram_id,
    MarkupObj?: ExtraReplyMessage["reply_markup"]
  ): Promise<number[] | false> {
    if (msg.trim() == "") return false;
    let charLength: number = 4096;
    if (html) charLength = 1500; // markup text fails after 1500 char
    try {
      let msgIdList: number[] = [];
      if (msg.length >= charLength) {
        // no markup obj reply
        let index_to_cut: number = msg.substr(0, charLength).search(/(\n).*$/);
        let res1 = await this.sendMessage(
          msg.substr(0, index_to_cut),
          silence,
          html,
          telegramId
        );

        let res2 = await this.sendMessage(
          msg.substr(index_to_cut),
          silence,
          html,
          telegramId,
          MarkupObj
        );
        if (res1) msgIdList = msgIdList.concat(res1);
        if (res2) msgIdList = msgIdList.concat(res2);
        return msgIdList;
      } else {
        let res: number | undefined = (
          await this.bot?.telegram.sendMessage(telegramId, msg, {
            parse_mode: html ? "HTML" : undefined,
            disable_notification: silence ?? false,
            reply_markup: MarkupObj ?? undefined,
          })
        )?.message_id;
        if (res) return [res];
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  async loadGrpData(): Promise<grpDataResponse> {
    try {
      //get request for grp
      let result = (
        await axios.get(`${this.idQueryParams}${this.groupCode}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
          },
        })
      ).data;

      //string manipulation to retrieve json data from get result
      result = result.split("loadContents('")[1];

      //checking if the id is valid
      result = result.split(`', '');`);
      if (result.length == 1) throw "INVALID";

      //retrive result
      return { error: false, response: JSON.parse(result[0]) };
    } catch (e) {
      this.console_with_user(e);
      return { error: true, err: e };
    }
  }

  async submitTemp(
    date: string,
    meridies: string,
    temperature: string | number
  ): Promise<boolean | "network_err"> {
    let query = {
      groupCode: this.groupCode,
      date: date,
      meridies: meridies.toUpperCase(),
      memberId: this.uid,
      temperature: temperature,
      pin: this.pin,
    };
    try {
      let res = await axios.post(
        `${this.tempSubmission}`,
        qs.stringify(query),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36",
          },
        }
      );
      switch (res.data) {
        case "Please enter your pin.<br/>":
          await this.sendMessage(
            "you do not have a pin, please update it in settings under /app"
          );
          return false;
        case "Wrong pin.":
          await this.sendMessage(
            "your pin is incorrect, please update it in settings under /app"
          );
          return false;
        case "Member does not exist.":
          await this.sendMessage(
            "your member id is incorrect, please update it in settings under /app"
          );
          return false;
        case "Group does not exist.":
          await this.sendMessage(
            "your group id is incorrect, please update it in settings under /app"
          );
          return false;

        case "OK":
          this.console_with_user("temperature submitted");
          return true;
        default:
          this.console_with_user("unknown response.");
          return "network_err";
      }
    } catch (error) {
      return "network_err";
    }
  }

  async messageHandler(msg: string): Promise<void> {
    if (!this.msg_generator.length) return;

    while (this.msg_generator.length) {
      do {
        this.last_msg = await this.msg_generator[0].next(msg); // true
      } while (!this.last_msg.done && !(this.last_msg.value ?? true));

      if (this.last_msg.done) {
        this.msg_generator.shift();
      } else {
        return;
      }
    }
    return;
  }

  async *setReminderGen(
    overview_reminder: boolean,
    meridies?: "AM" | "PM",
    time?: string
  ): AsyncGenerator<unknown, boolean, string> {
    let result: boolean = false;
    const name: string = overview_reminder ? "your group's" : "your";
    if (!meridies) {
      await this.sendMessage(
        `Enter AM if you want to be reminded of ${name} AM submission daily.`
      );
      await this.sendMessage(
        `Enter PM if you want to be reminded of ${name} temperature submission daily.`,
        undefined,
        undefined,
        undefined,
        {
          keyboard: [[{ text: "AM" }], [{ text: "PM" }]],
          one_time_keyboard: true,
        }
      );

      while (!result) {
        yield true;
        let res: string = yield false;
        if (res) {
          res = res.toUpperCase();
          if (res == "AM" || res == "PM") {
            meridies = res;
            break;
          }
        }
        await this.sendMessage(`Invalid Response!`);
      }
    } else {
      if (meridies != "AM" && meridies != "PM")
        await this.sendMessage(`Invalid Meridies.`);
    }

    if (!time) {
      await this.sendMessage(
        `Enter the time you wish to be informed of ${name} temperature check.`,
        undefined,
        undefined,
        undefined,
        { remove_keyboard: true }
      );
      await this.sendMessage(
        `Enter remove if you wished to delete this daily reminder.`
      );

      while (!result) {
        yield true;
        let res: string = yield false;
        if (res.toUpperCase() == "REMOVE") {
          time = "remove";
          result = true;
        } else if (this.validTime(res)) {
          time = res;
          result = true;
        } else {
          await this.sendMessage(
            `Invalid format. Time should be of 24h format: HH:MM`
          );
        }
      }
    } else if (!this.validTime(time) && time != "remove") {
      await this.sendMessage(
        `Invalid format. Time should be of 24h format: HH:MM`
      );
    }
    let msg = this.updateScheduleParam(
      overview_reminder,
      meridies as "AM" | "PM",
      time as string
    );
    await this.sendMessage(msg);
    return true;
  }

  async *submitTemperatureGen(
    date?: string,
    meridies?: string,
    temperature?: string,
    safe_check: boolean = this.careful_submission
  ): AsyncGenerator<unknown, boolean, string> {
    let result = false;
    meridies = meridies?.toUpperCase();

    if (!date) {
      await this.sendMessage(
        `Please enter the date for the temperature you wish to submit`
      );

      while (!result) {
        yield true;
        date = yield false;
        if (!this.readDate(date ?? " ")) {
          await this.sendMessage(
            `Invalid date. Date should be of format DD:MM:YYYY`
          );
        } else {
          result = true;
        }
      }
    } else if (!this.readDate(date)) {
      await this.sendMessage(
        `Invalid date. Date should be of format DD:MM:YYYY`
      );
    }
    result = false;
    if (!meridies) {
      while (!result) {
        await this.sendMessage(
          `Please enter either AM or PM for the meridies you want to submit!`
        );
        yield true;
        meridies = yield false;
        meridies = meridies.toUpperCase();
        if (meridies && (meridies == "AM" || meridies == "PM")) {
          result = true;
          break;
        }
      }
    } else if (!(meridies == "AM" || meridies == "PM")) {
      await this.sendMessage(
        `Please enter either AM or PM for the meridies you want to submit!`
      );
      return true;
    }
    if (
      (meridies == "PM" && new Date() < this.readDate(date + " 12:00")) ||
      (meridies == "AM" && new Date() < this.readDate(date + " 00:00"))
    ) {
      await this.sendMessage(`You can't submit this temperature yet!`);
      return true;
    }
    if (safe_check) {
      let validator = await this.validateTempSubmission(
        date as string,
        meridies as "AM" | "PM"
      );
      if (validator.network_error) {
        await this.sendMessage(
          `unable to connect to the server to check your temperature. Continuing anyway...\nType /skip if you do not wish to submit the temperature`
        );
      } else if (validator.response) {
        await this.sendMessage(
          `You have already submitted your temperature for ${date} ${meridies}`
        );
        return true;
      }
    }
    let submission_temperature: number = 36.0;
    result = false;
    if (!temperature) {
      await this.sendMessage(
        `Please enter your temperature for ${date} ${meridies}`
      );
      while (!result) {
        yield true;
        submission_temperature = parseFloat(yield false);
        if (
          submission_temperature <= 45 &&
          submission_temperature >= 30 &&
          !isNaN(submission_temperature)
        ) {
          result = true; // valid temp range
        } else {
          await this.sendMessage(`Please enter a valid temperature`);
          continue;
        }
      }
    } else {
      submission_temperature = parseFloat(temperature);
      if (
        !(
          submission_temperature <= 45 &&
          submission_temperature >= 30 &&
          !isNaN(submission_temperature)
        )
      ) {
        await this.sendMessage(`Please enter a valid temperature`);
        return true;
      }
    }

    let res = await this.submitTemp(
      date as string,
      meridies as string,
      submission_temperature
    );
    if (res == "network_err") {
      await this.sendMessage(
        `We were unable to submit your temperature due to a network error`
      );
    } else if (res) {
      await this.sendMessage(`Temperature submitted`);
    } else {
      await this.sendMessage(
        `We were unable to submit your temperature due to invalid information`
      );
    }
    return true;
  }

  async *safeSubmitGen(
    enable?: boolean
  ): AsyncGenerator<unknown, boolean, string> {
    let result = false;

    if (enable == undefined) {
      await this.sendMessage(`Do you wish to enable safe submission mode?`);
      await this.sendMessage(
        `With this turned on, it will disallow you to submit duplicate submissions when submitting temperatures. \n\nYou can still use force submit to submit it or turn it off in settings under /app\n\nThe downside is it might lead to slow connection should the history function of the temptaking.ado site be down!`,
        undefined,
        undefined,
        undefined,
        {
          keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
          one_time_keyboard: true,
        }
      );

      while (!result) {
        yield true;
        let res = yield false;
        if (res.toUpperCase() == "YES") {
          this.careful_submission = true;
          await this.sendMessage(
            `Safe submit has been enabled`,
            undefined,
            undefined,
            undefined,
            { remove_keyboard: true }
          );
          return true;
        } else if (res.toUpperCase() == "NO") {
          this.careful_submission = false;
          await this.sendMessage(
            `Safe submit has been disabled`,
            undefined,
            undefined,
            undefined,
            { remove_keyboard: true }
          );
          return true;
        }
        await this.sendMessage(`Invalid response`);
      }
    } else {
      this.careful_submission = enable;
      await this.sendMessage(
        `safe submit has been ${enable ? "enabled" : "disabled"}.`
      );
    }
    return true;
  }

  async *addNewFilterGen(): AsyncGenerator<unknown, boolean, string> {
    let result: boolean = false;
    while (!result) {
      await this.sendMessage(
        `Please enter a list of filter names to add on to the filter list or type /empty to clear out filter list`
      );

      await this.sendMessage(
        "(You can use + to act as trailing or leading white spaces)\n" +
          "(e.g. if your names appear as P3 <xxx>, you can enter P3+ to display only the names containing P3 when using range_checks)\n" +
          "(you can also add multiple filters to directly search for names if there is no prominent identifier or intersecting identifiers)"
      );

      await this.sendMessage(`Current list:\n${this.filter_list.join("\n")}`);
      yield true;
      let reply: string = yield false;
      if (reply == "/empty") {
        this.filter_list = [];
        await this.sendMessage(`The filter list has been emptied`);
      } else {
        this.filter_list = this.filter_list.concat(
          reply.split("\n").map((x) => x.trim().replace("+", " "))
        );
      }

      await this.sendMessage(
        "Do you wish to add more to the filter list?",
        undefined,
        undefined,
        undefined,
        {
          keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
          one_time_keyboard: true,
        }
      );

      result = true;
      yield true;
      reply = yield false;
      if (reply.toUpperCase() == "YES") result = false;
    }
    this.saveProfile();
    await this.sendMessage(
      `filter list has been updated\nCurrent filter list:\n${this.filter_list.join(
        "\n"
      )}`,
      undefined,
      undefined,
      undefined,
      { remove_keyboard: true }
    );
    return true;
  }

  async *addOverviewGen(
    url?: string
  ): AsyncGenerator<unknown, boolean, string> {
    let result: boolean = false;
    if (url == undefined) {
      let overviewCodeUrl: string;
      await this.sendMessage(
        "If you have access rights to the overview site, please enter the overview site url. Type NA if it's not applicable to you."
      );
      await this.sendMessage(
        "The url are of format:\n https://temptaking.ado.sg/overview/xxxxxxxxx"
      );
      while (!result) {
        // get overviewcode
        yield true;
        overviewCodeUrl = yield false;
        if (overviewCodeUrl == "NA") {
          this.overviewCode = "";
          this.overviewName = "";
          this.saveProfile();
          await this.sendMessage("skipping...");
          return true;
        }
        result = await this.saveOverviewCode(overviewCodeUrl);
        if (!result) {
          await this.sendMessage(
            "Please enter a VALID overview url for your temperature taking group"
          );
        } else {
          this.saveProfile();
          await this.sendMessage("Overview code has been saved!");
          return true;
        }
      }
    } else {
      result = await this.saveOverviewCode(url);
      if (!result) {
        await this.sendMessage("The url provided is invalid!");
      } else {
        this.saveProfile();
        await this.sendMessage("Overview code has been saved!");
      }
    }
    return true;
  }

  async *updatePinGen(): AsyncGenerator<unknown, boolean, string> {
    await this.sendMessage("Please enter your new password!");
    while (1) {
      yield true;
      let new_pin: string = yield false;
      if (new_pin.length == 4 && !isNaN(new_pin as any)) {
        await this.sendMessage("Pin has been updated");
        this.pin = new_pin;
        break;
      }
      await this.sendMessage("Invalid pin format!");
    }
    this.saveProfile();
    return true;
  }

  async *addTempAccGen(): AsyncGenerator<unknown, boolean, string> {
    let result: boolean = false;
    let groupCodeUrl: string;
    await this.sendMessage("Please enter a your temperature taking group url");
    await this.sendMessage(
      "The url are of format\n https://temptaking.ado.sg/group/xxxxxxxxx"
    );
    while (!result) {
      // save groupCode
      yield true;
      groupCodeUrl = yield false;
      result = await this.saveGroupCode(groupCodeUrl);
      if (!result) {
        await this.sendMessage(
          "Please enter a VALID temperature taking group url"
        );
      }
    }

    let dataRes: grpDataResponse = await this.loadGrpData();
    if (dataRes.error) {
      this.msg_generator.shift();
      this.last_msg.done = true;
      this.messageHandler("");
      await this.sendMessage("an error occured while trying to load the data.");
      return true;
    }
    let grp_members: grpUser[] = dataRes.response?.members ?? [];
    let member_names: InlineKeyboardButton[][] = grp_members.map((member) => [
      {
        text: member.identifier,
      },
    ]);

    result = false;
    let temp_name = "";
    while (!result) {
      await this.sendMessage(
        "Please select in exactly your name found in the list!",
        undefined,
        undefined,
        undefined,
        { keyboard: member_names, one_time_keyboard: true }
      );
      // get id and name
      yield true;
      temp_name = yield false;
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
    await this.sendMessage(
      "Please enter your pin, this bot will send a temperature history request to the ado server to verify your profile."
    );
    while (!result) {
      yield true;
      let pin: string = yield false;
      if (pin.length == 4 && !isNaN(pin as any)) {
        this.pin = pin;
        await this.sendMessage("Verifying profile... Please be patient!");
        let res: validateTempSubmissionResponse = await this.validateTempSubmission(
          "31/08/2020",
          "AM"
        );
        if (res.network_error) {
          await this.sendMessage(
            "We've encountered a network error while trying to verify the profile\n We will proceed as normal if you wish to change your pin afterwards, you can change it in settings."
          );
          break;
        } else if (!res.pinErr) {
          await this.sendMessage("Profile has been verified!");
          break;
        } else {
          await this.sendMessage("Pin is incorrect, please try again!");
          continue;
        }
      }
      await this.sendMessage("Invalid Pin");
    }
    this.saveProfile();
    return true;
  }

  async *tempCheckGen(
    group: boolean,
    date?: string
  ): AsyncGenerator<unknown, boolean, string> {
    if (date == undefined) {
      await this.sendMessage("Please enter the date you wish to check.");
      while (1) {
        yield true;
        date = yield false;
        let dateObj = this.readDate(date as string);
        if (dateObj) break;
        await this.sendMessage(
          "Invalid date. Dates should be of format DD:MM:YYYY"
        );
      }
    } else {
      let dateObj = this.readDate(date);
      if (!dateObj) {
        await this.sendMessage(
          "Invalid date. Dates should be of format DD:MM:YYYY"
        );
        return true;
      }
    }
    if (!group) {
      let result = await this.TempSubmissionCheck(date as string, "BOTH");
      if (result) {
        await this.sendMessage(result.msg, false, true);
        this.fillIn(result.data);
      }
    } else {
      let result = await this.groupTempCheck(date as string, "BOTH", undefined);
      if (result) {
        let msgId = await this.sendMessage(result.msg, false, true, undefined, {
          inline_keyboard: [
            [{ text: "Remind users", callback_data: "remind_grp" }],
          ],
        });
        if (msgId) {
          this.last5range_check.push({
            msgId: msgId,
            past_checks: result.data,
          });
          while (this.last5range_check.length > 5) {
            let obj = this.last5range_check.shift();
            try {
              await this.bot?.telegram.editMessageReplyMarkup(
                this.telegram_id,
                obj?.msgId.slice(-1)[0],
                undefined,
                undefined
              );
            } catch (e) {}
          }
        }
      }
    }
    return true;
  }

  async *rangeCheckGen(
    group: boolean,
    s_date?: string,
    e_date?: string
  ): AsyncGenerator<unknown, boolean, string> {
    if (s_date == undefined) {
      await this.sendMessage("Please enter the starting date.");
      while (1) {
        yield true;
        s_date = yield false;
        let dateObj = this.readDate(s_date as string);
        if (dateObj) break;
        await this.sendMessage(
          "Invalid date. Dates should be of format DD:MM:YYYY"
        );
      }
    } else {
      let dateObj = this.readDate(s_date);
      if (!dateObj) {
        await this.sendMessage(
          "Invalid date. Dates should be of format DD:MM:YYYY"
        );
        return true;
      }
    }

    if (e_date == undefined) {
      await this.sendMessage(
        'Please enter ending date. \nEnter "today" (without quotes) if you want the end date to be today.'
      );
      while (1) {
        yield true;
        e_date = yield false;
        if (e_date == "today") {
          e_date = new Date().toLocaleDateString("en-GB");
          break;
        }
        let dateObj = this.readDate(e_date as string);
        if (dateObj) break;

        await this.sendMessage(
          "Invalid date. Dates should be of format DD:MM:YYYY"
        );
      }
    } else {
      let dateObj = this.readDate(e_date);
      if (!dateObj) {
        await this.sendMessage(
          "Invalid date. Dates should be of format DD:MM:YYYY"
        );
        return true;
      }
    }
    await this.bot?.telegram.sendChatAction(this.telegram_id, "typing");
    if (group) {
      let result = await this.groupRangeTempCheck(
        s_date as string,
        e_date as string
      );
      if (result) {
        let msgId = await this.sendMessage(result.msg, false, true, undefined, {
          inline_keyboard: [
            [{ text: "Remind users", callback_data: "remind_grp" }],
          ],
        });

        if (msgId) {
          this.last5range_check.push({
            msgId: msgId,
            past_checks: result.data,
          });
          while (this.last5range_check.length > 5) {
            let obj = this.last5range_check.shift();
            try {
              await this.bot?.telegram.editMessageReplyMarkup(
                this.telegram_id,
                obj?.msgId.slice(-1)[0],
                undefined,
                undefined
              );
            } catch (e) {}
          }
        }
      }
    } else {
      let result = await this.rangeTempSubmissionCheck(
        s_date as string,
        e_date as string
      );
      if (result) {
        let msgId = await this.sendMessage(
          result.msg,
          undefined,
          true,
          undefined,
          {
            inline_keyboard: [
              [
                {
                  text: "Fill in mising temperatures",
                  callback_data: "fill_temp",
                },
              ],
            ],
          }
        );
        if (msgId) {
          this.last5range_individual_check.push({
            msgId: msgId,
            past_checks: result.data,
          });
          while (this.last5range_individual_check.length > 5) {
            let obj = this.last5range_individual_check.shift();
            try {
              await this.bot?.telegram.editMessageReplyMarkup(
                this.telegram_id,
                obj?.msgId.slice(-1)[0],
                undefined,
                undefined
              );
            } catch (e) {}
          }
        }
      }
    }

    return true;
  }

  async *YesNoGen(
    question: string,
    yesFun?: () => AsyncGenerator<unknown, boolean, string>,
    noFun?: () => AsyncGenerator<unknown, boolean, string>
  ): AsyncGenerator<unknown, boolean, string> {
    let exeFun: () => AsyncGenerator<
      unknown,
      boolean,
      string
    > = async function* () {
      return true;
    };
    while (1) {
      await this.sendMessage(question, undefined, undefined, undefined, {
        keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
        one_time_keyboard: true,
      });
      yield true;
      let reply: string = (yield false).toUpperCase();

      if (reply == "YES") {
        if (yesFun) exeFun = yesFun;
        break;
      } else if (reply == "NO") {
        if (noFun) exeFun = noFun;
        break;
      }
    }
    let acGen = exeFun();
    let result: boolean = false;
    let res: IteratorResult<unknown, boolean>;
    let reply: string = "";
    while (!result) {
      do {
        res = await acGen.next(reply);
        if (res.done) {
          res.value = false;
          result = true;
        }
        yield res.value;
      } while (!res.done && !res.value);
      if (res.value && !res.done) reply = yield false;
    }
    return true;
  }

  async *conditonalGen(
    condition: (() => Promise<boolean>) | (() => boolean),
    trueGen?: () => AsyncGenerator<unknown, boolean, string>,
    falseGen?: () => AsyncGenerator<unknown, boolean, string>
  ): AsyncGenerator<unknown, boolean, string> {
    let exeFun: () => AsyncGenerator<
      unknown,
      boolean,
      string
    > = async function* () {
      return true;
    };
    if (await condition()) {
      if (trueGen) exeFun = trueGen;
    } else {
      if (falseGen) exeFun = falseGen;
    }
    let acGen = exeFun();
    let result: boolean = false;
    let res: IteratorResult<unknown, boolean>;
    let reply: string = "";
    while (!result) {
      do {
        res = await acGen.next(reply);
        if (res.done) {
          res.value = false;
          result = true;
        }
        yield res.value;
      } while (!res.done && !res.value);
      if (res.value && !res.done) reply = yield false;
    }
    return true;
  }

  async *sendMessageGen(
    msg: string,
    silence?: boolean,
    html?: boolean,
    telegramId: number = this.telegram_id,
    MarkupObj?: ExtraReplyMessage["reply_markup"]
  ): AsyncGenerator<unknown, boolean, string> {
    await this.sendMessage(msg, silence, html, telegramId, MarkupObj);
    return true;
  }

  async getDetails() {
    await this.add_to_genQ(this.addTempAccGen(), true);
    await this.add_to_genQ(this.safeSubmitGen(), true);
    await this.add_to_genQ(this.addOverviewGen(), true);
    await this.add_to_genQ(
      this.conditonalGen(
        () => this.overviewCode == "",
        undefined,
        () => {
          return this.YesNoGen(
            "Do you wish to add a list of filters to the group list?\n",
            () => this.addNewFilterGen(),
            undefined
          );
        }
      ),
      true
    );

    await this.add_to_genQ(
      this.conditonalGen(
        () => this.uid != "",
        () =>
          this.sendMessageGen(
            "Thank you for setting up your profile",
            undefined,
            undefined,
            undefined,
            { remove_keyboard: true }
          ),
        () =>
          this.sendMessageGen(
            "Some key informations is missing, please /start and register again!",
            undefined,
            undefined,
            undefined,
            { remove_keyboard: true }
          )
      ),
      true
    );
  }

  async remindMsg(msgId: number): Promise<void> {
    for (let range_check of this.last5range_check) {
      if (range_check.msgId.includes(msgId)) {
        let failure_list: string[] = [];
        let success_list: string[] = [];
        for (let reminder of range_check.past_checks.remind_list) {
          if (
            await this.remindUser(reminder, range_check.past_checks.reminder)
          ) {
            success_list.push(reminder.name);
          } else {
            failure_list.push(reminder.name);
          }
        }
        if (success_list.length) {
          await this.sendMessage(
            "The following members have been informed:\n" +
              success_list.join("\n")
          );
          return;
        }
        if (failure_list.length) {
          await this.sendMessage(
            "Msg failed to deliver to the following registered users:\n" +
              failure_list.join("\n")
          );
          return;
        }
        if (!(failure_list.length && success_list.length)) {
          await this.sendMessage(
            "None of the members in the list has a registered profile in this telegram bot!"
          );
          return;
        }
      }
    }
    await this.sendMessage(
      "The message is no longer available to be used. only the last 5 group check is saved. do a /check_grp <date> and /remind on the result "
    );
  }

  pushMessage(
    msg_gen: AsyncGenerator<unknown, boolean, string>[],
    entry: missing_entry
  ) {
    if (entry.meridies == "BOTH") {
      msg_gen.push(this.submitTemperatureGen(entry.date, "AM"));
      msg_gen.push(this.submitTemperatureGen(entry.date, "PM"));
    } else {
      msg_gen.push(this.submitTemperatureGen(entry.date, entry.meridies));
    }
  }

  fillIn(missing_entries: missing_entry[]): void {
    // fills in individual entries from a past ranged check
    for (let entry of missing_entries) {
      this.pushMessage(this.msg_generator, entry);
    }
    if (this.last_msg.done) {
      this.messageHandler("");
    }
  }

  async fillReplyMsg(msgId: number) {
    for (let range_check of this.last5range_individual_check) {
      if (range_check.msgId.includes(msgId)) {
        await this.sendMessage(
          "sending you the fill in list...\nType /skip or /skipall to skip one or all of the submissions respectively"
        );
        this.fillIn(range_check.past_checks);
        return;
      }
    }
    await this.sendMessage(
      "The message is no longer available to be used. only the last 5 individual RANGE check is saved. do a /check <sdate> <edate> and /fill on the result "
    );
  }

  async remindUser(
    missing_entries: missing_user_entries,
    reminder: string
  ): Promise<boolean> {
    let res: boolean = true;

    let reminded_user: TemperatureUser | false = this.findUser(
      missing_entries.telegram_id
    );

    if (!reminded_user) return false;
    await reminded_user.sendMessage(
      `You have been reminded by ${reminder} to send your temperature for the following:`
    );
    for (let entry of missing_entries.missing_entries) {
      let success = await reminded_user.sendMessage(
        `${entry.date}: ${entry.meridies} submissions`
      );
      if (!success) res = false;

      reminded_user.pushMessage(reminded_user.msg_generator, entry);
    }

    if (reminded_user.last_msg.done) {
      reminded_user.messageHandler("");
    }
    return res;
  }

  merge_items<T>(
    arr1: T[],
    indexfunc: (arg0: T) => number,
    mergefunc: (arg0: T, arg1: T) => T
  ) {
    let recordObj: Record<number, T> = {};
    let returnArr: T[] = [];
    for (let value of arr1) {
      let key: number = indexfunc(value);
      if (recordObj[key]) {
        recordObj[key] = mergefunc(recordObj[key], value);
      } else recordObj[key] = value;
    }
    for (let key in recordObj) {
      returnArr.push(recordObj[key]);
    }
    return returnArr;
  }

  console_with_user(text: any) {
    console.log(this.telegram_id, text);
  }

  remove_dup<T>(arr1: T[], indexfunc: (arg0: T) => number): T[] {
    // O(n) solution to removing duplicate with key map hashing
    let recordObj: Record<number, T> = {};
    let returnArr: T[] = [];
    for (let value of arr1) {
      let key: number = indexfunc(value);
      recordObj[key] = value;
    }
    for (let key in recordObj) {
      returnArr.push(recordObj[key]);
    }
    return returnArr;
  }
}
