import { sourceLabels } from "../../components/source-labels";
import { labelForStatus } from "../../components/status-labels";
import { formatDateTime } from "../../lib/date";
import { analyzePhase0Risk } from "./phase0-risk-analysis";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

const kindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "可能是需求線索",
  assignment_candidate: "可能涉及人力線索",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0JudgementDraft["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export function Phase0TracePanel({
  record,
  draft,
}: {
  record: Phase0MessyRecord;
  draft: Phase0JudgementDraft | undefined;
}) {
  const analysis = analyzePhase0Risk(record, draft);
  const visibleFacts = [
    `資訊取得方式：${sourceLabels[record.sourceType] ?? record.sourceType}`,
    `查核狀態：${labelForStatus(record.verificationStatus)}`,
    `更新時間：${formatDateTime(record.updatedAt)}`,
  ];

  const candidateJudgements = draft
    ? [
        `候選類型：${kindLabels[draft.possibleKind]}`,
        `信心程度：${confidenceLabels[draft.confidence]}`,
        `下一步仍是草稿建議，不是已確認決策。`,
      ]
    : ["尚未建立人工整理草稿。"];

  const gaps =
    draft && draft.blockers.length > 0
      ? draft.blockers
      : analysis.blockers.length > 0
        ? analysis.blockers
        : [
            "尚未寫下卡住點。",
            "尚未說明需要補問誰、補問什麼。",
            "尚未確認原文是否足夠支持候選類型。",
          ];

  const risks = [
    record.verificationStatus !== "verified"
      ? "目前不是已確認資訊，不能當成事實發布。"
      : "即使狀態已確認，仍需檢查是否適合進入下一步。",
    draft?.unsafeToActDirectly
      ? "草稿已標示不可直接行動。"
      : "尚未明確標示不可直接行動，需人工複查。",
    ...analysis.signals.map((signal) => `原文出現不確定訊號：「${signal}」。`),
  ];

  return (
    <section className="trace-panel" aria-label="判斷追溯">
      <div>
        <p className="eyebrow">判斷追溯</p>
        <h3>把原文、候選、缺口和風險分開看</h3>
      </div>

      <div className="trace-grid">
        <article>
          <h4>原文可見</h4>
          <ul>
            {visibleFacts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <h4>候選判斷</h4>
          <ul>
            {candidateJudgements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <h4>仍有缺口</h4>
          <ul>
            {gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <h4>誤用風險</h4>
          <ul>
            {risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
