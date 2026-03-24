"""Compliance Agent -- BLOCK Authority.

Final gate before publishing. Scans all content artifacts against
regulatory, brand-safety, accuracy, and platform compliance rules.
Uses pattern matching -- no external LLM calls required.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

# -- Compliance rule patterns --------------------------------------------------

# Phrases that suggest specific investment advice
INVESTMENT_ADVICE_PATTERNS = [
    r"\bbuy\s+(?:shares?|stock|stocks|crypto|bitcoin|ethereum|etf)\b",
    r"\bsell\s+(?:your\s+)?(?:shares?|stock|stocks|crypto|bitcoin|ethereum|etf)\b",
    r"\binvest\s+in\s+(?:this|these|the)\b",
    r"\bput\s+(?:your\s+)?money\s+(?:in|into)\s+\w+\s+(?:stock|fund|etf|crypto)\b",
    r"\byou\s+should\s+(?:buy|sell|invest|trade)\b",
    r"\bi\s+recommend\s+(?:buying|selling|investing|trading)\b",
    r"\bmy\s+top\s+(?:stock|crypto|investment)\s+pick",
]

# Phrases that suggest guaranteed returns
GUARANTEED_RETURN_PATTERNS = [
    r"\bguaranteed?\s+(?:return|profit|income|gain|money)\b",
    r"\brisk[- ]free\s+(?:return|investment|profit)\b",
    r"\byou\s+(?:will|can)\s+(?:definitely|certainly|absolutely)\s+(?:make|earn|profit)\b",
    r"\b(?:double|triple)\s+your\s+money\b",
    r"\b(?:100|200|300)\s*%\s+(?:return|profit|gain)\b",
    r"\bnever\s+lose\s+money\b",
    r"\bcan(?:'t| not)\s+(?:fail|lose)\b",
]

# Known competitor names to avoid disparaging
COMPETITOR_NAMES = [
    "dave ramsey", "ramsey solutions", "graham stephan", "andrei jikh",
    "minority mindset", "jaspreet singh", "meet kevin", "financial education",
    "nerdwallet", "bankrate", "investopedia", "motley fool", "suze orman",
    "robert kiyosaki", "rich dad",
]

# Profanity / offensive language (abbreviated list -- extend as needed)
PROFANITY_PATTERNS = [
    r"\b(?:damn|hell|crap|ass|shit|fuck|bitch|bastard)\b",
]

# Disclaimer phrases that MUST appear
DISCLAIMER_PHRASES = [
    "not financial advice",
    "not investment advice",
    "for educational purposes",
    "for informational purposes",
    "consult a professional",
    "consult a financial",
    "does not constitute",
]

# Patterns that claim to be a licensed advisor
ADVISOR_CLAIM_PATTERNS = [
    r"\bi\s+am\s+(?:a\s+)?(?:certified|licensed|registered)\s+(?:financial|investment)\b",
    r"\bas\s+(?:a|your)\s+financial\s+advisor\b",
    r"\bi\s+(?:am|'m)\s+(?:a\s+)?(?:cfp|cfa|cpa)\b",
]


class ComplianceAgent:
    """Final compliance gate with absolute block authority."""

    # Words that negate the meaning of a flagged phrase (e.g. "no guaranteed return").
    _NEGATION_WORDS = {"no", "not", "never", "without", "isn't", "aren't",
                       "doesn't", "don't", "won't", "can't", "cannot", "zero"}

    def __init__(self) -> None:
        self.name = "compliance"
        log.info("[%s] Initialized -- BLOCK AUTHORITY active", self.name)

    # -- Rule scanners ---------------------------------------------------------

    @staticmethod
    def _is_negated(text: str, match_start: int) -> bool:
        """Return True if the match is preceded by a negation word within 5 words."""
        prefix = text[max(0, match_start - 60):match_start]
        words = prefix.lower().split()[-5:]  # last 5 words before match
        return bool(ComplianceAgent._NEGATION_WORDS & set(words))

    @staticmethod
    def _scan_patterns(text: str, patterns: list[str], label: str) -> list[dict[str, str]]:
        """Scan text against a list of regex patterns, returning matches.

        Matches preceded by a negation word (within 5 words) are treated as
        educational/cautionary usage and skipped.
        """
        flags: list[dict[str, str]] = []
        for pattern in patterns:
            for m in re.finditer(pattern, text, re.IGNORECASE):
                if ComplianceAgent._is_negated(text, m.start()):
                    log.info(
                        "[compliance] Negated match OK: '%s' (educational context)",
                        m.group(),
                    )
                    continue
                flags.append({"rule": label, "match": m.group(), "pattern": pattern})
        return flags

    def _check_disclaimers(self, text: str) -> tuple[bool, str]:
        """Verify at least one financial disclaimer is present."""
        text_lower = text.lower()
        for phrase in DISCLAIMER_PHRASES:
            if phrase in text_lower:
                return True, f"Disclaimer found: '{phrase}'"
        return False, "No financial disclaimer found"

    def _check_competitor_mentions(self, text: str) -> list[dict[str, str]]:
        """Flag any competitor name that appears in a negative context."""
        flags: list[dict[str, str]] = []
        text_lower = text.lower()
        # Negative context words near competitor names
        negative_words = ["worse", "bad", "terrible", "wrong", "scam",
                          "misleading", "don't listen", "avoid", "inferior"]
        for name in COMPETITOR_NAMES:
            if name in text_lower:
                # Check if negative context appears within 100 chars of the name
                idx = text_lower.find(name)
                window = text_lower[max(0, idx - 100):idx + len(name) + 100]
                negative_nearby = [w for w in negative_words if w in window]
                if negative_nearby:
                    flags.append({
                        "rule": "competitor_disparagement",
                        "match": f"'{name}' near negative words: {', '.join(negative_nearby)}",
                        "pattern": "competitor + negative context",
                    })
                else:
                    # Neutral mention is OK but worth noting
                    log.info("[%s] Neutral competitor mention: '%s'", self.name, name)
        return flags

    # -- Main entry point ------------------------------------------------------

    def run(self, state: PipelineState) -> PipelineState:
        """Review all artifacts for compliance violations."""
        log.info("[%s] Reviewing content for compliance", self.name)

        script = state.get("script", "")
        blog = state.get("blog", "")
        newsletter = state.get("newsletter", "")
        all_content = f"{script}\n\n{blog}\n\n{newsletter}"

        all_flags: list[str] = []
        reviewer_notes: list[str] = []

        # -- 1. Investment advice check ----------------------------------------
        advice_flags = self._scan_patterns(
            all_content, INVESTMENT_ADVICE_PATTERNS, "specific_investment_advice"
        )
        if advice_flags:
            for f in advice_flags:
                flag_msg = f"INVESTMENT ADVICE: '{f['match']}'"
                all_flags.append(flag_msg)
                log.warning("[%s] %s", self.name, flag_msg)
            reviewer_notes.append(
                f"Found {len(advice_flags)} instance(s) of specific investment advice."
            )

        # -- 2. Guaranteed return claims ---------------------------------------
        return_flags = self._scan_patterns(
            all_content, GUARANTEED_RETURN_PATTERNS, "guaranteed_returns"
        )
        if return_flags:
            for f in return_flags:
                flag_msg = f"GUARANTEED RETURN: '{f['match']}'"
                all_flags.append(flag_msg)
                log.warning("[%s] %s", self.name, flag_msg)
            reviewer_notes.append(
                f"Found {len(return_flags)} guaranteed-return claim(s)."
            )

        # -- 3. Unlicensed advisor claims --------------------------------------
        advisor_flags = self._scan_patterns(
            all_content, ADVISOR_CLAIM_PATTERNS, "unlicensed_advisor_claim"
        )
        if advisor_flags:
            for f in advisor_flags:
                flag_msg = f"ADVISOR CLAIM: '{f['match']}'"
                all_flags.append(flag_msg)
                log.warning("[%s] %s", self.name, flag_msg)
            reviewer_notes.append(
                f"Found {len(advisor_flags)} unlicensed advisor claim(s)."
            )

        # -- 4. Competitor disparagement ---------------------------------------
        competitor_flags = self._check_competitor_mentions(all_content)
        if competitor_flags:
            for f in competitor_flags:
                flag_msg = f"COMPETITOR DISPARAGEMENT: {f['match']}"
                all_flags.append(flag_msg)
                log.warning("[%s] %s", self.name, flag_msg)
            reviewer_notes.append(
                f"Found {len(competitor_flags)} competitor disparagement(s)."
            )

        # -- 5. Profanity check ------------------------------------------------
        profanity_flags = self._scan_patterns(
            all_content, PROFANITY_PATTERNS, "profanity"
        )
        if profanity_flags:
            for f in profanity_flags:
                flag_msg = f"PROFANITY: '{f['match']}'"
                all_flags.append(flag_msg)
                log.warning("[%s] %s", self.name, flag_msg)
            reviewer_notes.append(
                f"Found {len(profanity_flags)} profanity instance(s)."
            )

        # -- 6. Disclaimer verification ----------------------------------------
        script_ok, script_note = self._check_disclaimers(script)
        blog_ok, blog_note = self._check_disclaimers(blog)

        if not script_ok:
            all_flags.append("MISSING DISCLAIMER: script has no financial disclaimer")
            reviewer_notes.append("Script missing disclaimer.")
            log.warning("[%s] Script missing financial disclaimer", self.name)

        if not blog_ok:
            all_flags.append("MISSING DISCLAIMER: blog has no financial disclaimer")
            reviewer_notes.append("Blog missing disclaimer.")
            log.warning("[%s] Blog missing financial disclaimer", self.name)

        # -- Verdict -----------------------------------------------------------
        approved = len(all_flags) == 0

        if approved:
            reviewer_notes.append("All compliance checks passed. Content is clear for publishing.")
            log.info("[%s] COMPLIANCE APPROVED -- no flags", self.name)
        else:
            log.warning("[%s] COMPLIANCE BLOCKED -- %d flag(s)", self.name, len(all_flags))

        state["compliance_result"] = {
            "approved": approved,
            "flags": all_flags,
            "reviewer": "compliance-agent",
            "reviewer_notes": " | ".join(reviewer_notes),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return state
