import { Context, Schema, Session } from "koishi";
import seedrandom from "seedrandom";
import type {} from "@koishijs/cache";
import sha256 from "crypto-js/sha256";

export interface Config {}
interface Range {
  min: number;
  max: number;
  text: string;
}

export const inject = ["cache"];
export const name = "ichang";
export const Config: Schema<Config> = Schema.object({});
const max = 100;
const min = 0;

export function apply(ctx: Context) {
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));
  ctx
    .command("算命 [event:text]")
    .action(async ({ session, options }, event) => {
      const { platform, userId: pid } = session;
      const ran_number = generateMagicRandomNumber(max, min, hashCode(pid + platform + event).toString());
      const texts: Range[] = [
        { min: 0, max: 11, text: session.text(".luck_1") },
        { min: 12, max: 22, text: session.text(".luck_2") },
        { min: 23, max: 33, text: session.text(".luck_3") },
        { min: 34, max: 44, text: session.text(".luck_4") },
        { min: 45, max: 55, text: session.text(".luck_5") },
        { min: 56, max: 66, text: session.text(".luck_6") },
        { min: 67, max: 77, text: session.text(".luck_7") },
        { min: 78, max: 88, text: session.text(".luck_8") },
        { min: 89, max: 99, text: session.text(".luck_9") },
      ];
      const data: number = await ctx.cache.get(
        "default",
        hashCode(pid + platform + event).toString()
      );

      if (getEvent(event).length >= 18) {
        session.send(session.text(".too_long"));
      } else {
        if (data == undefined) {
          await ctx.cache.set(
            "default",
            hashCode(pid + platform + event).toString(),
            ran_number,
            getNextDay()
          );
          sendMessage(session, getEvent(event), ran_number, texts);
        } else {
          sendMessage(session, getEvent(event), data, texts);
        }
      }
    });
}

function sendMessage(
  session: Session,
  event: string,
  data: number,
  texts: Range[]
) {
  session.send(
    session.text(".feedback", [event, chooseText(data, texts), data])
  );
}

function chooseText(x: number, texts: Range[]): string {
  for (const range of texts) {
    if (x >= range.min && x <= range.max) {
      return range.text;
    }
  }
  return "无法计算";
}

function generateMagicRandomNumber(
  min: number,
  max: number,
  event: string
): number {
  const rnum = Math.floor(Math.random() * (99999999 - min + 1)) + min;
  const timestamp: number = new Date().getTime();

  const magic = seedrandom(hashCode(event + rnum.toString() + timestamp.toString()));
  return Math.floor(magic() * (max - min + 1)) + min;
}

function getNextDay(): number {
  const currentDate = new Date();
  currentDate.setUTCHours(currentDate.getUTCHours() + 8);
  const nextDay = new Date(currentDate);
  nextDay.setUTCDate(currentDate.getUTCDate() + 1);
  nextDay.setUTCHours(0, 0, 0, 0);
  const milNextDay = nextDay.getTime() - currentDate.getTime();
  return milNextDay;
}

function hashCode(input: string): string {
  const hash = sha256(input).toString();
  return hash;
}

function getEvent(event: string): string {
  if (event == undefined) {
    return "今日";
  } else {
    return event;
  }
}
