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

export const inferCaseCategory = (support = "", message = "") => {
  const combined = `${support} ${message}`.toLowerCase();

  if (includesAny(combined, ["forensique", "preuve", "juridique", "avocat", "assurance", "litige", "forensic", "evidence", "legal", "insurer"])) {
    return "forensic";
  }

  if (includesAny(combined, ["raid", "nas", "serveur", "server", "rebuild", "reconstruction", "synology", "qnap"])) {
    return "raid";
  }

  if (includesAny(combined, ["téléphone", "telephone", "mobile", "iphone", "android", "ipad", "passcode", "code"])) {
    return "mobile";
  }

  if (includesAny(combined, ["disque", "drive", "ssd", "usb", "clé", "cle", "carte", "memory", "hdd"])) {
    return "media";
  }

  return "guided";
};

export const inferRiskFlags = (submission = {}) => {
  const message = `${submission.message || ""}`.toLowerCase();
  const support = `${submission.support || ""}`.toLowerCase();
  const urgency = `${submission.urgence || ""}`.toLowerCase();
  const impact = `${submission.impact || ""}`.toLowerCase();
  const sensitivity = `${submission.sensibilite || ""}`.toLowerCase();
  const flags = new Set();

  if (includesAny(message, ["clique", "click", "bruit", "noise", "chauffe", "overheat", "tombe", "drop", "eau", "liquid"])) {
    flags.add("physical-risk");
  }

  if (includesAny(`${support} ${message}`, ["raid", "nas", "serveur", "server", "rebuild", "reconstruction"])) {
    flags.add("continuity-risk");
  }

  if (includesAny(message, ["ransom", "rançon", "ransomware", "crypt", "chiffr", "malware", "compromis", "breach"])) {
    flags.add("incident-response");
  }

  if (includesAny(`${support} ${message} ${sensitivity}`, ["preuve", "forensic", "forensique", "juridique", "legal", "litige", "assurance", "insurer", "chaîne de possession", "chain of custody"])) {
    flags.add("forensic-boundary");
  }

  if (includesAny(message, ["format", "réinstall", "reinstall", "reset", "factory", "effac", "erase", "overwrite", "rebuild"])) {
    flags.add("overwrite-risk");
  }

  if (includesAny(`${urgency} ${impact}`, ["urgent", "très sensible", "tres sensible", "opérations bloquées", "operations blocked", "client", "juridique", "assurance"])) {
    flags.add("priority-response");
  }

  return Array.from(flags);
};

export const inferMissingInformation = (submission = {}, category = "guided") => {
  const message = `${submission.message || ""}`.toLowerCase();
  const missing = [];

  if (!submission.telephone) {
    missing.push("telephone");
  }

  if (category === "media" && !includesAny(message, ["modèle", "model", "marque", "brand", "capacité", "capacity", "ssd", "hdd", "usb"])) {
    missing.push("device-model");
  }

  if (category === "raid" && !includesAny(message, ["nombre de disque", "number of disk", "disk count", "raid 0", "raid 1", "raid 5", "raid 6", "raid 10", "synology", "qnap"])) {
    missing.push("raid-layout");
  }

  if (category === "forensic" && !includesAny(message, ["date", "timeline", "chronologie", "assurance", "avocat", "court", "tribunal", "rh", "hr"])) {
    missing.push("incident-timeline");
  }

  if (category === "mobile" && !includesAny(message, ["iphone", "android", "samsung", "modèle", "model", "code", "passcode", "icloud", "google"])) {
    missing.push("mobile-access-state");
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
  const category = inferCaseCategory(submission.support, submission.message);
  const flags = inferRiskFlags(submission);
  const missingInfo = inferMissingInformation(submission, category);
  const riskLevel = riskLevelFrom(category, flags);
  const recommendedPath = recommendedPathFrom(category, riskLevel);
  const nextStep = nextStepFrom(category, missingInfo);
  const qualificationLines = [
    `Catégorie: ${categoryLabels[category] || categoryLabels.guided}`,
    `Risque: ${riskLevel}`,
    `Parcours recommandé: ${recommendedPath}`,
    flags.length ? `Marqueurs: ${flags.join(", ")}` : "Marqueurs: aucun marqueur critique détecté",
    missingInfo.length ? `Informations à obtenir: ${missingInfo.join(", ")}` : "Informations à obtenir: aucune information critique détectée"
  ];

  return {
    category,
    categoryLabel: categoryLabels[category] || categoryLabels.guided,
    riskLevel,
    flags,
    missingInfo,
    recommendedPath,
    nextStep,
    clientSummary: normalizeMultilineText(
      `Votre demande a été reçue. NEXURA qualifie le dossier selon le parcours ${recommendedPath.toLowerCase()} et prépare la prochaine action utile.`,
      800
    ),
    qualificationSummary: normalizeMultilineText(qualificationLines.join("\n"), 1200),
    handlingFlags: normalizeText([category, riskLevel, ...flags].join(", "), 400)
  };
};