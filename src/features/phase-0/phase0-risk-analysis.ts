import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
  Phase0SuggestedNextStep,
} from "./phase0-types";

const unclearSignals = [
  "有人說",
  "群組說",
  "不知道",
  "不確定",
  "尚未",
  "沒有",
  "疑似",
  "可能",
  "轉述",
  "沒更新",
];

function detectPossibleKind(record: Phase0MessyRecord): Phase0PossibleKind {
  if (/公告|道路|封閉|不要送|不要再派|不再收/.test(record.rawText)) {
    return "announcement_candidate";
  }

  if (/集合點|活動中心|開放|入口|服務台|道路/.test(record.rawText)) {
    return "site_status_candidate";
  }

  if (/支援|指派|報到|志工/.test(record.rawText)) {
    return "assignment_candidate";
  }

  if (/需要|協助|清泥|水電|藥品|搬動/.test(record.rawText)) {
    return "task_candidate";
  }

  return "unknown";
}

function detectEvidence(record: Phase0MessyRecord) {
  const evidence = [
    `原文資訊取得方式為「${record.sourceType}」。`,
    `原始查核狀態為「${record.verificationStatus}」。`,
  ];

  const timeMatch = record.rawText.match(
    /\d{1,2}:\d{2}|早上|下午|中午前|今天|昨天/,
  );
  if (timeMatch) {
    evidence.push(`原文包含時間線索：「${timeMatch[0]}」。`);
  }

  const needMatch = record.rawText.match(/需要[^，。]*/);
  if (needMatch) {
    evidence.push(`原文包含需求線索：「${needMatch[0]}」。`);
  }

  return evidence;
}

export function analyzePhase0Risk(
  record: Phase0MessyRecord,
  draft?: Phase0JudgementDraft,
) {
  const reasons: string[] = [];
  const blockers: string[] = [];
  const signals = unclearSignals.filter((word) =>
    record.rawText.includes(word),
  );

  if (record.verificationStatus === "unverified") {
    reasons.push("未查核");
    blockers.push("原始資訊仍是未查核狀態。");
  }

  if (record.verificationStatus === "needs_review") {
    reasons.push("待人工確認");
    blockers.push("原始資訊需要人工確認。");
  }

  if (
    record.sourceType === "social_post" ||
    record.sourceType === "phone_call"
  ) {
    reasons.push("來源較需要回頭確認");
    blockers.push("資訊取得方式容易包含轉述或非現場確認。");
  }

  if (signals.length > 0) {
    reasons.push("原文有不確定訊號");
    blockers.push(`原文出現不確定訊號：${signals.join("、")}。`);
  }

  if (draft?.unsafeToActDirectly) {
    reasons.push("草稿標示不可直接行動");
  }

  if (draft && draft.blockers.length > 0) {
    reasons.push("已有卡住點");
  }

  if (!draft) {
    reasons.push("尚未建立草稿");
  }

  return {
    reasons: Array.from(new Set(reasons)),
    blockers: Array.from(new Set(blockers)),
    signals,
  };
}

export function riskLevelFor(reasonCount: number) {
  if (reasonCount >= 4) return 3;
  if (reasonCount >= 3) return 2;
  if (reasonCount >= 1) return 1;
  return 0;
}

function suggestedNextStepFor(
  record: Phase0MessyRecord,
): Phase0SuggestedNextStep {
  if (record.verificationStatus === "unverified") return "send_to_human_review";
  if (/不知道|不確定|尚未|疑似|可能|沒更新/.test(record.rawText)) {
    return "ask_for_more_info";
  }
  return "send_to_human_review";
}

export function createConservativeDraft(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const analysis = analyzePhase0Risk(record);

  return {
    messyRecordId: record.id,
    possibleKind: detectPossibleKind(record),
    confidence: "low",
    evidence: detectEvidence(record),
    blockers:
      analysis.blockers.length > 0
        ? analysis.blockers
        : ["尚未由人工確認原文是否足夠支持候選判斷。"],
    suggestedNextStep: suggestedNextStepFor(record),
    unsafeToActDirectly: true,
    humanReviewNote: "規則式風險分析產生的保守草稿，需由人工檢查與修正。",
  };
}
