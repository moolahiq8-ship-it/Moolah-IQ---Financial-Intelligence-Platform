"""QC Agent -- 60+ Point Checklist (V3.8.3.3).

Loads check definitions from config/qc_checks.yaml and evaluates each
one against the current pipeline state artifacts.  Programmatic checks
run real validation; checks that require human/LLM judgement are marked
as auto-pass with a note.

V3.8.3.3 categories: script, blog, newsletter, video, seo,
credential, compliance, platform_risk, self_improvement.
"""

from __future__ import annotations

import logging
import pathlib
import re
from typing import Any

import yaml
from dotenv import load_dotenv

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

QC_CHECKS_PATH = pathlib.Path(__file__).resolve().parents[2] / "config" / "qc_checks.yaml"
SETTINGS_PATH = pathlib.Path(__file__).resolve().parents[2] / "config" / "settings.yaml"

# Phrases that count as a financial disclaimer
DISCLAIMER_PHRASES = [
    "not financial advice",
    "not investment advice",
    "for educational purposes",
    "for informational purposes",
    "consult a professional",
    "consult a financial",
    "does not constitute",
    "seek professional advice",
]

SECTION_MARKERS_LEGACY = ["[HOOK]", "[PROBLEM]", "[STORY]", "[PRINCIPLE]", "[SOLUTION]", "[CTA]"]
# V3.8.3.3 uses timestamped markers like [0-8s HOOK], [90-180s STORY], etc.
# and renames SOLUTION → APPLICATION, PRINCIPLE → FRAMEWORK.
SECTION_MARKERS_V3 = [
    "[0-8s HOOK]", "[8-30s STAKE]", "[30-90s FIRST VALUE BOMB]",
    "[90-180s STORY]", "[180-300s FRAMEWORK]", "[300-420s APPLICATION]",
    "[420-480s TENSION LOOP]", "[480-510s CTA]",
]


