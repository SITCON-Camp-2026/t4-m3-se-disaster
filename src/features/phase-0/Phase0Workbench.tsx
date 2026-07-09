import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0Judgement } from "./phase0-heuristics";
import Phase0Editor from "./Phase0Editor";
import type { Phase0MessyRecord, Phase0JudgementDraft } from "./phase0-types";
import { useEffect, useState } from "react";

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
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const draftCount = Object.values(drafts).filter(Boolean).length;

  useEffect(() => {
    console.debug("Phase0Workbench.drafts", drafts);
  }, [drafts]);

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
          <span>待人工確認：{records.filter((record) => record.verificationStatus !== "verified").length}</span>
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
              {drafts[record.id] ? <span className="badge badge--draft">草稿</span> : null}
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <Phase0JudgementCard judgement={safetyBoundary} record={selectedRecord} />

          <Phase0Editor
            record={selectedRecord}
            draft={drafts[selectedRecord.id]}
            onChange={(draft) => onSaveDraft(draft)}
            onDelete={() => onDeleteDraft(selectedRecord.id)}
            onReset={() => onResetDraft(selectedRecord.id)}
          />
        </div>

        <aside className="workbench__checklist">
          <h3>第一階段完成檢查</h3>
          <ul>
            <li>Starter 已載入 {records.length} 筆原始資訊</li>
            <li>目前草稿數量：{draftCount}</li>
            <li>請 agent 加上建立、編輯、刪除或重設整理草稿</li>
            <li>至少讓 6 筆原始資訊被嘗試整理成可編輯草稿</li>
            <li>至少挑 2 個候選判斷由人類質疑或修正</li>
            <li>把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
