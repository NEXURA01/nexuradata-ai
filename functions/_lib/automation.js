const normalizeText = (value, maxLength) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
};

const normalizeMultilineText = (value, maxLength) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").slice(0, maxLength);
};

const categoryLabels = {
  media: "Support lisible ou instable",
  raid: "Continuité d'activité",
  forensic: "Preuve et incident sensible",
  mobile: "Dossier mobile",
  guided: "Correction guidée"
};

const includesAny = (text, words) => words.some((word) => text.includes(word));

const matchedKeywords = (text, words) => words.filter((word) => text.includes(word));

const lowerField = (value) => `${value || ""}`.toLowerCase();

const createAutomationContext = (submission = {}) => {
  const support = lowerField(submission.support);
  const message = lowerField(submission.message);
  const urgency = lowerField(submission.urgence);
  const impact = lowerField(submission.impact);
  const sensitivity = lowerField(submission.sensibilite);

  return {
    support,
    message,
    urgency,
    impact,
    sensitivity,
    supportMessage: `${support} ${message}`,
    supportMessageSensitivity: `${support} ${message} ${sensitivity}`,
    urgencyImpact: `${urgency} ${impact}`
  };
};

const categoryRules = [
  {
    category: "forensic",
    signals: [
      ["supportMessageSensitivity", 6, ["forensique", "preuve", "juridique", "avocat", "assurance", "litige", "forensic", "evidence", "legal", "chain of custody", "chaîne de possession"]],
      ["impact", 2, ["assurance", "insurer", "client", "juridique", "legal"]],
      ["message", 2, ["incident", "ransomware", "breach", "compromis"]]
    ]
  },
  {
    category: "raid",
    signals: [
      ["supportMessage", 4, ["raid", "nas", "serveur", "server", "rebuild", "reconstruction", "synology", "qnap"]],
      ["impact", 2, ["opérations bloquées", "operations blocked", "production", "continuité", "continuity"]],
      ["message", 1, ["volume", "array", "degraded", "inaccessible"]]
    ]
  },
  {
    category: "mobile",
    signals: [
      ["supportMessage", 4, ["téléphone", "telephone", "mobile", "iphone", "android", "ipad", "samsung", "icloud", "google"]],
      ["message", 2, ["passcode", "code", "verrouillé", "locked", "écran", "screen"]]
    ]
  },
  {
    category: "media",
    signals: [
      ["supportMessage", 3, ["disque", "drive", "ssd", "usb", "clé", "cle", "carte", "memory", "hdd"]],
      ["message", 2, ["clique", "click", "bruit", "noise", "format", "effac", "erase", "partition"]]
    ]
  }
];

const riskRules = [
  ["physical-risk", "message", ["clique", "click", "bruit", "noise", "chauffe", "overheat", "tombe", "drop", "eau", "liquid"]],
  ["continuity-risk", "supportMessage", ["raid", "nas", "serveur", "server", "rebuild", "reconstruction"]],
  ["incident-response", "message", ["ransom", "rançon", "ransomware", "crypt", "chiffr", "malware", "compromis", "breach"]],
  ["forensic-boundary", "supportMessageSensitivity", ["preuve", "forensic", "forensique", "juridique", "legal", "litige", "assurance", "insurer", "chaîne de possession", "chain of custody"]],
  ["overwrite-risk", "message", ["format", "réinstall", "reinstall", "reset", "factory", "effac", "erase", "overwrite", "rebuild"]],
  ["priority-response", "urgencyImpact", ["urgent", "très sensible", "tres sensible", "opérations bloquées", "operations blocked", "client", "juridique", "assurance"]]
];

const missingInformationRules = {
  media: ["device-model", ["modèle", "model", "marque", "brand", "capacité", "capacity", "ssd", "hdd", "usb"]],
  raid: ["raid-layout", ["nombre de disque", "number of disk", "disk count", "raid 0", "raid 1", "raid 5", "raid 6", "raid 10", "synology", "qnap"]],
  forensic: ["incident-timeline", ["date", "timeline", "chronologie", "assurance", "avocat", "court", "tribunal", "rh", "hr"]],
  mobile: ["mobile-access-state", ["iphone", "android", "samsung", "modèle", "model", "code", "passcode", "icloud", "google"]]
};

const scoreCategory = (context, rule) => {
  const evidence = [];
  let score = 0;

  for (const [contextKey, weight, keywords] of rule.signals) {
    const matches = matchedKeywords(context[contextKey], keywords);
    if (matches.length === 0) {
      continue;
    }

    score += weight * Math.min(matches.length, 3);
    evidence.push(...matches.map((keyword) => `${contextKey}:${keyword}`));
  }

  return { category: rule.category, score, evidence };
};

const rankCategories = (context) => categoryRules
  .map((rule) => scoreCategory(context, rule))
  .filter((result) => result.score > 0)
  .sort((left, right) => right.score - left.score);

