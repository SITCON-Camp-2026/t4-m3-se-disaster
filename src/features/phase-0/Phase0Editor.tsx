import type {
  Phase0Confidence,
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
  Phase0SuggestedNextStep,
} from "./phase0-types";

type DraftArrayKey = "evidence" | "blockers";
type QuickPreset = "duplicate" | "untraceable" | "unclear" | "candidate";
type QuickPresetPatch = Omit<Partial<Phase0JudgementDraft>, "evidence"> & {
  blocker: string;
  evidenceValue?: string;
};

const confidenceValues: Phase0Confidence[] = ["low", "medium", "high"];

const confidenceLabels: Record<Phase0Confidence, string> = {
  low: "低：只適合作為待確認線索",
  medium: "中：有部分原文依據，仍需人工確認",
  high: "高：原文脈絡較完整，但不是已確認任務",
};

const blockerOptions = [
  {
    label: "可能重複上傳",
    value: "流程檢核：可能重複上傳，需人工確認是否同一事件。",
  },
  {
    label: "來源不可追溯",
    value: "流程檢核：來源不可追溯或疑似轉傳，需人工查證來源與日期。",
  },
  {
    label: "訊息模糊",
    value: "流程檢核：訊息模糊，需補問地點、時間、當事人、數量或需求範圍。",
  },
  {
    label: "不能直接行動",
    value: "候選資訊仍需保留驗證狀態與不確定性。",
  },
  {
    label: "需要人工確認",
    value: "依流程標示：來源或內容仍需人工確認。",
  },
  {
    label: "資料不足，先補問",
    value: "依流程保留：資訊不足，先補問來源或現場資訊。",
  },
];

const reviewNoteOptions = [
  {
    label: "交給人工確認，不直接變成任務",
    value: "流程檢核：先交給人工確認，不直接變成任務。",
  },
  {
    label: "先確認是否同一事件",
    value: "資料轉運站檢核：先確認是否同一事件，不自動合併或新增任務。",
  },
  {
    label: "暫存為可疑資料",
    value: "資料轉運站檢核：暫存為可疑資料，不把格式像公告的內容當成已確認。",
  },
  {
    label: "先留下補問問題",
    value: "資料轉運站檢核：先留下補問問題，避免 AI 補出原文沒有的內容。",
  },
  {
    label: "保守草稿，需人工修正",
    value: "規則式風險分析產生的保守草稿，需由人工檢查與修正。",
  },
];

const quickPresetMeta: Record<
  QuickPreset,
  { label: string; description: string }
> = {
  duplicate: {
    label: "重複上傳檢核",
    description: "標示可能重複，不自動合併。",
  },
  untraceable: {
    label: "可疑來源檢核",
    description: "暫存來源或日期不明資料。",
  },
  unclear: {
    label: "模糊訊息補問",
    description: "補問地點、時間、需求範圍。",
  },
  candidate: {
    label: "候選但不可行動",
    description: "留下線索，不當成任務。",
  },
};

function evidenceOptionsFor(record: Phase0MessyRecord) {
  const options = [
    {
      label: "保留資訊取得方式",
      value: `原文資訊取得方式為「${record.sourceType}」。`,
    },
    {
      label: "保留原始查核狀態",
      value: `原始查核狀態為「${record.verificationStatus}」。`,
    },
    {
      label: "保留原文，不採用 AI 補完",
      value: "已保留原文脈絡，不把 AI 摘要當成已確認事實。",
    },
    {
      label: "候選資訊仍未確認",
      value: "依流程建立候選資訊，但未標示為已確認。",
    },
  ];

  const timeMatch = record.rawText.match(
    /\d{1,2}:\d{2}|早上|下午|中午前|今天|昨天/,
  );
  if (timeMatch) {
    options.push({
      label: "原文有時間線索",
      value: `原文包含時間線索：「${timeMatch[0]}」。`,
    });
  }

  const needMatch = record.rawText.match(/需要[^，。]*/);
  if (needMatch) {
    options.push({
      label: "原文有需求線索",
      value: `原文包含需求線索：「${needMatch[0]}」。`,
    });
  }

  return options;
}

function customItems(
  values: string[],
  options: Array<{ label: string; value: string }>,
) {
  const optionValues = new Set(options.map((option) => option.value));
  return values.filter((value) => value && !optionValues.has(value));
}

function nextValues(
  current: string[],
  value: string,
  checked: boolean,
  options: Array<{ label: string; value: string }>,
) {
  const custom = customItems(current, options);
  const selected = new Set(
    current.filter((item) => options.some((option) => option.value === item)),
  );

  if (checked) {
    selected.add(value);
  } else {
    selected.delete(value);
  }

  return [...custom, ...Array.from(selected)];
}

