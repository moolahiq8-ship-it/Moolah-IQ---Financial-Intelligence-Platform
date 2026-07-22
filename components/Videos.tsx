import Link from "next/link";
import { CHANNEL_URL } from "@/lib/social";

/*
 * Latest videos — HARDCODED by design (no YouTube API fetch).
 * To update: add an entry below (newest-first is computed — the list is sorted
 * by `date` descending at render).
 *   id          — YouTube video id (the part after watch?v=, no &t= params)
 *   title       — display title
 *   duration    — e.g. "8:24"
 *   date        — ISO "YYYY-MM-DD" (use the 1st when the exact day is unknown);
 *                 the "Jul 2026" month label is derived from this at render
 *   articleSlug — optional companion post in content/posts/ (renders a
 *                 "Read the article" link to /blog/{articleSlug})
 */
type Video = {
  id: string;
  title: string;
  duration: string;
  date: string;
  articleSlug?: string;
};

const VIDEOS: Video[] = [
  {
    id: "E2purjLAF9M",
    title:
      "The Missed-Call Text-Back: The Automation Businesses Pay You Monthly to Run",
    duration: "8:21",
    date: "2026-07-21",
    articleSlug: "missed-call-text-back-service",
  },
  {
    id: "6VBbpRnhHvc",
    title: "5 Automations Local Businesses Pay You Monthly For",
    duration: "9:47",
    date: "2026-07-14",
    articleSlug: "micro-automation-side-hustle-5-systems",
  },
  {
    id: "c6CcNKM27Yc",
    title: "How to Vet Any Online Income Opportunity in 10 Minutes",
    duration: "9:45",
    date: "2026-07-01",
    articleSlug: "vet-online-income-opportunity",
  },
  {
    id: "6C2KTFRXWhE",
    title:
      "How to Build Passive Income From Scratch in 2026? 5 Ideas That Actually Work",
    duration: "10:59",
    date: "2026-02-01",
  },
  {
    id: "dDpAoKCAiSE",
    title:
      "The 2026 Wealth Gap: Why Waiting 12 Months Just Costs You a Fortune!",
    duration: "14:05",
    date: "2026-02-01",
  },
];

// "2026-07-01" -> "Jul 2026". Parsed as LOCAL midnight (no trailing Z) so the
// month label never shifts a day under a negative-offset timezone.
function monthLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function Thumbnail({ video }: { video: Video }) {
  return (
    <div className="relative aspect-video rounded-[14px] overflow-hidden bg-slate-200">
      {video.id ? (
        // eslint-disable-next-line @next/next/no-img-element -- external ytimg thumbnail; next/image would need remotePatterns config
        <img
          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">
          Thumbnail pending
        </div>
      )}

      {/* Play affordance — bottom-left */}
      <span className="absolute bottom-2 left-2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md">
        <svg className="w-4 h-4 text-primary ml-0.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2.5v11l9-5.5-9-5.5z" />
        </svg>
      </span>

      {/* Duration chip — bottom-right */}
      <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
        {video.duration}
      </span>
    </div>
  );
}

export default function Videos() {
  return (
    <section id="videos" className="bg-white border-t border-slate-100 scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 py-16 lg:py-20">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-dark mb-2">
              Watch
            </p>
            <h2
              className="text-3xl md:text-[38px]/[1.2] font-extrabold text-primary"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Latest from the Moolah IQ channel
            </h2>
          </div>
          <a
            href={CHANNEL_URL || "#"}
            target={CHANNEL_URL ? "_blank" : undefined}
            rel={CHANNEL_URL ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-primary text-sm font-semibold px-5 py-2.5 rounded-full transition-colors hover:border-accent hover:text-accent"
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Subscribe on YouTube
          </a>
        </div>

        {/* Videos — 3-col desktop, single column below 1024px (a 2-col
            tablet layout orphans the third video) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-5">
          {[...VIDEOS]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((video, i) => (
              <div key={video.id || i}>
                <a
                  href={video.id ? `https://www.youtube.com/watch?v=${video.id}` : "#"}
                  target={video.id ? "_blank" : undefined}
                  rel={video.id ? "noopener noreferrer" : undefined}
                  className="group block"
                >
                  <Thumbnail video={video} />
                  <h3 className="text-[15px] font-bold text-primary mt-3 group-hover:text-accent transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-[13px] text-slate-400 mt-1">
                    {monthLabel(video.date)}
                  </p>
                </a>
                {video.articleSlug && (
                  <Link
                    href={`/blog/${video.articleSlug}`}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-primary mt-2 transition-colors"
                  >
                    Read the article <span aria-hidden>&rarr;</span>
                  </Link>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
