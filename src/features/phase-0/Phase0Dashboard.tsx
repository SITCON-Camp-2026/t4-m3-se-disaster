import { sourceLabels } from "../../components/source-labels";
import { labelForStatus } from "../../components/status-labels";
import { analyzePhase0Risk, riskLevelFor } from "./phase0-risk-analysis";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

const kindLabels: Record<
  Phase0JudgementDraft["possibleKind"] | "none",
  string
> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "待判斷",
  none: "尚未建立草稿",
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
}: {
  records: Phase0MessyRecord[];
  drafts: Record<string, Phase0JudgementDraft | undefined>;
  onSelect: (recordId: string) => void;
}) {
  const total = records.length;
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

  return (
    <div className="dashboard">
      <div className="panel__header">
        <div>
          <h2>整理儀表板</h2>
          <p>
            先用分布圖看資料品質與整理進度，再決定哪些原始資訊要進工作台人工確認。
          </p>
        </div>
        <p>{total} 筆原始資訊</p>
      </div>

      <section className="dashboard__metrics" aria-label="整理概況">
        <div className="metric">
          <span>需要人工確認</span>
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
              onClick={() => onSelect(record.id)}
              title={`${record.id}：${reasons.join("、") || "目前沒有額外風險標籤"}`}
              aria-label={`${record.id}，${reasons.length} 個整理風險`}
            >
              {record.id.replace("M-", "")}
            </button>
          ))}
        </div>

        <p className="risk-heatmap__note">
          這張圖不是網路
          AI、救災優先順序或確認狀態；它只用既有原始資訊做本機風險提示。
        </p>
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

      <section className="priority-list" aria-label="優先人工確認">
        <div className="priority-list__header">
          <div>
            <h3>優先人工確認</h3>
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
              <button type="button" onClick={() => onSelect(record.id)}>
                進工作台
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
