import {
  analyzePhase0Risk,
  createConservativeDraft,
} from "./phase0-risk-analysis";
import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
} from "./phase0-types";

type FlowStepState = "done" | "attention" | "pending";

const stepLabels: Record<FlowStepState, string> = {
  done: "已記錄",
  attention: "需要確認",
  pending: "待處理",
};

function stepClass(state: FlowStepState) {
  return `flow-step flow-step--${state}`;
}

function candidateKindFor(record: Phase0MessyRecord): Phase0PossibleKind {
  if (/集合點|活動中心|開放|入口|服務台|道路/.test(record.rawText)) {
    return "site_status_candidate";
  }

  if (/公告|封閉|不要送|不要再派|不再收/.test(record.rawText)) {
    return "announcement_candidate";
  }

  if (/需要|協助|清泥|水電|藥品|搬動|支援/.test(record.rawText)) {
    return "task_candidate";
  }

  return "unknown";
}

function mergeDraft(
  record: Phase0MessyRecord,
  draft: Phase0JudgementDraft | undefined,
  patch: Partial<Phase0JudgementDraft>,
) {
  return {
    ...(draft ?? createConservativeDraft(record)),
    ...patch,
  };
}

export function Phase0FlowPanel({
  record,
  draft,
  onApply,
}: {
  record: Phase0MessyRecord;
  draft: Phase0JudgementDraft | undefined;
  onApply: (draft: Phase0JudgementDraft) => void;
}) {
  const analysis = analyzePhase0Risk(record, draft);
  const hasCandidate = draft ? draft.possibleKind !== "unknown" : false;
  const hasUncertaintyMark =
    Boolean(draft?.unsafeToActDirectly) && Boolean(draft?.blockers.length);
  const hasReason =
    Boolean(draft?.evidence.length) ||
    Boolean(draft?.blockers.length) ||
    Boolean(draft?.humanReviewNote);

  const steps: Array<{
    title: string;
    body: string;
    state: FlowStepState;
  }> = [
    {
      title: "1. 查看來源與原文",
      body: "保留原始資訊，不把摘要當成事實。",
      state: "done",
    },
    {
      title: "2. 判斷來源與內容是否清楚",
      body:
        analysis.reasons.length > 0
          ? analysis.reasons.join("、")
          : "目前沒有額外風險標籤。",
      state: analysis.reasons.length > 0 ? "attention" : "done",
    },
    {
      title: "3. 判斷是否能形成候選資訊",
      body: hasCandidate
        ? "已建立候選類型，但仍不是已確認資料。"
        : "尚未形成明確候選，應保留待查證。",
      state: hasCandidate ? "done" : "pending",
    },
    {
      title: "4. 標註驗證狀態與不確定性",
      body: hasUncertaintyMark
        ? "已保留不可直接行動與卡住點。"
        : "需要補上不可直接行動或卡住點。",
      state: hasUncertaintyMark ? "done" : "attention",
    },
    {
      title: "5. 留下判斷理由與來源",
      body: hasReason
        ? "已有整理依據，後續協作者可以追溯。"
        : "需要補上佐證、卡住點或人工審核備註。",
      state: hasReason ? "done" : "pending",
    },
  ];

  function markNeedsReview() {
    onApply(
      mergeDraft(record, draft, {
        suggestedNextStep: "send_to_human_review",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([
            ...(draft?.blockers ?? []),
            "依流程標示：來源或內容仍需人工確認。",
          ]),
        ),
        humanReviewNote: "流程檢核：先交給人工確認，不直接變成任務。",
      }),
    );
  }

  function keepRawForMoreInfo() {
    onApply(
      mergeDraft(record, draft, {
        possibleKind: "unknown",
        suggestedNextStep: "ask_for_more_info",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([
            ...(draft?.blockers ?? []),
            "依流程保留：資訊不足，先補問來源或現場資訊。",
          ]),
        ),
      }),
    );
  }

  function createCandidate() {
    onApply(
      mergeDraft(record, draft, {
        possibleKind:
          draft?.possibleKind === "unknown" || !draft
            ? candidateKindFor(record)
            : draft.possibleKind,
        suggestedNextStep: "create_candidate_report",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([
            ...(draft?.blockers ?? []),
            "候選資訊仍需保留驗證狀態與不確定性。",
          ]),
        ),
        evidence: Array.from(
          new Set([
            ...(draft?.evidence ?? []),
            "依流程建立候選資訊，但未標示為已確認。",
          ]),
        ),
      }),
    );
  }

  return (
    <section className="flow-panel" aria-label="資訊整理流程">
      <div className="flow-panel__header">
        <div>
          <p className="eyebrow">流程檢核</p>
          <h3>照 flow.md 走完這筆資料</h3>
        </div>
        <span>{record.id}</span>
      </div>

      <ol className="flow-steps">
        {steps.map((step) => (
          <li className={stepClass(step.state)} key={step.title}>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
            <span>{stepLabels[step.state]}</span>
          </li>
        ))}
      </ol>

      <div className="flow-actions" aria-label="流程操作">
        <button type="button" onClick={markNeedsReview}>
          標示需要人工確認
        </button>
        <button type="button" onClick={keepRawForMoreInfo}>
          保留待查證
        </button>
        <button type="button" onClick={createCandidate}>
          建立候選但不可行動
        </button>
      </div>
    </section>
  );
}
