import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

export function Phase0RawInfoPanel({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const statusCounts = records.reduce((acc: Record<string, number>, record) => {
    acc[record.verificationStatus] = (acc[record.verificationStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div>
          <h2>原始資訊</h2>
          <p>這些資訊還是未整理的原始內容，應先由資訊整理者判斷是否可以進一步處理。</p>
          <p className="panel__hint">
            這裡顯示的資料不能直接當成行動任務，先看看來源、原文、驗證狀態再決定下一步。
          </p>
        </div>
        <p>{records.length} 筆資料</p>
      </div>

      <div className="panel__status-summary">
        <strong>狀態摘要：</strong>
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className="panel__status-item">
            {status}：{count}
          </span>
        ))}
      </div>

      <div className="grid">
        {records.map((record) => (
          <article
            className={`record-card ${record.id === selectedRecordId ? "record-card--selected" : ""}`}
            key={record.id}
          >
            <div className="record-card__header">
              <h3>{record.id}</h3>
              <StatusBadge status={record.verificationStatus} />
            </div>
            <p>{record.rawText}</p>
            <div className="record-card__meta">
              <SourceLabel sourceType={record.sourceType} />
              <span>更新：{formatDateTime(record.updatedAt)}</span>
            </div>
            <button type="button" onClick={() => onSelect(record.id)}>
              送到整理工作台
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
