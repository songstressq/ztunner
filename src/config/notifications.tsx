import { notify, type NotifyOptions } from "@/components/NotificationStack";

export interface SiteNotification extends NotifyOptions {
  delay: number;
}

export const siteNotifications: SiteNotification[] = [
  {
    id: "notification_discord_2",
    title: "Join the Z-Tunner Discord!",
    message:
      "If you have any feedback about Z-Tunner, feel free to share it on the server!",
    type: "info",
    duration: 15000,
    action: {
      label: "Join Server",
      href: "https://discord.gg/DjzfEemmv",
    },
    delay: 2500,
    theme: "#8891f0",
  },
  {
    id: "notification_invitation",
    title: "If you want Sunbringer...",
    message:
      "You can use my ZZZ invitation link for a 50/50 chance to get Sunbringer added to Z-Tunner early (It'd be a great help 🤙).",
    type: "info",
    duration: 20000,
    action: {
      label: "PRE-REGISTER",
      href: "https://hoyo.link/tW2iGahe8?s_c=GUMPA9VM2K&utm_share=return",
    },
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
