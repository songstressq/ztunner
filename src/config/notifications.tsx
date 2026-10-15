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
  },
  {
    id: "notification_roxy",
    title: "ADDED: Roxy Ifrita Pryce",
    message:
      "Roxy and her Signature W-Engine have been added, in case you haven't noticed yet.",
    type: "info",
    duration: 10000,
    delay: 3500,
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
