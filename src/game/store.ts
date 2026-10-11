import { useSyncExternalStore } from "react";

export type Phase = "menu" | "play" | "over";
export type GameState = {
  phase: Phase;
  score: number;
  time: number;
  address: string;
  dist: number;
  arrow: number; // radians, relative to bike heading
  speed: number;
  scare: { text: string; id: number } | null;
  msg: string | null;
  runId: number;
};

let state: GameState = {
  phase: "menu",
  score: 0,
  time: 60,
  address: "",
  dist: 0,
  arrow: 0,
  speed: 0,
  scare: null,
  msg: null,
  runId: 0,
};
const subs = new Set<() => void>();

export const store = {
  get: () => state,
  set: (p: Partial<GameState>) => {
    state = { ...state, ...p };
    subs.forEach((f) => f());
  },
  sub: (f: () => void) => {
    subs.add(f);
    return () => subs.delete(f);
  },
};

export function useGame() {
  return useSyncExternalStore(store.sub, store.get, store.get);
}

export const ADDRESSES = [
  "רחוב הדם 13½, הדלת השלישית מהדלת שאין",
  "שדרות המתים פינת המתים, הבית שנשם פעם",
  "סמטת אולי 0, ליד העץ שזז בלילה",
  "רחוב שמאל, תפנה ימינה, ואז תשכח",
  "הבניין הכחול שהוא בעצם אדום, קומה מינוס 4",
  "איפה שהיית לפני חמש דקות, אבל אחרת",
  "רחוב הלוויות 666, תדפוק פעמיים ואל תסתכל אחורה",
  "מאחוריך. כן, ממש מאחוריך",
  "דרך הצעקות 7, הבית עם החלון שבוכה",
  "רחוב ללא שם, מספר ללא מספר",
  "ליד המקום שבו נעלם השליח הקודם",
  "סמטת הצחוק המטורף 3, אל תצחק חזרה",
];

export const SCREAMS = [
  "איפה הצ'יפס שלייייי?!",
  "הזמנתי לפני 400 שנה!!!",
  "אתה לא השליח שלי... אתה אני!",
  "תן לי את הרוטב. תן. לי. את. הרוטב.",
  "למה אתה מסתכל עליי ככה?!",
  "גם אני הייתי שליח פעם...",
  "ההמבורגר מדבר אליי!!!",
  "זאת לא הכתובת! או שכן! חחחחח",
  "אתה יודע מה השעה?? אני לא!!!",
  "אני רואה אותךךךךךך",
];

export const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]!;