export function Phase0Editor({
  record,
  draft,
  onChange,
  onDelete,
  onReset,
}: {
  record: Phase0MessyRecord;
  draft: Phase0JudgementDraft | undefined;
  onChange: (d: Phase0JudgementDraft) => void;
  onDelete: () => void;
  onReset: () => void;
}) {
  if (!draft) {
    return (
      <div className="editor">
        <p>尚未建立草稿。按「建立草稿」開始（僅為 UI 狀態）。</p>
        <p className="editor__hint">
          對於不確定資訊，請保留「不可直接行動」，並在備註欄中說明目前的判斷理由或缺口。
        </p>
        <button
          type="button"
          onClick={() =>
            onChange({
              messyRecordId: record.id,
              possibleKind: "unknown",
              confidence: "low",
              evidence: [],
              blockers: [],
              suggestedNextStep: "send_to_human_review",
              unsafeToActDirectly: true,
            })
          }
        >
          建立草稿
        </button>
      </div>
    );
  }

  const currentDraft = draft;

  function updateField<K extends keyof Phase0JudgementDraft>(
    key: K,
    value: Phase0JudgementDraft[K],
  ) {
    onChange({ ...currentDraft, [key]: value });
  }

  function updateArrayOption(
    key: DraftArrayKey,
    value: string,
    checked: boolean,
    options: Array<{ label: string; value: string }>,
  ) {
    updateField(key, nextValues(currentDraft[key], value, checked, options));
  }

  function applyQuickPreset(preset: QuickPreset) {
    const patches: Record<QuickPreset, QuickPresetPatch> = {
      duplicate: {
        blocker: blockerOptions[0].value,
        suggestedNextStep: "send_to_human_review",
        unsafeToActDirectly: true,
        humanReviewNote: reviewNoteOptions[1].value,
      },
      untraceable: {
        blocker: blockerOptions[1].value,
        possibleKind: "unknown",
        suggestedNextStep: "do_not_use_yet",
        unsafeToActDirectly: true,
        humanReviewNote: reviewNoteOptions[2].value,
      },
      unclear: {
        blocker: blockerOptions[2].value,
        suggestedNextStep: "ask_for_more_info",
        unsafeToActDirectly: true,
        humanReviewNote: reviewNoteOptions[3].value,
      },
      candidate: {
        blocker: blockerOptions[3].value,
        evidenceValue: "依流程建立候選資訊，但未標示為已確認。",
        suggestedNextStep: "create_candidate_report",
        unsafeToActDirectly: true,
      },
    };
    const patch = patches[preset];
    const { blocker, evidenceValue, ...draftPatch } = patch;

    onChange({
      ...currentDraft,
      ...draftPatch,
      blockers: Array.from(new Set([...currentDraft.blockers, blocker])),
      evidence: evidenceValue
        ? Array.from(new Set([...currentDraft.evidence, evidenceValue]))
        : currentDraft.evidence,
    });
  }

  function removeQuickPreset(preset: QuickPreset) {
    const removable: Record<
      QuickPreset,
      { blocker: string; evidenceValue?: string; note?: string }
    > = {
      duplicate: {
        blocker: blockerOptions[0].value,
        note: reviewNoteOptions[1].value,
      },
      untraceable: {
        blocker: blockerOptions[1].value,
        note: reviewNoteOptions[2].value,
      },
      unclear: {
        blocker: blockerOptions[2].value,
        note: reviewNoteOptions[3].value,
      },
      candidate: {
        blocker: blockerOptions[3].value,
        evidenceValue: "依流程建立候選資訊，但未標示為已確認。",
      },
    };
    const target = removable[preset];

    onChange({
      ...currentDraft,
      blockers: currentDraft.blockers.filter(
        (value) => value !== target.blocker,
      ),
      evidence: target.evidenceValue
        ? currentDraft.evidence.filter(
            (value) => value !== target.evidenceValue,
          )
        : currentDraft.evidence,
      humanReviewNote:
        target.note && currentDraft.humanReviewNote === target.note
          ? ""
          : currentDraft.humanReviewNote,
    });
  }

  const evidenceOptions = evidenceOptionsFor(record);
  const customEvidence = customItems(currentDraft.evidence, evidenceOptions);
  const customBlockers = customItems(currentDraft.blockers, blockerOptions);
  const confidenceIndex = confidenceValues.indexOf(currentDraft.confidence);
  const noteInOptions = reviewNoteOptions.some(
    (option) => option.value === currentDraft.humanReviewNote,
  );
  const quickPresetItems: Array<{
    key: QuickPreset;
    checked: boolean;
  }> = [
    {
      key: "duplicate",
      checked: currentDraft.blockers.includes(blockerOptions[0].value),
    },
    {
      key: "untraceable",
      checked: currentDraft.blockers.includes(blockerOptions[1].value),
    },
    {
      key: "unclear",
      checked: currentDraft.blockers.includes(blockerOptions[2].value),
    },
    {
      key: "candidate",
      checked:
        currentDraft.blockers.includes(blockerOptions[3].value) ||
        currentDraft.evidence.includes(
          "依流程建立候選資訊，但未標示為已確認。",
        ),
    },
  ];

  return (
    <form className="editor" onSubmit={(e) => e.preventDefault()}>
      <h3>草稿編輯：{record.id}</h3>

      <section className="editor__quick" aria-label="快速套用組件">
        <div>
          <strong>快速套用組件</strong>
          <p>先選流程判斷，草稿會自動補上對應的卡住點、下一步與人工備註。</p>
        </div>
        <div className="editor__quick-actions">
          {quickPresetItems.map((item) => {
            const meta = quickPresetMeta[item.key];

            return (
              <label className="editor__quick-option" key={item.key}>
                <input
                  checked={item.checked}
                  type="checkbox"
                  onChange={(event) =>
                    event.target.checked
                      ? applyQuickPreset(item.key)
                      : removeQuickPreset(item.key)
                  }
                />
                <span>
                  <strong>{meta.label}</strong>
                  <small>{meta.description}</small>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <label>
        候選類型
        <select
          value={currentDraft.possibleKind}
          onChange={(e) =>
            updateField("possibleKind", e.target.value as Phase0PossibleKind)
          }
        >
          <option value="unknown">候選類型待判斷</option>
          <option value="help_request_candidate">求助候選（待確認）</option>
          <option value="site_status_candidate">地點狀態候選（待確認）</option>
          <option value="task_candidate">可能是需求線索（不可派工）</option>
          <option value="assignment_candidate">
            可能涉及人力線索（不可指派）
          </option>
          <option value="announcement_candidate">公告候選（待確認）</option>
        </select>
      </label>

      <label>
        信心程度
        <input
          aria-label="信心程度範圍"
          max={2}
          min={0}
          step={1}
          type="range"
          value={confidenceIndex < 0 ? 0 : confidenceIndex}
          onChange={(e) =>
            updateField(
              "confidence",
              confidenceValues[Number(e.target.value)] ?? "low",
            )
          }
        />
        <span className="editor__range-value">
          {confidenceLabels[currentDraft.confidence]}
        </span>
      </label>

      <fieldset className="editor__choice-group">
        <legend>佐證快速選擇</legend>
        {evidenceOptions.map((option) => (
          <label className="editor__choice" key={option.value}>
            <input
              checked={currentDraft.evidence.includes(option.value)}
              type="checkbox"
              onChange={(e) =>
                updateArrayOption(
                  "evidence",
                  option.value,
                  e.target.checked,
                  evidenceOptions,
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
        {customEvidence.map((item) => (
          <label className="editor__choice editor__choice--readonly" key={item}>
            <input checked readOnly type="checkbox" />
            <span>既有紀錄：{item}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="editor__choice-group">
        <legend>卡住點快速選擇</legend>
        {blockerOptions.map((option) => (
          <label className="editor__choice" key={option.value}>
            <input
              checked={currentDraft.blockers.includes(option.value)}
              type="checkbox"
              onChange={(e) =>
                updateArrayOption(
                  "blockers",
                  option.value,
                  e.target.checked,
                  blockerOptions,
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
        {customBlockers.map((item) => (
          <label className="editor__choice editor__choice--readonly" key={item}>
            <input checked readOnly type="checkbox" />
            <span>既有紀錄：{item}</span>
          </label>
        ))}
      </fieldset>

      <label>
        下一步
        <select
          value={currentDraft.suggestedNextStep}
          onChange={(e) =>
            updateField(
              "suggestedNextStep",
              e.target.value as Phase0SuggestedNextStep,
            )
          }
        >
          <option value="send_to_human_review">交給人工確認</option>
          <option value="ask_for_more_info">補問來源或現場資訊</option>
          <option value="keep_raw">先保留原始資訊</option>
          <option value="create_candidate_report">
            留下候選整理紀錄（仍需確認）
          </option>
          <option value="do_not_use_yet">暫時不要使用</option>
        </select>
      </label>

      <label className="editor__inline-check">
        不可直接行動
        <input
          type="checkbox"
          checked={currentDraft.unsafeToActDirectly}
          onChange={(e) => updateField("unsafeToActDirectly", e.target.checked)}
        />
      </label>

      <label>
        人工審核備註模板
        <select
          value={currentDraft.humanReviewNote ?? ""}
          onChange={(e) => updateField("humanReviewNote", e.target.value)}
        >
          <option value="">尚未選擇備註模板</option>
          {!noteInOptions && currentDraft.humanReviewNote ? (
            <option value={currentDraft.humanReviewNote}>
              保留既有備註：{currentDraft.humanReviewNote}
            </option>
          ) : null}
          {reviewNoteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="editor__actions">
        <button type="button" onClick={() => onChange(draft)}>
          儲存草稿
        </button>
        <button type="button" onClick={onReset}>
          重設草稿
        </button>
        <button type="button" onClick={onDelete}>
          刪除草稿
        </button>
      </div>
    </form>
  );
}

export default Phase0Editor;