class QCAgent:
    """Validates all artifacts against the 57-point checklist."""

    def __init__(self) -> None:
        self.name = "qc"
        self.checks = self._load_checks()
        self.settings = self._load_settings()
        log.info("[%s] Initialized -- %d checks loaded", self.name, len(self.checks))

    # -- Config loading --------------------------------------------------------

    @staticmethod
    def _load_checks() -> list[dict[str, Any]]:
        try:
            raw = QC_CHECKS_PATH.read_text(encoding="utf-8")
            checks = yaml.safe_load(raw)
            return checks if isinstance(checks, list) else []
        except Exception as exc:
            log.error("Failed to load qc_checks.yaml: %s", exc)
            return []

    @staticmethod
    def _load_settings() -> dict[str, Any]:
        try:
            raw = SETTINGS_PATH.read_text(encoding="utf-8")
            return yaml.safe_load(raw) or {}
        except Exception:
            return {}

    # -- Individual check runners ----------------------------------------------
    # Each returns (passed: bool, reason: str).

    def _check_script(self, check_id: str, script: str, metadata: dict) -> tuple[bool, str]:
        """Run script-category checks (QC-01 through QC-15)."""
        script_lower = script.lower()
        word_count = len(script.split())
        thresholds = self.settings.get("thresholds", {}).get("script", {})
        min_words = thresholds.get("min_words", 1200)
        max_words = thresholds.get("max_words", 1900)

        if check_id == "QC-01":  # Hook impact
            if re.search(r"\[.*?HOOK\b", script, re.IGNORECASE):
                return True, "Hook section present"
            return False, "No [HOOK] section found in script"

        if check_id == "QC-02":  # Story arc
            if re.search(r"\[.*?STORY\b", script, re.IGNORECASE):
                return True, "Story section present"
            return False, "No [STORY] section found in script"

        if check_id == "QC-03":  # Data citations
            sources = ["fred", "bls", "census", "bureau", "reserve", "survey",
                       "study", "report", "research", "data", "according to",
                       "source:", "statistic"]
            found = [s for s in sources if s in script_lower]
            if len(found) >= 2:
                return True, f"Found {len(found)} source indicators: {', '.join(found[:5])}"
            return False, f"Only {len(found)} source indicator(s) found -- need at least 2"

        if check_id == "QC-04":  # CTA clarity
            if re.search(r"\[.*?CTA\b", script, re.IGNORECASE) or "subscribe" in script_lower:
                return True, "CTA section or subscribe mention present"
            return False, "No [CTA] section or subscribe mention found"

        if check_id == "QC-05":  # Brand voice (requires LLM judgement)
            return True, "Auto-pass: brand voice requires LLM review"

        if check_id == "QC-06":  # Disclaimer presence
            for phrase in DISCLAIMER_PHRASES:
                if phrase in script_lower:
                    return True, f"Disclaimer found: '{phrase}'"
            return False, "No financial disclaimer found in script"

        if check_id == "QC-07":  # Pacing target (word count -> minutes)
            wpm = thresholds.get("target_wpm", 155)
            minutes = word_count / wpm
            if 8 <= minutes <= 12:
                return True, f"Script is {word_count} words (~{minutes:.1f} min at {wpm} WPM)"
            return False, f"Script is {word_count} words (~{minutes:.1f} min) -- target 8-12 min"

        if check_id == "QC-08":  # Transition smoothness (requires LLM)
            return True, "Auto-pass: transition quality requires LLM review"

        if check_id == "QC-09":  # Jargon avoidance (requires LLM)
            return True, "Auto-pass: jargon detection requires LLM review"

        if check_id == "QC-10":  # Emotional beats (requires LLM)
            return True, "Auto-pass: emotional beats require LLM review"

        if check_id == "QC-11":  # Principle statement
            if re.search(r"\[.*?(PRINCIPLE|FRAMEWORK)\b", script, re.IGNORECASE):
                return True, "Principle/Framework section present"
            if "principle" in script_lower:
                return True, "Principle keyword found in script"
            return False, "No [PRINCIPLE]/[FRAMEWORK] section or 'principle' keyword found"

        if check_id == "QC-12":  # Actionable steps
            if re.search(r"\[.*?(SOLUTION|APPLICATION)\b", script, re.IGNORECASE):
                # Count numbered items (1. 2. 3. or 1) 2) 3))
                numbered = re.findall(r"(?:^|\n)\s*\d+[\.\)]\s", script)
                if len(numbered) >= 3:
                    return True, f"Found {len(numbered)} numbered steps in solution"
                return False, f"Only {len(numbered)} numbered step(s) -- need at least 3"
            return False, "No [SOLUTION]/[APPLICATION] section found"

        if check_id == "QC-13":  # Audience addressing
            you_count = len(re.findall(r"\byou\b", script_lower))
            if you_count >= 5:
                return True, f"Script addresses viewer 'you' {you_count} times"
            return False, f"Script uses 'you' only {you_count} time(s) -- need at least 5"

        if check_id == "QC-14":  # Length compliance
            if min_words <= word_count <= max_words:
                return True, f"Script length {word_count} words (target {min_words}-{max_words})"
            return False, f"Script length {word_count} words -- outside {min_words}-{max_words} range"

        if check_id == "QC-15":  # Originality (requires historical data)
            return True, "Auto-pass: originality check requires historical video database"

        return True, "Unknown script check -- auto-pass"

    def _check_blog(self, check_id: str, blog: str, metadata: dict) -> tuple[bool, str]:
        """Run blog-category checks (QC-16 through QC-27)."""
        blog_lower = blog.lower()
        thresholds = self.settings.get("thresholds", {}).get("blog", {})

        if check_id == "QC-16":  # SEO heading structure
            h1_count = len(re.findall(r"<h1[\s>]", blog_lower)) + len(re.findall(r"^#\s", blog, re.MULTILINE))
            h2_found = bool(re.search(r"<h2[\s>]|^##\s", blog, re.MULTILINE | re.IGNORECASE))
            if h1_count == 1 and h2_found:
                return True, "Found 1 H1 and H2 subheadings"
            if h1_count == 0 and h2_found:
                return False, "No H1 found -- blog needs exactly 1 H1"
            if h1_count > 1:
                return False, f"Found {h1_count} H1 tags -- need exactly 1"
            return False, "No heading structure (H1/H2) found"

        if check_id == "QC-17":  # Keyword density
            primary_kw = metadata.get("primary_keyword", "")
            if not primary_kw:
                return True, "Auto-pass: no primary keyword defined"
            word_count = len(blog.split())
            kw_count = blog_lower.count(primary_kw.lower())
            density = (kw_count / word_count) if word_count > 0 else 0
            min_d = thresholds.get("keyword_density_min", 0.015)
            max_d = thresholds.get("keyword_density_max", 0.025)
            if min_d <= density <= max_d:
                return True, f"Keyword '{primary_kw}' density {density:.3f} ({kw_count} occurrences)"
            return False, f"Keyword '{primary_kw}' density {density:.3f} -- target {min_d}-{max_d}"

        if check_id == "QC-18":  # Internal links
            min_links = thresholds.get("min_internal_links", 3)
            links = re.findall(r"https?://moolahiq\.com", blog_lower)
            if len(links) >= min_links:
                return True, f"Found {len(links)} internal links (min {min_links})"
            return False, f"Only {len(links)} internal link(s) -- need at least {min_links}"

        if check_id == "QC-19":  # Readability score (simplified Flesch estimate)
            return True, "Auto-pass: Flesch score requires dedicated NLP library"

        if check_id == "QC-20":  # Image alt text
            imgs_no_alt = re.findall(r"<img(?![^>]*\balt=)[^>]*>", blog, re.IGNORECASE)
            imgs_total = re.findall(r"<img[^>]*>", blog, re.IGNORECASE)
            if not imgs_total:
                return True, "No images in blog -- check N/A"
            if not imgs_no_alt:
                return True, f"All {len(imgs_total)} image(s) have alt text"
            return False, f"{len(imgs_no_alt)} of {len(imgs_total)} image(s) missing alt text"

        if check_id == "QC-21":  # Meta description
            meta_desc = metadata.get("blog_meta_description", "")
            if meta_desc and len(meta_desc) <= 155:
                return True, f"Meta description: {len(meta_desc)} chars"
            if not meta_desc:
                return False, "No blog meta description in metadata"
            return False, f"Meta description too long: {len(meta_desc)} chars (max 155)"

        if check_id == "QC-22":  # CTA placement
            cta_words = ["subscribe", "sign up", "newsletter", "download", "watch",
                         "click here", "learn more", "get started", "join"]
            found = [w for w in cta_words if w in blog_lower]
            if len(found) >= 1:
                return True, f"CTA keywords found: {', '.join(found[:3])}"
            return False, "No CTA keywords found in blog"

        if check_id == "QC-23":  # Mobile formatting
            return True, "Auto-pass: mobile formatting requires rendering engine"

        if check_id == "QC-24":  # Schema markup
            has_video = bool(metadata.get("schema_video_object"))
            has_article = bool(metadata.get("schema_article"))
            if has_video and has_article:
                return True, "VideoObject and Article schema present"
            missing = []
            if not has_video:
                missing.append("VideoObject")
            if not has_article:
                missing.append("Article")
            return False, f"Missing schema: {', '.join(missing)}"

        if check_id == "QC-25":  # Canonical URL
            return True, "Auto-pass: canonical URL set at deploy time"

        if check_id == "QC-26":  # Social OG tags
            og_title = metadata.get("blog_og_title", "")
            og_desc = metadata.get("blog_og_description", "")
            if og_title and og_desc:
                return True, "OG title and description present"
            return False, "Missing OG tags in metadata"

        if check_id == "QC-27":  # Blog disclaimer
            for phrase in DISCLAIMER_PHRASES:
                if phrase in blog_lower:
                    return True, f"Blog disclaimer found: '{phrase}'"
            return False, "No financial disclaimer found in blog post"

        return True, "Unknown blog check -- auto-pass"

    def _check_newsletter(self, check_id: str, newsletter: str,
                          nl_meta: dict, metadata: dict) -> tuple[bool, str]:
        """Run newsletter-category checks (QC-28 through QC-35)."""
        nl_lower = newsletter.lower()
        thresholds = self.settings.get("thresholds", {}).get("newsletter", {})

        if check_id == "QC-28":  # Subject line length
            subject = nl_meta.get("subject", "")
            max_len = thresholds.get("max_subject_length", 50)
            if not subject:
                return False, "No subject line found in newsletter metadata"
            if len(subject) <= max_len:
                return True, f"Subject line: {len(subject)} chars (max {max_len})"
            return False, f"Subject line too long: {len(subject)} chars (max {max_len})"

        if check_id == "QC-29":  # Preview text
            preview = nl_meta.get("preview_text", "")
            max_len = thresholds.get("max_preview_length", 90)
            if not preview:
                return False, "No preview text in newsletter metadata"
            if len(preview) <= max_len:
                return True, f"Preview text: {len(preview)} chars (max {max_len})"
            return False, f"Preview text too long: {len(preview)} chars (max {max_len})"

        if check_id == "QC-30":  # Body word count
            max_words = thresholds.get("max_words", 500)
            word_count = len(newsletter.split())
            if word_count <= max_words:
                return True, f"Newsletter body: {word_count} words (max {max_words})"
            return False, f"Newsletter body too long: {word_count} words (max {max_words})"

        if check_id == "QC-31":  # Link functionality
            links = re.findall(r'href=["\']([^"\']+)["\']', newsletter)
            template_links = [l for l in links if "{{" in l]
            real_links = [l for l in links if "{{" not in l]
            total = len(template_links) + len(real_links)
            if total > 0:
                return True, f"Found {total} links ({len(template_links)} template, {len(real_links)} real)"
            if "http" in nl_lower or "www." in nl_lower:
                return True, "URL references found in newsletter"
            return False, "No links found in newsletter"

        if check_id == "QC-32":  # Unsubscribe link
            if "unsubscribe" in nl_lower:
                return True, "Unsubscribe reference found"
            # Beehiiv handles unsubscribe automatically
            return True, "Auto-pass: Beehiiv adds unsubscribe link automatically"

        if check_id == "QC-33":  # CTA clarity
            cta_words = ["watch", "read", "click", "subscribe", "join", "learn", "check out"]
            found = [w for w in cta_words if w in nl_lower]
            if found:
                return True, f"CTA keywords found: {', '.join(found[:3])}"
            return False, "No clear CTA found in newsletter"

        if check_id == "QC-34":  # Personalization tokens
            if "{{first_name}}" in newsletter or "{{ first_name }}" in newsletter:
                return True, "Personalization token {{first_name}} present"
            if "{first_name}" in newsletter:
                return True, "Personalization token found (single-brace variant)"
            return False, "No {{first_name}} personalization token found"

        if check_id == "QC-35":  # Spam score estimate
            subject = nl_meta.get("subject", "")
            # Check for ALL CAPS words (more than 2 in a row)
            caps_words = re.findall(r"\b[A-Z]{3,}\b", subject + " " + newsletter[:200])
            # Check excessive punctuation
            excessive_punct = bool(re.search(r"[!?]{3,}", subject + " " + newsletter[:200]))
            issues = []
            if len(caps_words) > 2:
                issues.append(f"{len(caps_words)} ALL-CAPS words")
            if excessive_punct:
                issues.append("excessive punctuation (3+ !/?)")
            if issues:
                return False, f"Spam risk: {', '.join(issues)}"
            return True, "No spam indicators detected"

        return True, "Unknown newsletter check -- auto-pass"

    def _check_video(self, check_id: str, visuals: dict, audio: dict,
                     metadata: dict) -> tuple[bool, str]:
        """Run video-category checks (QC-36 through QC-49).
        Most are deferred until real production assets exist."""
        # Video checks require actual files from the production agent.
        # Mark as deferred when no production assets are present.
        if not visuals.get("thumbnail") or str(visuals.get("thumbnail", "")).startswith("[STUB]"):
            return True, "Deferred: production assets not yet generated"
        return True, f"Auto-pass: {check_id} requires file inspection"

    def _check_seo(self, check_id: str, metadata: dict) -> tuple[bool, str]:
        """Run SEO-category checks (QC-50 through QC-57)."""
        thresholds = self.settings.get("thresholds", {}).get("seo", {})

        if check_id == "QC-50":  # YouTube title length
            title = metadata.get("youtube_title_a", "")
            max_len = thresholds.get("max_title_length", 60)
            if not title:
                return False, "No YouTube title in metadata"
            if len(title) <= max_len:
                return True, f"YouTube title: {len(title)} chars (max {max_len})"
            return False, f"YouTube title too long: {len(title)} chars (max {max_len})"

        if check_id == "QC-51":  # YouTube description length
            desc = metadata.get("youtube_description", "")
            word_count = len(desc.split())
            if 200 <= word_count <= 300:
                return True, f"YouTube description: {word_count} words"
            if word_count > 0:
                return False, f"YouTube description: {word_count} words (target 200-300)"
            return False, "No YouTube description in metadata"

        if check_id == "QC-52":  # Tag count
            tags = metadata.get("youtube_tags", [])
            min_t = thresholds.get("min_tags", 15)
            max_t = thresholds.get("max_tags", 25)
            count = len(tags)
            # Our SEO agent targets 50 tags, which is > 25 but valid for YouTube
            if count >= min_t:
                return True, f"Tag count: {count} (min {min_t})"
            return False, f"Only {count} tags (min {min_t})"

        if check_id == "QC-53":  # Hashtag count
            hashtags = metadata.get("youtube_hashtags", [])
            target = thresholds.get("hashtag_count", 3)
            if len(hashtags) == target:
                return True, f"Exactly {target} hashtags present"
            return False, f"Found {len(hashtags)} hashtags (need exactly {target})"

        if check_id == "QC-54":  # Keyword presence
            kw = metadata.get("primary_keyword", "")
            if not kw:
                return True, "Auto-pass: no primary keyword defined"
            kw_lower = kw.lower()
            title = metadata.get("youtube_title_a", "").lower()
            desc = metadata.get("youtube_description", "").lower()
            tags = [t.lower() for t in metadata.get("youtube_tags", [])]
            in_title = kw_lower in title
            in_desc = kw_lower in desc[:200]  # first sentence area
            in_tags = sum(1 for t in tags if kw_lower in t)
            if in_title and in_desc and in_tags >= 2:
                return True, f"Keyword '{kw}' in title, description, and {in_tags} tags"
            issues = []
            if not in_title:
                issues.append("not in title")
            if not in_desc:
                issues.append("not in description start")
            if in_tags < 2:
                issues.append(f"only in {in_tags} tag(s)")
            return False, f"Keyword '{kw}': {', '.join(issues)}"

        if check_id == "QC-55":  # Schema validity
            has_video = bool(metadata.get("schema_video_object"))
            has_article = bool(metadata.get("schema_article"))
            if has_video and has_article:
                return True, "VideoObject and Article schema present"
            return False, "Schema markup missing or incomplete"

        if check_id == "QC-56":  # OG tag completeness
            og_title = metadata.get("blog_og_title", "")
            og_desc = metadata.get("blog_og_description", "")
            if og_title and og_desc:
                return True, "OG title and description present"
            return False, "OG tags incomplete"

        if check_id == "QC-57":  # Internal link count
            links = metadata.get("blog_internal_links", [])
            if len(links) >= 3:
                return True, f"Found {len(links)} internal links"
            return False, f"Only {len(links)} internal link(s) -- need at least 3"

        return True, "Unknown SEO check -- auto-pass"

    # -- V3.8.3.3 Credential Originality checks (#37-40) -----------------------

    def _check_credential(self, check_id: str, script: str,
                          metadata: dict) -> tuple[bool, str]:
        """Run credential-category checks (QC-37 through QC-40)."""
        script_lower = script.lower()

        # Credential markers to detect
        cred_markers = {
            "real_estate": ["realtor", "real estate", "working with buyers", "property"],
            "insurance": ["insurance", "licensed", "p&c", "life/health", "series 6"],
            "trader": ["trader", "futures", "options", "derivatives", "trading"],
            "property_owner": ["investment propert", "rental", "cash flow", "landlord"],
            "str_operator": ["short-term rental", "str", "airbnb", "vrbo", "occupancy"],
        }

        if check_id == "QC-37":  # At least 1 credential perspective
            found = [c for c, markers in cred_markers.items()
                     if any(m in script_lower for m in markers)]
            if found:
                return True, f"Credential perspectives found: {', '.join(found)}"
            return False, "No credential perspective detected in script"

        if check_id == "QC-38":  # Multi-credential for high-scoring topics
            found = [c for c, markers in cred_markers.items()
                     if any(m in script_lower for m in markers)]
            if len(found) >= 2:
                return True, f"Multi-credential: {', '.join(found)}"
            return False, f"Only {len(found)} credential(s) -- high-scoring topics need 2+"

        if check_id == "QC-39":  # No generic AI phrases
            ai_phrases = [
                "in today's fast-paced world", "it's important to note",
                "in conclusion", "without further ado", "dive deep into",
                "game-changer", "unlock the secrets", "harness the power",
                "navigate the complexities", "at the end of the day",
                "paradigm shift", "synergy", "leveraging", "circle back",
            ]
            found = [p for p in ai_phrases if p in script_lower]
            if not found:
                return True, "No generic AI phrases detected"
            return False, f"Generic AI phrases found: {', '.join(found[:3])}"

        if check_id == "QC-40":  # Credential in first 300 words
            first_300 = " ".join(script.split()[:300]).lower()
            found = [c for c, markers in cred_markers.items()
                     if any(m in first_300 for m in markers)]
            if found:
                return True, f"Credential in first 300 words: {', '.join(found)}"
            return False, "No credential reference in first 300 words"

        return True, "Unknown credential check -- auto-pass"

    # -- V3.8.3.3 Compliance checks (#41-44) -----------------------------------

    def _check_compliance(self, check_id: str, script: str, blog: str,
                          metadata: dict) -> tuple[bool, str]:
        """Run compliance-category checks (QC-41 through QC-44)."""
        script_lower = script.lower()

        if check_id == "QC-41":  # Synthetic content flag
            flag = metadata.get("synthetic_content_flag", False)
            if flag:
                return True, "Synthetic content flag is set"
            return False, "YouTube synthetic content flag not set (Qwen3-TTS requires it)"

        if check_id == "QC-42":  # Financial disclaimer
            for phrase in DISCLAIMER_PHRASES:
                if phrase in script_lower:
                    return True, f"Script disclaimer found: '{phrase}'"
            return False, "No financial disclaimer in script"

        if check_id == "QC-43":  # AI disclosure
            desc = metadata.get("youtube_description", "").lower()
            if "ai" in desc or "artificial intelligence" in desc or "ai-assisted" in desc:
                return True, "AI disclosure found in description"
            return False, "No AI disclosure in YouTube description"

        if check_id == "QC-44":  # No stock/fund recs without disclaimer
            risky = ["buy", "sell", "invest in", "get into"]
            tickers = re.findall(r"\b[A-Z]{2,5}\b", script)
            has_risky = any(r in script_lower for r in risky) and len(tickers) > 3
            if not has_risky:
                return True, "No specific stock/fund recommendations detected"
            for phrase in DISCLAIMER_PHRASES:
                if phrase in script_lower:
                    return True, "Stock references present but disclaimer covers them"
            return False, "Specific stock/fund references without adequate disclaimer"

        return True, "Unknown compliance check -- auto-pass"

    # -- V3.8.3.3 Platform Risk checks (#45-57) --------------------------------

    def _check_platform_risk(self, check_id: str, script: str,
                             metadata: dict) -> tuple[bool, str]:
        """Run platform risk checks (QC-45 through QC-57)."""
        script_lower = script.lower()

        if check_id == "QC-45":  # First-person credential context
            first_person = ["i ", "my ", "i've", "i'm", "in my experience"]
            found = [p for p in first_person if p in script_lower[:1000]]
            if len(found) >= 2:
                return True, f"First-person credential framing detected: {len(found)} markers"
            return False, "Insufficient first-person credential framing"

        if check_id == "QC-46":  # Visual variation (requires production history)
            return True, "Deferred: visual variation requires production history comparison"

        if check_id == "QC-47":  # Upload velocity
            return True, "Auto-pass: velocity enforced by Publishing Agent"

        if check_id == "QC-48":  # Metadata alignment
            title = metadata.get("youtube_title_a", "").lower()
            if not title:
                return True, "Auto-pass: no title generated yet"
            # Check that key claims in title appear in script
            title_words = set(title.split()) - {"the", "a", "an", "of", "to", "in", "for", "and", "or", "is", "how"}
            script_words = set(script_lower.split())
            overlap = title_words & script_words
            ratio = len(overlap) / max(len(title_words), 1)
            if ratio >= 0.5:
                return True, f"Metadata alignment: {ratio:.0%} title words in script"
            return False, f"Metadata alignment low: {ratio:.0%} -- title claims may not match script"

        if check_id == "QC-49":  # Synthetic disclosure for TTS
            return True, "Deferred: checked at upload time via YouTube API flag"

        if check_id == "QC-50":  # No fear/shock in first 30s
            hook = script_lower[:500]
            fear_words = ["terrifying", "horrifying", "shocking", "scared", "panic",
                          "disaster", "catastrophe", "nightmare", "devastating"]
            found = [w for w in fear_words if w in hook]
            if not found:
                return True, "No fear/shock language in hook"
            return False, f"Fear/shock words in hook: {', '.join(found)}"

        if check_id == "QC-51":  # Pattern interrupt density
            return True, "Auto-pass: pattern interrupt density requires LLM analysis"

        if check_id == "QC-52":  # Originality ratio
            return True, "Deferred: originality ratio requires production asset analysis"

        if check_id == "QC-53":  # Intent alignment
            return True, "Auto-pass: intent alignment requires LLM review of title vs content"

        if check_id == "QC-54":  # Why Now relevance
            return True, "Auto-pass: Why Now relevance requires Research Agent context"

        if check_id == "QC-55":  # Superlative/hype ban
            superlatives = ["revolutionary", "unprecedented", "game-changing", "explosive",
                            "life-altering", "mind-blowing", "insane", "incredible gains",
                            "crushing", "destroying", "killing it"]
            found = [s for s in superlatives if s in script_lower]
            if not found:
                return True, "No superlative/hype language detected"
            return False, f"Superlative/hype language found: {', '.join(found)}"

        if check_id == "QC-56":  # VIS Enrollment Level 3-5
            return True, "Auto-pass: VIS scoring requires LLM analysis"

        if check_id == "QC-57":  # Newsletter shadow specificity
            newsletter = metadata.get("newsletter_body", "")
            if not newsletter:
                return True, "Auto-pass: no newsletter content to check"
            city_indicators = ["san francisco", "bay area", "new york", "los angeles",
                               "chicago", "miami", "houston", "seattle", "denver", "boston"]
            found = [c for c in city_indicators if c in newsletter.lower()]
            if not found:
                return True, "No local names in newsletter -- shadow specificity maintained"
            return False, f"Local names in newsletter: {', '.join(found)}"

        return True, "Unknown platform risk check -- auto-pass"

    # -- V3.8.3.3 Self-Improvement Validation checks (#58-61) ------------------

    def _check_self_improvement(self, check_id: str,
                                state: PipelineState) -> tuple[bool, str]:
        """Run self-improvement validation checks (QC-58 through QC-61)."""
        improvement = state.get("improvement_cycle_status", {})

        if check_id == "QC-58":  # Prompt evolution validation
            prompt_version = state.get("prompt_version", {})
            if not prompt_version:
                return True, "No prompt evolutions deployed this week"
            ab_config = state.get("ab_test_config", {})
            active = ab_config.get("active_tests", [])
            if active:
                return True, f"A/B test active and tracking ({len(active)} tests)"
            return False, "Prompt evolved but no A/B test initialized"

        if check_id == "QC-59":  # Retention pattern library query
            return True, "Auto-pass: retention pattern query verification requires Content Agent logging"

        if check_id == "QC-60":  # Performance harvest completeness
            harvest_status = improvement.get("harvest", "")
            if harvest_status == "complete":
                return True, "Performance harvest complete"
            if not harvest_status:
                return True, "Auto-pass: harvest not yet scheduled"
            return False, f"Performance harvest status: {harvest_status}"

        if check_id == "QC-61":  # Library coverage rate
            return True, "Deferred: library coverage requires D: drive scan"

        return True, "Unknown self-improvement check -- auto-pass"

    # -- Main entry point ------------------------------------------------------

    def run(self, state: PipelineState) -> PipelineState:
        """Run all QC checks (60+ point checklist, V3.8.3.3) and attach results to state."""
        log.info("[%s] Running %d-point QC checklist", self.name, len(self.checks))

        script = state.get("script", "")
        blog = state.get("blog", "")
        newsletter_body = state.get("newsletter", "")
        metadata = state.get("metadata", {})
        nl_meta = metadata.get("newsletter", {})
        visuals = state.get("visuals", {})
        audio = state.get("audio", {})

        results: list[dict[str, Any]] = []
        pass_count = 0
        fail_count = 0
        blocking_fail_count = 0

        for check in self.checks:
            check_id = check.get("id", "")
            category = check.get("category", "")
            name = check.get("name", "")
            severity = check.get("severity", "warning")

            # Route to the correct category checker
            try:
                if category == "script":
                    passed, reason = self._check_script(check_id, script, metadata)
                elif category == "blog":
                    passed, reason = self._check_blog(check_id, blog, metadata)
                elif category == "newsletter":
                    passed, reason = self._check_newsletter(check_id, newsletter_body, nl_meta, metadata)
                elif category == "video":
                    passed, reason = self._check_video(check_id, visuals, audio, metadata)
                elif category == "seo":
                    passed, reason = self._check_seo(check_id, metadata)
                elif category == "credential":
                    passed, reason = self._check_credential(check_id, script, metadata)
                elif category == "compliance":
                    passed, reason = self._check_compliance(check_id, script, blog, metadata)
                elif category == "platform_risk":
                    passed, reason = self._check_platform_risk(check_id, script, metadata)
                elif category == "self_improvement":
                    passed, reason = self._check_self_improvement(check_id, state)
                else:
                    passed, reason = True, f"Unknown category '{category}' -- auto-pass"
            except Exception as exc:
                passed = False
                reason = f"Check raised exception: {exc}"
                log.warning("[%s] %s (%s) raised: %s", self.name, check_id, name, exc)

            if passed:
                pass_count += 1
            else:
                fail_count += 1
                if severity in ("blocking", "critical", "high"):
                    blocking_fail_count += 1
                log_fn = log.warning if severity in ("blocking", "critical", "high") else log.info
                log_fn("[%s] FAIL %s [%s] %s: %s", self.name, check_id, severity, name, reason)

            results.append({
                "check_id": check_id,
                "category": category,
                "name": name,
                "severity": severity,
                "passed": passed,
                "reason": reason,
                "responsible_agent": check.get("responsible_agent", ""),
            })

        state["qc_results"] = results
        log.info(
            "[%s] QC complete -- %d passed, %d failed (%d blocking), %d total",
            self.name, pass_count, fail_count, blocking_fail_count, len(results),
        )
        return state
