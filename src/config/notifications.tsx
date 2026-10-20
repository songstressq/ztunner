import { notify, type NotifyOptions } from "@/components/NotificationStack";

export interface SiteNotification extends NotifyOptions {
  delay: number;
}

export const siteNotifications: SiteNotification[] = [
  {
    id: "notification_discord",
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
    id: "notification_remielle_special_voidflare",
    title: "NEW: Remielle's Special Voidflares",
    message:
      "You can now simulate the damage of Remielle's special Voidflares in her Luminize DMG Calculator.",
    type: "info",
    duration: 10000,
    delay: 3000,
    theme: "#FEDBF3",
  },
  {
    id: "notification_phoenix_missing",
    title: "UPDATE: Phoenix Reffaela",
    message:
      "Phoenix's availability depends on me figuring out her mechanics. If I win my 50/50, she'll be available much sooner. For now, enjoy the story!",
    type: "info",
    duration: 10000,
    delay: 3000,
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
