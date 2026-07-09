import { createConservativeDraft } from "./phase0-risk-analysis";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

export function buildInitialDrafts(records: Phase0MessyRecord[]) {
  return records.reduce<Record<string, Phase0JudgementDraft>>(
    (drafts, record) => {
      drafts[record.id] = createConservativeDraft(record);
      return drafts;
    },
    {},
  );
}
