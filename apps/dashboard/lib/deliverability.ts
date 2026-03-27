/**
 * Client-side deliverability scoring for cold outreach emails.
 * Detects patterns that trigger Gmail Promotions tab or spam filters.
 * No external calls — runs entirely in the browser.
 */

export interface DeliverabilityReport {
  score: number;          // 0–100
  tier: "green" | "yellow" | "red";
  flags: DeliverabilityFlag[];
  linkCount: number;
  promoWordMatches: string[];
  subjectLength: number;
  htmlBytes: number;
  wordCount: number;
}

export interface DeliverabilityFlag {
  level: "warn" | "error";
  message: string;
}

// Words that signal a marketing email to spam filters
const PROMO_WORDS = [
  "automate",
  "automation",
  "streamline",
  "efficiency",
  "leverage",
  "innovative",
  "schedule a call",
  "free consultation",
  "results",
  " roi ",
  "save time",
  "reach out",
  "quick question",
  "following up",
  "touching base",
  "game-changer",
  " solution",
  "solutions",
  "growth",
  "scale",
  "scalable",
  "synergy",
  "cutting-edge",
  "seamless",
  "boost",
];

function countLinks(html: string): number {
  const matches = html.match(/<a\s/gi);
  return matches ? matches.length : 0;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.split(" ").filter(Boolean).length;
}

function findPromoWords(subject: string, body: string): string[] {
  const combined = (subject + " " + body).toLowerCase();
  return PROMO_WORDS.filter((w) => combined.includes(w));
}

export function scoreDeliverability(
  subject: string,
  emailBody: string
): DeliverabilityReport {
  const flags: DeliverabilityFlag[] = [];
  let score = 100;

  const linkCount = countLinks(emailBody);
  const promoWordMatches = findPromoWords(subject, emailBody);
  const subjectLength = subject.length;
  const htmlBytes = new TextEncoder().encode(emailBody).length;
  const wordCount = countWords(emailBody);

  // Link count checks
  if (linkCount > 3) {
    flags.push({ level: "error", message: `${linkCount} links — Gmail Promotions risk (max 2)` });
    score -= 25;
  } else if (linkCount > 2) {
    flags.push({ level: "warn", message: `${linkCount} links — consider reducing to 2` });
    score -= 10;
  }

  // Promotional keyword checks (each word -8 points, capped at -40)
  if (promoWordMatches.length > 0) {
    const penalty = Math.min(promoWordMatches.length * 8, 40);
    score -= penalty;
    promoWordMatches.forEach((w) => {
      flags.push({ level: "warn", message: `Promo word "${w}" — triggers Promotions tab` });
    });
  }

  // HTML size
  if (htmlBytes > 8000) {
    flags.push({ level: "error", message: `Heavy HTML (${Math.round(htmlBytes / 1024)}KB) — simplify structure` });
    score -= 20;
  } else if (htmlBytes > 5000) {
    flags.push({ level: "warn", message: `HTML size ${Math.round(htmlBytes / 1024)}KB — strip unused styles` });
    score -= 8;
  }

  // Subject length
  if (subjectLength > 55) {
    flags.push({ level: "warn", message: `Subject too long (${subjectLength} chars — max 50)` });
    score -= 5;
  }

  // Subject starts with "I "
  if (subject.trimStart().startsWith("I ")) {
    flags.push({ level: "warn", message: `Subject starts with "I " — reads as cold outreach` });
    score -= 5;
  }

  // Subject all-lowercase is fine; ALL CAPS is bad
  if (subject !== subject.toLowerCase() && subject === subject.toUpperCase()) {
    flags.push({ level: "error", message: `Subject ALL CAPS — spam signal` });
    score -= 20;
  }

  // Word count
  if (wordCount < 40) {
    flags.push({ level: "warn", message: `Email too short (${wordCount} words) — may look automated` });
    score -= 8;
  } else if (wordCount > 220) {
    flags.push({ level: "warn", message: `Email too long (${wordCount} words) — cold outreach should be under 150` });
    score -= 8;
  }

  // Inline background-color or table-based layout
  if (emailBody.includes("background-color") || emailBody.includes("background:")) {
    flags.push({ level: "warn", message: `Background color detected — marketing signal` });
    score -= 8;
  }
  if (emailBody.includes("<table") || emailBody.includes("<td")) {
    flags.push({ level: "error", message: `Table layout — strong Promotions/spam signal` });
    score -= 20;
  }

  // Images
  if (emailBody.includes("<img")) {
    flags.push({ level: "error", message: `Image detected — strong Promotions signal` });
    score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  const tier: "green" | "yellow" | "red" =
    score >= 80 ? "green" : score >= 50 ? "yellow" : "red";

  return {
    score,
    tier,
    flags,
    linkCount,
    promoWordMatches,
    subjectLength,
    htmlBytes,
    wordCount,
  };
}
