import type { Phase0JudgementDraft } from "./phase0-types";

export const initialDrafts: Record<string, Phase0JudgementDraft> = {
  "M-001": {
    messyRecordId: "M-001",
    possibleKind: "task_candidate",
    confidence: "low",
    evidence: ["社群貼文指出需要十幾人清泥"],
    blockers: ["來源未驗證", "地點描述模糊"],
    suggestedNextStep: "send_to_human_review",
    unsafeToActDirectly: true,
  },
  "M-010": {
    messyRecordId: "M-010",
    possibleKind: "site_status_candidate",
    confidence: "medium",
    evidence: ["志工現場盤點顯示雨鞋剩餘 12 雙"],
    blockers: ["需要確認是否為最新盤點"],
    suggestedNextStep: "ask_for_more_info",
    unsafeToActDirectly: true,
  },
};
