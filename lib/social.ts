// Single source of truth for Moolah IQ social profiles.
// The footer social row maps over SOCIAL_LINKS; Videos.tsx imports
// CHANNEL_URL from here so the YouTube URL lives in exactly one place.

export const SOCIAL_LINKS = [
  { label: "YouTube", href: "https://www.youtube.com/@MoolahIQ" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61586405937656" },
  { label: "Instagram", href: "https://www.instagram.com/moolahiqfinance" },
  { label: "TikTok", href: "https://www.tiktok.com/@moolahiqfinance" },
  { label: "Pinterest", href: "https://www.pinterest.com/Moolahiqfinance" },
] as const;

// YouTube channel — derived from the single SOCIAL_LINKS entry above.
export const CHANNEL_URL = SOCIAL_LINKS[0].href;
