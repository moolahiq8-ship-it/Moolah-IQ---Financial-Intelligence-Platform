import { CHANNEL_URL } from "@/lib/social";

/*
 * Latest videos — HARDCODED by design (no YouTube API fetch).
 * To update: edit the three entries below.
 *   id       — the YouTube video id (the part after watch?v=, no &t= params)
 *   title    — display title
 *   duration — e.g. "8:24"
 *   age      — publish month (stable label; relative ages go stale)
 */
const VIDEOS = [
  {
    id: "c6CcNKM27Yc",
    title: "How to Vet Any Online Income Opportunity in 10 Minutes",
    duration: "9:45",
    age: "Jul 2026",
  },
  {
    id: "6C2KTFRXWhE",
    title:
      "How to Build Passive Income From Scratch in 2026? 5 Ideas That Actually Work",
    duration: "10:59",
    age: "Feb 2026",
  },
  {
    id: "dDpAoKCAiSE",
    title:
      "The 2026 Wealth Gap: Why Waiting 12 Months Just Costs You a Fortune!",
    duration: "14:05",
    age: "Feb 2026",
  },
];

function Thumbnail({ video }: { video: (typeof VIDEOS)[number] }) {
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
          {VIDEOS.map((video, i) => (
            <a
              key={video.id || i}
              href={video.id ? `https://www.youtube.com/watch?v=${video.id}` : "#"}
              target={video.id ? "_blank" : undefined}
              rel={video.id ? "noopener noreferrer" : undefined}
              className="group block"
            >
              <Thumbnail video={video} />
              <h3 className="text-[15px] font-bold text-primary mt-3 group-hover:text-accent transition-colors">
                {video.title}
              </h3>
              {video.age && (
                <p className="text-[13px] text-slate-400 mt-1">{video.age}</p>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
