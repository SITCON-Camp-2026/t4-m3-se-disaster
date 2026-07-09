import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0FlowPanel } from "./Phase0FlowPanel";
import { Phase0TracePanel } from "./Phase0TracePanel";
import Phase0Editor from "./Phase0Editor";
import { analyzePhase0Risk } from "./phase0-risk-analysis";
import type { Phase0MessyRecord, Phase0JudgementDraft } from "./phase0-types";

export function Phase0Workbench({
  records,
  selectedRecordId,
  drafts,
  onSelect,
  onSaveDraft,
  onDeleteDraft,
  onResetDraft,
  taskSubmitIdentities,
  onSubmitTaskCandidate,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  drafts: Record<string, Phase0JudgementDraft | undefined>;
  onSelect: (recordId: string) => void;
  onSaveDraft: (draft: Phase0JudgementDraft) => void;
  onDeleteDraft: (recordId: string) => void;
  onResetDraft: (recordId: string) => void;
  taskSubmitIdentities: Array<{ value: string; label: string }>;
  onSubmitTaskCandidate: (
    record: Phase0MessyRecord,
    draft: Phase0JudgementDraft,
    identity: string,
  ) => void;
}) {
  const [taskSubmitIdentity, setTaskSubmitIdentity] = useState("");
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const selectedDraft = drafts[selectedRecord.id];
  const canSubmitCandidate = Boolean(
    selectedDraft &&
    taskSubmitIdentity &&
    selectedDraft.unsafeToActDirectly &&
    selectedDraft.blockers.length > 0,
  );
  const selectedAnalysis = analyzePhase0Risk(selectedRecord, selectedDraft);
  const directUseReasons = Array.from(
    new Set([
      ...selectedAnalysis.blockers,
      ...(selectedDraft?.blockers ?? []),
      selectedDraft?.unsafeToActDirectly ? "草稿標示不可直接行動。" : "",
    ]),
  )
    .filter(Boolean)
    .slice(0, 3);
  const draftCount = Object.values(drafts).filter(Boolean).length;

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理草稿區</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
        <p>
          這個頁面優先給資訊整理者：先判斷哪些資訊是未確認候選、哪些需要人工確認。
        </p>
        <p>
          這裡整合可編輯草稿、候選類型與人工確認線索，讓你更清楚哪些內容仍只是
          未驗證的候選，而不是已確認事實。
        </p>
        <strong className="workbench__boundary">
          不是派工畫面，也不是回報入口。
        </strong>
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

      <section className="direct-use-warning" aria-label="不能直接變成任務原因">
        <div>
          <span>目前不能直接變成任務，因為</span>
          <ul>
            {(directUseReasons.length > 0
              ? directUseReasons
              : ["尚未留下足夠判斷理由，需要人工確認。"]
            ).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      </section>

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

          <Phase0TracePanel record={selectedRecord} draft={selectedDraft} />

          <Phase0FlowPanel
            record={selectedRecord}
            records={records}
            draft={selectedDraft}
            onApply={(draft) => onSaveDraft(draft)}
          />

          <Phase0Editor
            record={selectedRecord}
            draft={selectedDraft}
            onChange={(draft) => onSaveDraft(draft)}
            onDelete={() => onDeleteDraft(selectedRecord.id)}
            onReset={() => onResetDraft(selectedRecord.id)}
          />

          <section className="task-submit-panel" aria-label="送到行動端">
            <div>
              <p className="eyebrow">任務候選送出</p>
              <h3>送出候選草稿供討論</h3>
              <p>
                這會把目前草稿送到行動端的「候選草稿檢視」，方便下一位協作者討論。
                不代表資料已確認，也不是正式派工或執行指示。
              </p>
            </div>

            <label>
              角色聲明（本機下拉，非驗證）
              <select
                value={taskSubmitIdentity}
                onChange={(event) => setTaskSubmitIdentity(event.target.value)}
              >
                <option value="">請選擇身份</option>
                {taskSubmitIdentities.map((identity) => (
                  <option key={identity.value} value={identity.value}>
                    {identity.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="task-submit-panel__checks" aria-label="送出前檢核">
              <span>
                {selectedDraft ? "已建立整理草稿" : "尚未建立整理草稿"}
              </span>
              <span>
                {selectedDraft?.blockers.length
                  ? "已保留卡住點"
                  : "尚未保留卡住點"}
              </span>
              <span>
                {selectedDraft?.unsafeToActDirectly
                  ? "仍標示不可直接行動"
                  : "尚未標示不可直接行動"}
              </span>
            </div>

            <button
              disabled={!canSubmitCandidate}
              type="button"
              onClick={() => {
                if (!selectedDraft || !taskSubmitIdentity) return;
                onSubmitTaskCandidate(
                  selectedRecord,
                  selectedDraft,
                  taskSubmitIdentity,
                );
              }}
            >
              送出候選草稿供討論
            </button>

            <p>
              送出後仍會保留「需要人工確認」與「不可直接行動」的邊界；行動端只能標記已查看草稿。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
