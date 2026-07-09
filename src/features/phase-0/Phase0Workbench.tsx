import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0FlowPanel } from "./Phase0FlowPanel";
import { Phase0TracePanel } from "./Phase0TracePanel";
import Phase0Editor from "./Phase0Editor";
import type { Phase0MessyRecord, Phase0JudgementDraft } from "./phase0-types";

export function Phase0Workbench({
  records,
  selectedRecordId,
  drafts,
  onSelect,
  onSaveDraft,
  onDeleteDraft,
  onResetDraft,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  drafts: Record<string, Phase0JudgementDraft | undefined>;
  onSelect: (recordId: string) => void;
  onSaveDraft: (draft: Phase0JudgementDraft) => void;
  onDeleteDraft: (recordId: string) => void;
  onResetDraft: (recordId: string) => void;
}) {
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const draftCount = Object.values(drafts).filter(Boolean).length;

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這個頁面優先給資訊整理者：先判斷哪些資訊是未確認候選、哪些需要人工確認。
        </p>
        <p>
          這裡整合可編輯草稿、候選類型與人工確認線索，讓你更清楚哪些內容仍只是
          未驗證的候選，而不是已確認事實。
        </p>
      </div>

      <div className="workbench__summary">
        <div>
          <strong>整理提示：</strong>
          <span>先建立草稿，再補上佐證、卡住點與是否可直接行動。</span>
        </div>
        <div>
          <span>共 {records.length} 筆原始資料</span>
          <span>已建立草稿：{draftCount}</span>
          <span>
            待人工確認：
            {
              records.filter(
                (record) => record.verificationStatus !== "verified",
              ).length
            }
          </span>
        </div>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
              <StatusBadge status={record.verificationStatus} />
              {drafts[record.id] ? (
                <span className="badge badge--draft">草稿</span>
              ) : null}
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <Phase0TracePanel
            record={selectedRecord}
            draft={drafts[selectedRecord.id]}
          />

          <Phase0FlowPanel
            record={selectedRecord}
            draft={drafts[selectedRecord.id]}
            onApply={(draft) => onSaveDraft(draft)}
          />

          <Phase0Editor
            record={selectedRecord}
            draft={drafts[selectedRecord.id]}
            onChange={(draft) => onSaveDraft(draft)}
            onDelete={() => onDeleteDraft(selectedRecord.id)}
            onReset={() => onResetDraft(selectedRecord.id)}
          />
        </div>
      </div>
    </div>
  );
}
