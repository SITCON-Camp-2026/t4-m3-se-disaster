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

const flowLabels = {
  duplicate: "可能重複",
  traceable: "來源可追溯",
  clear: "訊息清楚",
};

const flowMarkerText = {
  duplicatePrefix: "流程檢核：可能重複上傳。",
  untraceable: "流程檢核：來源不可追溯或疑似轉傳，需人工查證來源與日期。",
  unclear: "流程檢核：訊息模糊，需補問地點、時間、當事人、數量或需求範圍。",
  needsReview: "依流程標示：來源或內容仍需人工確認。",
  moreInfo: "依流程保留：資訊不足，先補問來源或現場資訊。",
  candidateBlocker: "候選資訊仍需保留驗證狀態與不確定性。",
  candidateEvidence: "依流程建立候選資訊，但未標示為已確認。",
};

const flowReviewNotes = {
  duplicate: "轉送前檢核：先確認是否同一事件，不自動合併或新增任務。",
  untraceable: "轉送前檢核：暫存為可疑資料，不把格式像公告的內容當成已確認。",
  unclear: "轉送前檢核：先留下補問問題，避免 AI 補出原文沒有的內容。",
  needsReview: "流程檢核：先交給人工確認，不直接變成任務。",
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

function removeMatchingItems(
  values: string[] | undefined,
  match: (value: string) => boolean,
) {
  return (values ?? []).filter((value) => !match(value));
}

function keywordSignals(text: string) {
  return [
    "活動中心",
    "雨鞋",
    "光復車站",
    "車站",
    "老街",
    "水電",
    "集合點",
    "道路",
    "封閉",
    "側門",
    "藥品",
    "家具",
    "不要再派",
  ].filter((keyword) => text.includes(keyword));
}

function possibleRelatedRecords(
  record: Phase0MessyRecord,
  records: Phase0MessyRecord[],
) {
  const signals = keywordSignals(record.rawText);
  if (signals.length === 0) return [];

  return records
    .filter((candidate) => candidate.id !== record.id)
    .map((candidate) => ({
      record: candidate,
      overlap: signals.filter((signal) => candidate.rawText.includes(signal)),
    }))
    .filter(({ overlap }) => overlap.length > 0)
    .slice(0, 3);
}

function hasTraceabilityRisk(record: Phase0MessyRecord) {
  return (
    record.sourceType === "social_post" ||
    record.sourceType === "phone_call" ||
    /截圖|群組|有人說|來電|不知道.*官方|不知道.*哪一天/.test(record.rawText)
  );
}

export function Phase0FlowPanel({
  record,
  records,
  draft,
  onApply,
}: {
  record: Phase0MessyRecord;
  records: Phase0MessyRecord[];
  draft: Phase0JudgementDraft | undefined;
  onApply: (draft: Phase0JudgementDraft) => void;
}) {
  const analysis = analyzePhase0Risk(record, draft);
  const relatedRecords = possibleRelatedRecords(record, records);
  const traceabilityRisk = hasTraceabilityRisk(record);
  const hasCandidate = draft ? draft.possibleKind !== "unknown" : false;
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
      title: "1. 查看來源、原文與時間",
      body: "先保留原始資訊脈絡，不只看摘要或候選分類。",
      state: "done",
    },
    {
      title: "2. 檢查是否可能重複上傳",
      body:
        relatedRecords.length > 0
          ? `可能相關：${relatedRecords
              .map(({ record: item }) => item.id)
              .join("、")}。先標示關聯，不自動合併。`
          : "目前沒有找到明顯相同關鍵線索。",
      state: relatedRecords.length > 0 ? "attention" : "done",
    },
    {
      title: "3. 檢查來源是否可追溯",
      body: traceabilityRisk
        ? "來源或轉傳脈絡需要查證，不能因為格式像公告就相信。"
        : "目前來源型態較容易回頭確認，但仍不是已確認事實。",
      state: traceabilityRisk ? "attention" : "done",
    },
    {
      title: "4. 檢查訊息是否清楚",
      body:
        analysis.signals.length > 0
          ? `原文有模糊訊號：${analysis.signals.join("、")}。`
          : "目前沒有偵測到明顯模糊詞，但仍需人工確認語意。",
      state: analysis.signals.length > 0 ? "attention" : "done",
    },
    {
      title: "5. 判斷是否足夠形成候選資訊",
      body: hasCandidate
        ? "已留下候選線索，但候選仍不可直接執行。"
        : "尚未形成明確候選，應保留待查證。",
      state: hasCandidate ? "done" : "pending",
    },
    {
      title: "6. 留下判斷紀錄",
      body: hasReason
        ? "已有來源、卡住點或人工審核備註可追溯。"
        : "需要補上判斷理由、補問問題或人工審核備註。",
      state: hasReason ? "done" : "pending",
    },
  ];

  function markNeedsReview() {
    onApply(
      mergeDraft(record, draft, {
        suggestedNextStep: "send_to_human_review",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([...(draft?.blockers ?? []), flowMarkerText.needsReview]),
        ),
        humanReviewNote: flowReviewNotes.needsReview,
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
          new Set([...(draft?.blockers ?? []), flowMarkerText.moreInfo]),
        ),
      }),
    );
  }

  function markPossibleDuplicate() {
    const relatedText =
      relatedRecords.length > 0
        ? `可能相關資料：${relatedRecords
            .map(({ record: item }) => item.id)
            .join("、")}。`
        : "尚未指定相關資料，需人工比對是否同一事件。";

    onApply(
      mergeDraft(record, draft, {
        suggestedNextStep: "send_to_human_review",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([
            ...(draft?.blockers ?? []),
            `${flowMarkerText.duplicatePrefix}${relatedText}`,
          ]),
        ),
        humanReviewNote: flowReviewNotes.duplicate,
      }),
    );
  }

  function holdUntraceableSource() {
    onApply(
      mergeDraft(record, draft, {
        possibleKind: "unknown",
        suggestedNextStep: "do_not_use_yet",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([...(draft?.blockers ?? []), flowMarkerText.untraceable]),
        ),
        humanReviewNote: flowReviewNotes.untraceable,
      }),
    );
  }

  function addClarifyingQuestions() {
    onApply(
      mergeDraft(record, draft, {
        suggestedNextStep: "ask_for_more_info",
        unsafeToActDirectly: true,
        blockers: Array.from(
          new Set([...(draft?.blockers ?? []), flowMarkerText.unclear]),
        ),
        humanReviewNote: flowReviewNotes.unclear,
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
            flowMarkerText.candidateBlocker,
          ]),
        ),
        evidence: Array.from(
          new Set([
            ...(draft?.evidence ?? []),
            flowMarkerText.candidateEvidence,
          ]),
        ),
      }),
    );
  }

  function removeFlowMarker(
    kind:
      | "duplicate"
      | "untraceable"
      | "unclear"
      | "needsReview"
      | "moreInfo"
      | "candidate",
  ) {
    if (!draft) return;

    const nextDraft = { ...draft };

    if (kind === "duplicate") {
      nextDraft.blockers = removeMatchingItems(draft.blockers, (value) =>
        value.startsWith(flowMarkerText.duplicatePrefix),
      );
      if (draft.humanReviewNote === flowReviewNotes.duplicate) {
        nextDraft.humanReviewNote = "";
      }
    }

    if (kind === "untraceable") {
      nextDraft.blockers = removeMatchingItems(
        draft.blockers,
        (value) => value === flowMarkerText.untraceable,
      );
      if (draft.humanReviewNote === flowReviewNotes.untraceable) {
        nextDraft.humanReviewNote = "";
      }
    }

    if (kind === "unclear") {
      nextDraft.blockers = removeMatchingItems(
        draft.blockers,
        (value) => value === flowMarkerText.unclear,
      );
      if (draft.humanReviewNote === flowReviewNotes.unclear) {
        nextDraft.humanReviewNote = "";
      }
    }

    if (kind === "needsReview") {
      nextDraft.blockers = removeMatchingItems(
        draft.blockers,
        (value) => value === flowMarkerText.needsReview,
      );
      if (draft.humanReviewNote === flowReviewNotes.needsReview) {
        nextDraft.humanReviewNote = "";
      }
    }

    if (kind === "moreInfo") {
      nextDraft.blockers = removeMatchingItems(
        draft.blockers,
        (value) => value === flowMarkerText.moreInfo,
      );
    }

    if (kind === "candidate") {
      nextDraft.blockers = removeMatchingItems(
        draft.blockers,
        (value) => value === flowMarkerText.candidateBlocker,
      );
      nextDraft.evidence = removeMatchingItems(
        draft.evidence,
        (value) => value === flowMarkerText.candidateEvidence,
      );
    }

    onApply(nextDraft);
  }

  const actionItems: Array<{
    key:
      | "duplicate"
      | "untraceable"
      | "unclear"
      | "needsReview"
      | "moreInfo"
      | "candidate";
    label: string;
    description: string;
    checked: boolean;
    apply: () => void;
  }> = [
    {
      key: "duplicate",
      label: "標示可能重複",
      description: "只標關聯，不自動合併。",
      checked: Boolean(
        draft?.blockers.some((value) =>
          value.startsWith(flowMarkerText.duplicatePrefix),
        ),
      ),
      apply: markPossibleDuplicate,
    },
    {
      key: "untraceable",
      label: "暫存可疑來源",
      description: "先查來源與日期。",
      checked: Boolean(draft?.blockers.includes(flowMarkerText.untraceable)),
      apply: holdUntraceableSource,
    },
    {
      key: "unclear",
      label: "留下補問問題",
      description: "補問地點、時間或需求。",
      checked: Boolean(draft?.blockers.includes(flowMarkerText.unclear)),
      apply: addClarifyingQuestions,
    },
    {
      key: "needsReview",
      label: "需要人工確認",
      description: "不直接變成任務。",
      checked: Boolean(draft?.blockers.includes(flowMarkerText.needsReview)),
      apply: markNeedsReview,
    },
    {
      key: "moreInfo",
      label: "保留待查證",
      description: "資料不足先補問。",
      checked: Boolean(draft?.blockers.includes(flowMarkerText.moreInfo)),
      apply: keepRawForMoreInfo,
    },
    {
      key: "candidate",
      label: "候選但不可行動",
      description: "線索不等於已確認。",
      checked: Boolean(
        draft?.blockers.includes(flowMarkerText.candidateBlocker) ||
        draft?.evidence.includes(flowMarkerText.candidateEvidence),
      ),
      apply: createCandidate,
    },
  ];

  return (
    <section className="flow-panel" aria-label="資訊整理流程">
      <div className="flow-panel__header">
        <div>
          <p className="eyebrow">流程檢核</p>
          <h3>轉送前檢核</h3>
          <p>先決定這筆原始資訊要標記、補問或形成候選，不做派工判斷。</p>
        </div>
        <span>{record.id}</span>
      </div>

      <div className="flow-transfer" aria-label="資料轉運站檢核摘要">
        <article>
          <span>{flowLabels.duplicate}</span>
          <strong>
            {relatedRecords.length > 0
              ? `需比對 ${relatedRecords.length} 筆`
              : "暫無明顯關聯"}
          </strong>
          <p>
            {relatedRecords.length > 0
              ? relatedRecords
                  .map(
                    ({ record: item, overlap }) => `${item.id}：${overlap[0]}`,
                  )
                  .join(" / ")
              : "不代表沒有重複，只是目前沒有命中相同關鍵線索。"}
          </p>
        </article>
        <article>
          <span>{flowLabels.traceable}</span>
          <strong>{traceabilityRisk ? "需要查證" : "仍需保留狀態"}</strong>
          <p>
            {traceabilityRisk
              ? "來源、截圖、轉傳或電話脈絡不足，先暫存可疑。"
              : "可回頭檢查來源，但不能顯示成已確認。"}
          </p>
        </article>
        <article>
          <span>{flowLabels.clear}</span>
          <strong>
            {analysis.signals.length > 0 ? "需要補問" : "仍需人工讀原文"}
          </strong>
          <p>
            {analysis.signals.length > 0
              ? `模糊訊號：${analysis.signals.join("、")}`
              : "未偵測到模糊詞，不代表資料已確認。"}
          </p>
        </article>
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

      <fieldset className="flow-actions" aria-label="流程標記">
        <legend>流程標記</legend>
        <p className="flow-actions__hint">
          流程標記用來表示這筆資料卡在哪一站；勾選後會同步寫進草稿紀錄。
        </p>
        {actionItems.map((item) => (
          <label className="flow-action" key={item.key}>
            <input
              checked={item.checked}
              type="checkbox"
              onChange={(event) =>
                event.target.checked ? item.apply() : removeFlowMarker(item.key)
              }
            />
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flow-output" aria-label="流程輸出">
        <strong>輸出給下一位協作者檢查</strong>
        <p>
          目前輸出只包含候選、待查證、可疑來源與判斷紀錄；不輸出已確認任務或行動指示。
        </p>
      </div>
    </section>
  );
}
