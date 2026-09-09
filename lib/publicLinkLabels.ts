export type PublicLinkLike = {
  label?: string;
  type?: string;
  url?: string;
};

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Returns a short, descriptive action label for public detail-page links.
 * The visible row label still provides the exact admin-entered description;
 * this helper only replaces vague actions such as "Open Link".
 */
export function getPublicLinkAction(link: PublicLinkLike) {
  const labelText = `${normalize(link.label)} ${normalize(link.type)}`.trim();
  const urlText = normalize(link.url);
  const combined = `${labelText} ${urlText}`;

  if (/apply|application form|registration|register/.test(labelText)) {
    return "Apply Online";
  }

  if (/admit|hall ticket|call letter/.test(labelText)) {
    return "Download Admit Card";
  }

  if (/result|merit|selection list|score card|scorecard/.test(labelText)) {
    return "Check Result";
  }

  if (/status|track/.test(labelText)) {
    return "Check Status";
  }

  if (
    /notification|advertisement|guideline|guidelines|prospectus|brochure|official pdf/.test(
      labelText
    ) ||
    /\.pdf(?:$|[?#])/.test(urlText)
  ) {
    return "Download PDF";
  }

  if (/download/.test(labelText)) {
    return "Download";
  }

  if (/official website|official site|website|portal|homepage/.test(labelText)) {
    return "Visit Official Website";
  }

  if (/login|sign in|signin/.test(labelText)) {
    return "Open Login";
  }

  if (/certificate/.test(combined)) {
    return "Open Certificate Link";
  }

  return "Open Official Link";
}
