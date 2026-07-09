import { useRef, useState, type DragEvent } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { sourceLabels } from "../../components/source-labels";
import { labelForStatus } from "../../components/status-labels";
import { formatDateTime } from "../../lib/date";
import { analyzePhase0Risk, riskLevelFor } from "./phase0-risk-analysis";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

type PreviewCategoryKind =
  Exclude<Phase0JudgementDraft["possibleKind"], "unknown"> | "unclassified";

const kindLabels: Record<
  Phase0JudgementDraft["possibleKind"] | "none",
  string
> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "可能是需求線索",
  assignment_candidate: "可能涉及人力線索",
  announcement_candidate: "公告候選",
  unknown: "待判斷",
  none: "尚未建立草稿",
};

const previewCategories: PreviewCategoryKind[] = [
  "unclassified",
  "help_request_candidate",
  "site_status_candidate",
  "task_candidate",
  "assignment_candidate",
  "announcement_candidate",
];

const previewCategoryLabels: Record<PreviewCategoryKind, string> = {
  unclassified: "未分類",
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "可能是需求線索",
  assignment_candidate: "可能涉及人力線索",
  announcement_candidate: "公告候選",
};

function countBy<T extends string>(
  items: T[],
  fallbackOrder: T[] = [],
): Array<{ key: T; label: string; count: number }> {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  for (const key of fallbackOrder) {
    if (!counts.has(key)) counts.set(key, 0);
  }

  return Array.from(counts.entries()).map(([key, count]) => ({
    key,
    label: key,
    count,
  }));
}

function buildPriorityReasons(
  record: Phase0MessyRecord,
  draft: Phase0JudgementDraft | undefined,
) {
  return analyzePhase0Risk(record, draft).reasons;
}

function BarRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const width = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="viz-row">
      <div className="viz-row__label">
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="viz-row__track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function Phase0Dashboard({
  records,
  drafts,
  onSelect,
  selectedRecordId,
  onPreviewSelect,
  onClassify,
}: {
  records: Phase0MessyRecord[];
  drafts: Record<string, Phase0JudgementDraft | undefined>;
  onSelect: (recordId: string) => void;
  selectedRecordId: string;
  onPreviewSelect: (recordId: string) => void;
  onClassify: (
    recordId: string,
    kind: Phase0JudgementDraft["possibleKind"],
  ) => void;
}) {
  const riskDetailRef = useRef<HTMLDivElement>(null);
  const [dragOverCategory, setDragOverCategory] =
    useState<PreviewCategoryKind | null>(null);
  const [draftChangeNotice, setDraftChangeNotice] = useState("");
  const total = records.length;
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const draftedRecords = records.filter((record) => drafts[record.id]);
  const unsafeDrafts = draftedRecords.filter(
    (record) => drafts[record.id]?.unsafeToActDirectly,
  );
  const reviewRecords = records.filter(
    (record) => record.verificationStatus !== "verified",
  );

  const statusRows = countBy(
    records.map((record) => record.verificationStatus),
    ["needs_review", "unverified"],
  ).map((row) => ({ ...row, label: labelForStatus(row.key) }));

  const sourceRows = countBy(records.map((record) => record.sourceType)).map(
    (row) => ({ ...row, label: sourceLabels[row.key] ?? row.key }),
  );

  const kindRows = countBy(
    records.map((record) => drafts[record.id]?.possibleKind ?? "none"),
    ["none", "unknown"],
  ).map((row) => ({ ...row, label: kindLabels[row.key] }));

  const priorityRecords = records
    .map((record) => ({
      record,
      reasons: buildPriorityReasons(record, drafts[record.id]),
    }))
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length)
    .slice(0, 5);
  const suggestedRecord = priorityRecords[0];
  const heatmapItems = records.map((record) => {
    const draft = drafts[record.id];
    const reasons = buildPriorityReasons(record, draft);
    const extraReasons =
      draft?.unsafeToActDirectly && !reasons.includes("草稿標示不可直接行動")
        ? [...reasons, "草稿標示不可直接行動"]
        : reasons;

    return {
      record,
      reasons: extraReasons,
      level: riskLevelFor(extraReasons.length),
    };
  });
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
  const selectedDraft = selectedRecord ? drafts[selectedRecord.id] : undefined;
  const selectedRiskReasons = selectedRecord
    ? buildPriorityReasons(selectedRecord, selectedDraft)
    : [];
  const selectedHeatmapItem = heatmapItems.find(
    (item) => item.record.id === selectedRecord?.id,
  );
  const briefDraftText = selectedDraft
    ? `${kindLabels[selectedDraft.possibleKind]} · ${selectedDraft.confidence} 信心 · ${
        selectedDraft.evidence[0] ?? "尚未選擇佐證"
      }`
    : "尚未建立草稿";

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
    onPreviewSelect(recordId);
    setDraftChangeNotice(
      `${recordId} 已更新草稿分類為「${previewCategoryLabels[kind]}」，仍需人工確認。`,
    );
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    kind: PreviewCategoryKind,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverCategory(kind);
  }

  function focusRecordGaps(recordId: string) {
    onPreviewSelect(recordId);
    setDraftChangeNotice(
      `缺口檢視：${recordId} 的確認缺口已顯示在熱度圖下方與整理預覽。`,
    );
    window.setTimeout(() => {
      riskDetailRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }

  return (
    <div className="dashboard">
      <div className="panel__header">
        <div>
          <h2>整理儀表板</h2>
          <p>
            先用分布圖看資料品質與整理進度，再決定哪些原始資訊要進整理草稿區人工確認。
          </p>
        </div>
        <p>{total} 筆原始資訊</p>
      </div>

      <section className="dashboard__metrics" aria-label="整理概況">
        <div className="metric">
          <span>待人工確認</span>
          <strong>
            {reviewRecords.length} / {total}
          </strong>
        </div>
        <div className="metric">
          <span>已建立草稿</span>
          <strong>
            {draftedRecords.length} / {total}
          </strong>
        </div>
        <div className="metric">
          <span>草稿標示不可直接行動</span>
          <strong>
            {unsafeDrafts.length} / {draftedRecords.length || total}
          </strong>
        </div>
      </section>

      {suggestedRecord ? (
        <section className="next-check" aria-label="建議先檢查">
          <div>
            <span>整理建議</span>
            <h3>建議先檢查：{suggestedRecord.record.id}</h3>
            <p>
              原因：{suggestedRecord.reasons.slice(0, 3).join("、")}
              。這是整理工作順序， 不是救災優先順序。
            </p>
          </div>
          <button
            type="button"
            onClick={() => focusRecordGaps(suggestedRecord.record.id)}
          >
            查看缺口
          </button>
        </section>
      ) : null}

      <section className="risk-heatmap" aria-label="資料風險熱度圖">
        <div className="risk-heatmap__header">
          <div>
            <h3>資料風險熱度圖</h3>
            <p>
              每格代表一筆原始資訊；顏色越深表示本機規則式分析找到的確認缺口越多。
            </p>
          </div>
          <div className="risk-heatmap__legend" aria-label="熱度圖圖例">
            <span>低</span>
            <i className="risk-cell risk-cell--0" />
            <i className="risk-cell risk-cell--1" />
            <i className="risk-cell risk-cell--2" />
            <i className="risk-cell risk-cell--3" />
            <span>高</span>
          </div>
        </div>

        <div className="risk-heatmap__grid">
          {heatmapItems.map(({ record, reasons, level }) => (
            <button
              className={`risk-cell risk-cell--${level}`}
              key={record.id}
              type="button"
              onClick={() => focusRecordGaps(record.id)}
              title={`${record.id}：${reasons.join("、") || "目前沒有額外風險標籤"}`}
              aria-label={`${record.id}，${reasons.length} 個整理風險`}
            >
              {record.id.replace("M-", "")}
            </button>
          ))}
        </div>

        <p className="risk-heatmap__note">
          這張圖不是網路 AI、救災優先順序或確認狀態；深色只代表確認缺口多，
          不代表災情嚴重或行動優先。
        </p>

        {selectedHeatmapItem ? (
          <div
            className="risk-heatmap__detail"
            ref={riskDetailRef}
            aria-label="選取資料風險原因"
          >
            <strong>{selectedHeatmapItem.record.id} 的確認缺口</strong>
            <div>
              {(selectedHeatmapItem.reasons.length > 0
                ? selectedHeatmapItem.reasons
                : ["目前沒有額外風險標籤"]
              ).map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="dashboard__charts" aria-label="資料分布">
        <article className="viz-panel">
          <h3>查核狀態分布</h3>
          {statusRows.map((row) => (
            <BarRow
              key={row.key}
              label={row.label}
              count={row.count}
              total={total}
            />
          ))}
        </article>

        <article className="viz-panel">
          <h3>資訊取得方式</h3>
          {sourceRows.map((row) => (
            <BarRow
              key={row.key}
              label={row.label}
              count={row.count}
              total={total}
            />
          ))}
        </article>

        <article className="viz-panel">
          <h3>候選整理狀態</h3>
          {kindRows.map((row) => (
            <BarRow
              key={row.key}
              label={row.label}
              count={row.count}
              total={total}
            />
          ))}
        </article>
      </section>

      <section className="priority-list" aria-label="最需要補資料">
        <div className="priority-list__header">
          <div>
            <h3>最需要補資料</h3>
            <p>依不確定訊號、來源與草稿狀態排序；這不是救災優先順序。</p>
          </div>
        </div>

        <div className="priority-list__items">
          {priorityRecords.map(({ record, reasons }) => (
            <article className="priority-card" key={record.id}>
              <div>
                <h4>{record.id}</h4>
                <p>{record.rawText}</p>
                <div className="priority-card__reasons">
                  {reasons.map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </div>
              </div>
              <div className="priority-card__actions">
                <button type="button" onClick={() => onSelect(record.id)}>
                  查看整理草稿
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-preview" aria-label="整理預覽">
        <div className="dashboard-preview__header">
          <div>
            <h3>整理預覽</h3>
            <p>
              在同一頁快速檢查候選分類與單筆摘要；拖拉只改草稿分類，不代表資料已確認。
            </p>
          </div>
          <button
            disabled={!selectedRecord}
            type="button"
            onClick={() => selectedRecord && onSelect(selectedRecord.id)}
          >
            查看選取資料的整理草稿
          </button>
        </div>

        {draftChangeNotice ? (
          <p className="dashboard-preview__notice" role="status">
            {draftChangeNotice}
          </p>
        ) : null}

        <div className="preview__layout preview__layout--embedded">
          <section className="preview__categories">
            {previewCategories.map((kind) => (
              <div
                key={kind}
                className={`preview__category ${dragOverCategory === kind ? "drag-over" : ""}`}
                onDrop={(event) => handleDrop(event, kind)}
                onDragOver={(event) => handleDragOver(event, kind)}
                onDragLeave={() => setDragOverCategory(null)}
              >
                <div className="preview__category-header">
                  <h4>{previewCategoryLabels[kind]}</h4>
                  <span>{(recordsByCategory[kind] ?? []).length} 筆</span>
                </div>

                <div className="preview__thumb-list">
                  {(recordsByCategory[kind] ?? []).map((record) => {
                    const draft = drafts[record.id];
                    return (
                      <div
                        key={record.id}
                        className={`preview__thumb ${record.id === selectedRecord?.id ? "preview__thumb--selected" : ""}`}
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(event, record.id)
                        }
                        onClick={() => onPreviewSelect(record.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            onPreviewSelect(record.id);
                          }
                        }}
                      >
                        <div className="preview__thumb-header">
                          <strong>{record.id}</strong>
                          <StatusBadge status={record.verificationStatus} />
                        </div>
                        <p>
                          {record.rawText.slice(0, 64)}
                          {record.rawText.length > 64 ? "..." : ""}
                        </p>
                        <div className="preview__thumb-meta">
                          <span>
                            {draft ? kindLabels[draft.possibleKind] : "無草稿"}
                          </span>
                          <span>{draft ? draft.confidence : "-"}</span>
                        </div>
                        <div className="preview__gap-tags">
                          {buildPriorityReasons(record, draft)
                            .slice(0, 2)
                            .map((reason) => (
                              <span key={reason}>{reason}</span>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {selectedRecord ? (
            <aside className="preview__detail">
              <article className="record-card record-card--detail">
                <div className="record-card__header">
                  <h4>{selectedRecord.id}</h4>
                  <StatusBadge status={selectedRecord.verificationStatus} />
                </div>
                <p>{selectedRecord.rawText}</p>
                <div className="preview__draft-detail">
                  <h5>簡略草稿</h5>
                  <p>{briefDraftText}</p>
                </div>
                {selectedRiskReasons.length > 0 ? (
                  <div className="preview__risk-list">
                    <h5>需要注意</h5>
                    <div>
                      {selectedRiskReasons.map((reason) => (
                        <span key={reason}>{reason}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="record-card__meta">
                  <SourceLabel sourceType={selectedRecord.sourceType} />
                  <span>更新：{formatDateTime(selectedRecord.updatedAt)}</span>
                </div>
              </article>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}
