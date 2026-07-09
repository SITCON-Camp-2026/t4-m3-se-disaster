import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0PreviewPanel } from "../features/phase-0/Phase0PreviewPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import { initialDrafts } from "../features/phase-0/phase0-initial-drafts";
import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "../features/phase-0/phase0-types";

type TabKey = "raw" | "preview" | "workbench";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "preview", label: "預覽資料" },
  { key: "workbench", label: "整理工作台" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [drafts, setDrafts] = useState<
    Record<string, Phase0JudgementDraft | undefined>
  >(() => initialDrafts);

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  function saveDraft(draft: Phase0JudgementDraft) {
    setDrafts((prev) => ({ ...prev, [draft.messyRecordId]: draft }));
  }

  function deleteDraft(recordId: string) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[recordId];
      return next;
    });
  }

  function resetDraft(recordId: string) {
    setDrafts((prev) => ({ ...prev, [recordId]: undefined }));
  }

  function classifyRecord(
    recordId: string,
    kind: Phase0JudgementDraft["possibleKind"],
  ) {
    setDrafts((prev) => {
      const current = prev[recordId];
      const nextDraft: Phase0JudgementDraft = current
        ? { ...current, possibleKind: kind }
        : {
            messyRecordId: recordId,
            possibleKind: kind,
            confidence: "low",
            evidence: [],
            blockers: [],
            suggestedNextStep: "send_to_human_review",
            unsafeToActDirectly: true,
          };
      return { ...prev, [recordId]: nextDraft };
    });
  }

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊整理工作台</h1>
        <p>
          這個 v1 prototype
          優先支援資訊整理者：先讓你看見原始資料、判斷不確定性，
          再決定哪些候選資訊可以進一步檢查或交給後續協作者。
        </p>
      </header>

      <nav className="tabs" aria-label="第一階段工作區">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : activeTab === "preview" ? (
          <Phase0PreviewPanel
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            drafts={drafts}
            onSelect={setSelectedRecordId}
            onClassify={classifyRecord}
          />
        ) : (
          <Phase0Workbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            drafts={drafts}
            onSelect={setSelectedRecordId}
            onSaveDraft={saveDraft}
            onDeleteDraft={deleteDraft}
            onResetDraft={resetDraft}
          />
        )}
      </section>
    </main>
  );
}
