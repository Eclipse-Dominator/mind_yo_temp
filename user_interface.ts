import { Context } from "telegraf";
import { TemperatureUser } from "./TemperatureUser";

export type Next = () => void | Promise<void>;

export interface past_grp_check_messages {
  msgId: number[];
  past_checks: past_grp_checks;
}

export interface past_individual_check_messages {
  msgId: number[];
  past_checks: missing_entry[];
}

export interface past_indivual_check {
  msg: string;
  data: missing_entry[];
}

export interface past_grp_checks {
  remind_list: missing_user_entries[];
  reminder: string;
}

export interface grpMissingEntryResponse {
  msg: string;
  data: past_grp_checks;
}

export interface missing_user_entries {
  uid: string;
  name: string;
  telegram_id: number;
  missing_entries: missing_entry[];
}

export interface missing_entry {
  date: string;
  meridies: "AM" | "PM" | "BOTH";
}

export interface update_Context extends Context {
  command?: command;
  user?: TemperatureUser;
}

/*
export interface save_file {
  users: save_user[];
}*/

export interface save_file {
  [id: number]: save_user;
}

export interface live_save {
  [id: number]: TemperatureUser;
}

export interface save_user {
  telegram_id: number;
  uid: string | number;
  name: string;
  overviewCode: string | "";
  overviewName: string | "";
  groupCode: string;
  groupName: string;
  pin: string | number;
  AM_PM_timer_check: [string, string];
  AM_PM_timer_group: [string, string];
  task_list: task[];
  filter_list: string[];
  careful_submission: boolean;
}

export interface command {
  raw: string;
  command: string;
  args: string[];
}

export interface validateTempSubmissionResponse {
  network_error: boolean;
  response?: boolean;
  raw?: [boolean, boolean];
  pinErr?: boolean;
}

export interface overviewResponse {
  groupName: string;
  overviewURLCode: string;
  members: overviewUser[];
}

export interface overviewUser {
  id: string;
  identifier: string;
  tempRecords: tempRecord[];
}

export interface tempRecord {
  id: string;
  temp: string;
  recordForDateTime: string;
  dateTimeCreated: string;
}

export interface task {
  overview_reminder: boolean;
  meridies: "AM" | "PM";
  date_scheduled: string;
  time_scheduled: string;
  date_time_scheduled: string;
}

export interface msgResponse {
  reply: boolean;
  msg: string;
  end: boolean;
}

export interface grpDataResponse {
  error: boolean;
  response?: grpData;
  err?: string;
}

export interface tempHistoryEntry {
  date: string;
  latestAM: string;
  latestPM: string;
}

export interface grpUser {
  id: string;
  identifier: string;
  hasPin: boolean;
}

export interface grpData {
  groupName: string;
  groupCode: string;
  members: grpUser[];
}
