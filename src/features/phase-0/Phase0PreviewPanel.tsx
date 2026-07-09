import { useState, type DragEvent } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

type PreviewCategoryKind =
  Exclude<Phase0JudgementDraft["possibleKind"], "unknown"> | "unclassified";

export function Phase0PreviewPanel({
  records,
  selectedRecordId,
  drafts,
  onSelect,
  onClassify,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  drafts: Record<string, Phase0JudgementDraft | undefined>;
  onSelect: (recordId: string) => void;
  onClassify: (
    recordId: string,
    kind: Phase0JudgementDraft["possibleKind"],
  ) => void;
}) {
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];

  const [dragOverCategory, setDragOverCategory] =
    useState<PreviewCategoryKind | null>(null);

  const kindLabelMap: Record<Phase0JudgementDraft["possibleKind"], string> = {
    unknown: "待判斷",
    help_request_candidate: "求助候選",
    site_status_candidate: "地點狀態候選",
    task_candidate: "任務候選",
    assignment_candidate: "人員指派候選",
    announcement_candidate: "公告候選",
  };

  const categories: PreviewCategoryKind[] = [
    "unclassified",
    "help_request_candidate",
    "site_status_candidate",
    "task_candidate",
    "assignment_candidate",
    "announcement_candidate",
  ];

  const categoryLabels: Record<PreviewCategoryKind, string> = {
    unclassified: "未分類",
    help_request_candidate: "求助候選",
    site_status_candidate: "地點狀態候選",
    task_candidate: "任務候選",
    assignment_candidate: "人員指派候選",
    announcement_candidate: "公告候選",
  };

  const recordsByCategory = records.reduce(
    (acc, record) => {
      const draft = drafts[record.id];
      const kind = draft?.possibleKind ?? "unknown";
      const bucketKey: PreviewCategoryKind =
        kind === "unknown" ? "unclassified" : kind;
      if (!acc[bucketKey]) acc[bucketKey] = [];
      acc[bucketKey]!.push(record);
      return acc;
    },
    {} as Record<PreviewCategoryKind, Phase0MessyRecord[]>,
  );

  function handleDragStart(event: DragEvent<HTMLDivElement>, recordId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", recordId);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    kind: PreviewCategoryKind,
  ) {
    event.preventDefault();
    setDragOverCategory(null);
    const recordId = event.dataTransfer.getData("text/plain");
    if (!recordId) return;
    const nextKind: Phase0JudgementDraft["possibleKind"] =
      kind === "unclassified" ? "unknown" : kind;
    onClassify(recordId, nextKind);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    kind: PreviewCategoryKind,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverCategory(kind);
  }

  function handleDragLeave() {
    setDragOverCategory(null);
  }

  const selectedDraft = drafts[selectedRecord.id];
  const briefDraftText = selectedDraft
    ? `${kindLabelMap[selectedDraft.possibleKind]} · ${selectedDraft.confidence} 信心 · ${selectedDraft.evidence[0] ?? "無佐證"}`
    : "尚未建立草稿";

  return (
    <div className="phase0-preview">
      <div className="panel__header">
        <div>
          <h2>預覽資料</h2>
          <p>將原始資訊拖拉到候選分類，這是一種整理預覽，不代表資料已確認。</p>
        </div>
        <p>{records.length} 筆原始資料</p>
      </div>

      <div className="preview__layout">
        <section className="preview__categories">
          {categories.map((kind) => (
            <div
              key={kind}
              className={`preview__category ${dragOverCategory === kind ? "drag-over" : ""}`}
              onDrop={(event) => handleDrop(event, kind)}
              onDragOver={(event) => handleDragOver(event, kind)}
              onDragLeave={handleDragLeave}
            >
              <div className="preview__category-header">
                <h3>{categoryLabels[kind]}</h3>
                <span>{(recordsByCategory[kind] ?? []).length} 筆</span>
              </div>

              <div className="preview__thumb-list">
                {(recordsByCategory[kind] ?? []).map((record) => {
                  const draft = drafts[record.id];
                  return (
                    <div
                      key={record.id}
                      className={`preview__thumb ${record.id === selectedRecord.id ? "preview__thumb--selected" : ""}`}
                      draggable
                      onDragStart={(event) => handleDragStart(event, record.id)}
                      onClick={() => onSelect(record.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          onSelect(record.id);
                        }
                      }}
                    >
                      <div className="preview__thumb-header">
                        <strong>{record.id}</strong>
                        <StatusBadge status={record.verificationStatus} />
                      </div>
                      <p>
                        {record.rawText.slice(0, 48)}
                        {record.rawText.length > 48 ? "…" : ""}
                      </p>
                      <div className="preview__thumb-meta">
                        <span>
                          {draft ? kindLabelMap[draft.possibleKind] : "無草稿"}
                        </span>
                        <span>{draft ? draft.confidence : "-"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <aside className="preview__detail">
          <article className="record-card record-card--detail">
            <div className="record-card__header">
              <h3>{selectedRecord.id}</h3>
              <StatusBadge status={selectedRecord.verificationStatus} />
            </div>
            <p>{selectedRecord.rawText}</p>
            <div className="preview__draft-detail">
              <h4>簡略草稿</h4>
              <p>{briefDraftText}</p>
            </div>
            <div className="record-card__meta">
              <SourceLabel sourceType={selectedRecord.sourceType} />
              <span>更新：{formatDateTime(selectedRecord.updatedAt)}</span>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
