import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/game/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MC FREAKY — משלוחי אימה" },
      { name: "description", content: "משחק אימה: שליח על אופנוע, לקוחות משוגעים, כתובות מבלבלות ו-jump scares." },
      { property: "og:title", content: "MC FREAKY — משלוחי אימה" },
      { property: "og:description", content: "תמסור את ההזמנה... אם תשרוד את הלקוחות." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