const categoryConfidenceFrom = (rankedCategories) => {
  const [first, second] = rankedCategories;
  if (!first) {
    return 0.25;
  }

  if (!second) {
    return Math.min(0.95, 0.58 + first.score / 24);
  }

  return Math.max(0.35, Math.min(0.92, 0.52 + (first.score - second.score) / 18));
};

export const inferCaseCategory = (support = "", message = "") => {
  const context = createAutomationContext({ support, message });
  const [topCategory] = rankCategories(context);

  if (topCategory) {
    return topCategory.category;
  }

  return "guided";
};

export const inferRiskFlags = (submission = {}) => {
  const context = createAutomationContext(submission);
  const flags = new Set();

  for (const [flag, contextKey, keywords] of riskRules) {
    if (includesAny(context[contextKey], keywords)) {
      flags.add(flag);
    }
  }

  return Array.from(flags);
};

export const inferMissingInformation = (submission = {}, category = "guided") => {
  const { message } = createAutomationContext(submission);
  const missing = [];

  if (!submission.telephone) {
    missing.push("telephone");
  }

  const rule = missingInformationRules[category];
  if (rule) {
    const [missingKey, keywords] = rule;
    if (!includesAny(message, keywords)) {
      missing.push(missingKey);
    }
  }

  return missing;
};

const riskLevelFrom = (category, flags) => {
  if (category === "forensic" || flags.includes("forensic-boundary") || flags.includes("incident-response")) {
    return "sensitive";
  }

  if (category === "raid" || flags.includes("physical-risk") || flags.includes("continuity-risk") || flags.includes("overwrite-risk")) {
    return "high";
  }

  if (flags.includes("priority-response")) {
    return "priority";
  }

  return "standard";
};

const recommendedPathFrom = (category, riskLevel) => {
  if (category === "forensic" || riskLevel === "sensitive") return "Mandat probatoire ou incident sensible";
  if (category === "raid") return "Intervention continuité d'activité";
  if (category === "mobile") return "Parcours mobile contrôlé";
  if (category === "media" && riskLevel === "high") return "Intervention support à risque";
  if (category === "media") return "Récupération ciblée";
  return "Correction guidée payée";
};

const nextStepFrom = (category, missingInfo) => {
  if (missingInfo.length > 0) {
    return "Valider les informations manquantes, puis confirmer le parcours d'intervention.";
  }

  if (category === "raid") return "Confirmer l'architecture et préparer la séquence d'intervention.";
  if (category === "forensic") return "Cadrer le mandat, la portée et la méthode de transmission contrôlée.";
  if (category === "mobile") return "Confirmer le modèle, l'état d'accès et la voie de traitement appropriée.";
  if (category === "media") return "Qualifier l'état du support et confirmer la prochaine manipulation sécuritaire.";
  return "Confirmer le contexte et préparer la prochaine action guidée.";
};

export const buildCaseAutomationDraft = (submission = {}) => {
  const context = createAutomationContext(submission);
  const rankedCategories = rankCategories(context);
  const category = rankedCategories[0]?.category || "guided";
  const categoryEvidence = rankedCategories[0]?.evidence || [];
  const confidenceScore = categoryConfidenceFrom(rankedCategories);
  const flags = inferRiskFlags(submission);
  const missingInfo = inferMissingInformation(submission, category);
  const riskLevel = riskLevelFrom(category, flags);
  const recommendedPath = recommendedPathFrom(category, riskLevel);
  const nextStep = nextStepFrom(category, missingInfo);
  const qualificationLines = [
    `Catégorie: ${categoryLabels[category] || categoryLabels.guided}`,
    `Confiance: ${Math.round(confidenceScore * 100)}%`,
    `Risque: ${riskLevel}`,
    `Parcours recommandé: ${recommendedPath}`,
    categoryEvidence.length ? `Évidence: ${categoryEvidence.join(", ")}` : "Évidence: aucune évidence forte détectée",
    flags.length ? `Marqueurs: ${flags.join(", ")}` : "Marqueurs: aucun marqueur critique détecté",
    missingInfo.length ? `Informations à obtenir: ${missingInfo.join(", ")}` : "Informations à obtenir: aucune information critique détectée"
  ];

  return {
    category,
    categoryLabel: categoryLabels[category] || categoryLabels.guided,
    riskLevel,
    confidenceScore,
    categoryEvidence,
    flags,
    missingInfo,
    recommendedPath,
    nextStep,
    clientSummary: normalizeMultilineText(
      `Votre demande a été reçue. NEXURA qualifie le dossier selon le parcours ${recommendedPath.toLowerCase()} et prépare la prochaine action utile.`,
      800
    ),
    qualificationSummary: normalizeMultilineText(qualificationLines.join("\n"), 1200),
    handlingFlags: normalizeText([category, riskLevel, ...flags, ...categoryEvidence].join(", "), 400)
  };
};