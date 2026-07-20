// Single source of truth for Moolah IQ lead magnets (downloadable guides).
// Mirrors the lib/social.ts pattern: the files live in public/downloads/ and
// every magnet is described in exactly one place here, so components and (later)
// the weekly publish packet read URLs + pairings from this registry instead of
// hardcoding them. The prose mentions inside content/posts/*.md are content, not
// code, and are intentionally NOT driven by this file.

import type { CategorySlug } from "@/lib/categories";

export interface LeadMagnet {
  /** Display title. */
  title: string;
  /** Filename served from public/downloads/. */
  file: string;
  /** Optional alternate file (e.g. the PDF twin of an interactive .xlsx). */
  pdfFile?: string;
  /** Public URL path (served statically from public/downloads/). */
  url: string;
  /** Exact companion video id, when the magnet belongs to one video. */
  pairedVideoId: string | null;
  /** Pillar this magnet serves, when it belongs to a whole series/pillar. */
  pairedPillar: CategorySlug | null;
}

export const LEAD_MAGNETS = {
  "scam-check": {
    title: "The 10-Minute Opportunity Vetting Checklist",
    file: "vetting-checklist.pdf",
    url: "/downloads/vetting-checklist.pdf",
    pairedVideoId: "c6CcNKM27Yc", // Video 1 — Vet Any Online Income
    pairedPillar: null,
  },
  "five-week-builder": {
    title: "The 5-Week Micro-Automation Builder",
    file: "5-week-automation-builder.pdf",
    url: "/downloads/5-week-automation-builder.pdf",
    pairedVideoId: null,
    pairedPillar: "earn", // series magnet — whole EARN series
  },
  "position-sizing": {
    title: "Position-Sizing Worksheet",
    file: "position-sizing-worksheet.xlsx", // the interactive one
    pdfFile: "position-sizing-worksheet.pdf", // static alternate
    url: "/downloads/position-sizing-worksheet.xlsx",
    pairedVideoId: null,
    pairedPillar: "invest", // future INVEST video
  },
} satisfies Record<string, LeadMagnet>;

export type LeadMagnetKey = keyof typeof LEAD_MAGNETS;

/**
 * Resolve the lead magnet to surface for a given video.
 * Rule (in order): exact pairedVideoId match wins; else the first magnet whose
 * pairedPillar matches; else null. Worked examples:
 *
 *   getMagnetForVideo("c6CcNKM27Yc", "earn") -> scam-check        (video id beats pillar)
 *   getMagnetForVideo("unknownId",   "earn") -> five-week-builder (pillar fallback)
 *   getMagnetForVideo("unknownId",   null)   -> null              (no match)
 *
 * Inheritance: any video on a pillar that has a series magnet inherits that
 * magnet unless it sets an explicit pairedVideoId — so a future EARN video with
 * a DIFFERENT magnet MUST be paired by video id, or the pillar fallback will
 * silently attach the 5-Week Builder.
 */
export function getMagnetForVideo(
  videoId: string | null | undefined,
  pillar: CategorySlug | null | undefined,
): LeadMagnet | null {
  const all: LeadMagnet[] = Object.values(LEAD_MAGNETS);
  if (videoId) {
    const byVideo = all.find((m) => m.pairedVideoId === videoId);
    if (byVideo) return byVideo;
  }
  if (pillar) {
    // Contract: at most ONE pairedPillar magnet per pillar. If a pillar ever
    // carries two, add an explicit priority field and sort on it here —
    // Object.values() declaration order is NOT a resolution contract.
    const byPillar = all.find((m) => m.pairedPillar === pillar);
    if (byPillar) return byPillar;
  }
  return null;
}
