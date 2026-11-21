import { Globe, Mail } from "lucide-react";
import type { ComponentType } from "react";
import {
  FaBehance,
  FaBluesky,
  FaCodepen,
  FaDev,
  FaDiscord,
  FaDribbble,
  FaFacebook,
  FaGithub,
  FaHashnode,
  FaInstagram,
  FaKaggle,
  FaLinkedin,
  FaMastodon,
  FaMedium,
  FaReddit,
  FaStackOverflow,
  FaTelegram,
  FaThreads,
  FaTwitch,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { SiCodeforces, SiHackerrank, SiLeetcode, SiSubstack } from "react-icons/si";

// Lucide no longer ships brand logos, so brands come from react-icons.
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  github: FaGithub,
  linkedin: FaLinkedin,
  x: FaXTwitter,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  instagram: FaInstagram,
  email: Mail,
  website: Globe,
  medium: FaMedium,
  devto: FaDev,
  hashnode: FaHashnode,
  substack: SiSubstack,
  stackoverflow: FaStackOverflow,
  leetcode: SiLeetcode,
  codeforces: SiCodeforces,
  hackerrank: SiHackerrank,
  kaggle: FaKaggle,
  codepen: FaCodepen,
  dribbble: FaDribbble,
  behance: FaBehance,
  facebook: FaFacebook,
  threads: FaThreads,
  bluesky: FaBluesky,
  mastodon: FaMastodon,
  reddit: FaReddit,
  discord: FaDiscord,
  telegram: FaTelegram,
  twitch: FaTwitch,
};

export function SocialIcon({ icon, className = "size-4" }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Globe;
  return <Icon className={className} aria-hidden />;
}
