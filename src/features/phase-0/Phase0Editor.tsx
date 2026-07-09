import type {
  Phase0Confidence,
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
  Phase0SuggestedNextStep,
} from "./phase0-types";

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

  function updateField<K extends keyof Phase0JudgementDraft>(
    key: K,
    value: Phase0JudgementDraft[K],
  ) {
    const current = draft as Phase0JudgementDraft;
    onChange({ ...current, [key]: value });
  }

  return (
    <form className="editor" onSubmit={(e) => e.preventDefault()}>
      <h3>草稿編輯：{record.id}</h3>

      <label>
        候選類型
        <select
          value={draft.possibleKind}
          onChange={(e) =>
            updateField("possibleKind", e.target.value as Phase0PossibleKind)
          }
        >
          <option value="unknown">候選類型待判斷</option>
          <option value="help_request_candidate">求助候選</option>
          <option value="site_status_candidate">地點狀態候選</option>
          <option value="task_candidate">任務候選</option>
          <option value="assignment_candidate">人員指派候選</option>
          <option value="announcement_candidate">公告候選</option>
        </select>
      </label>

      <label>
        信心程度
        <select
          value={draft.confidence}
          onChange={(e) =>
            updateField("confidence", e.target.value as Phase0Confidence)
          }
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </label>

      <label>
        佐證 (一行一條)
        <textarea
          value={draft.evidence.join("\n")}
          onChange={(e) => updateField("evidence", e.target.value.split("\n"))}
        />
      </label>

      <label>
        卡住的地方 (一行一條)
        <textarea
          value={draft.blockers.join("\n")}
          onChange={(e) => updateField("blockers", e.target.value.split("\n"))}
        />
      </label>

      <label>
        下一步
        <select
          value={draft.suggestedNextStep}
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
          <option value="create_candidate_report">建立候選通報</option>
          <option value="do_not_use_yet">暫時不要使用</option>
        </select>
      </label>

      <label>
        不可直接行動
        <input
          type="checkbox"
          checked={draft.unsafeToActDirectly}
          onChange={(e) => updateField("unsafeToActDirectly", e.target.checked)}
        />
      </label>

      <label>
        人工審核備註
        <input
          value={draft.humanReviewNote ?? ""}
          onChange={(e) => updateField("humanReviewNote", e.target.value)}
        />
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
