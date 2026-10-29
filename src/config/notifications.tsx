import { notify, type NotifyOptions } from "@/components/NotificationStack";

export interface SiteNotification extends NotifyOptions {
  delay: number;
}

export const siteNotifications: SiteNotification[] = [
  {
    id: "notification_discord_1",
    title: "Join the Z-Tunner Discord!",
    message:
      "If you have any feedback about Z-Tunner, feel free to share it on the server!",
    type: "info",
    duration: 15000,
    action: {
      label: "Join Server",
      href: "https://discord.gg/yjZCUpWn9",
    },
    delay: 2500,
    theme: "#8891f0",
  },
  {
    id: "notification_phoenix_anomaly",
    title: "UPDATED: Phoenix Reffaella",
    message:
      "Phoenix's Anomaly CRIT DMG is now consistent with her in-game mechanics, including its interaction with Jane's Assault CRIT DMG.",
    type: "info",
    duration: 10000,
    delay: 3000,
    theme: "#FC5858",
  },
  // {
  //   id: "changelog_v1_2",
  //   title: "v1.2 Changelog",
  //   message: "Added End Game Mode toggles and Stun Bonuses panel.",
  //   type: "info",
  //   duration: 10000,
  //   action: { label: "Read More", href: "/changelog" },
  //   delay: 6000,
  // },
];

export function fireAllSiteNotifications() {
  const timers = siteNotifications.map((n) => {
    const { delay, ...opts } = n;
    return setTimeout(() => notify(opts), delay);
  });
  return () => timers.forEach(clearTimeout);
}
