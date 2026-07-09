import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0Dashboard } from "../features/phase-0/Phase0Dashboard";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import { buildInitialDrafts } from "../features/phase-0/phase0-initial-drafts";
import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "../features/phase-0/phase0-types";

type TabKey = "dashboard" | "raw" | "workbench";
type AppMode = "organizer" | "reporter" | "actor";
type IdentityRole = "volunteer" | "restaurant" | "government" | "organizer";

type ActionTaskCandidate = {
  id: string;
  recordId: string;
  title: string;
  summary: string;
  submittedBy: IdentityRole;
  submittedAt: string;
  blockers: string[];
  unsafeToActDirectly: boolean;
  status: "execution_project" | "review_marked";
  viewedBy?: IdentityRole;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "dashboard", label: "整理儀表板" },
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理草稿區" },
];

const appModes: Array<{ key: AppMode; label: string; description: string }> = [
  {
    key: "organizer",
    label: "資料整理端",
    description: "保留原文、標示缺口、建立待確認草稿。",
  },
  {
    key: "reporter",
    label: "回報端",
    description: "本機暫存便當需求，不下單、不通知餐廳。",
  },
  {
    key: "actor",
    label: "行動端示意",
    description: "檢視候選草稿與供應風險，不派工不配送。",
  },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];

const identityOptions: Array<{ value: IdentityRole; label: string }> = [
  { value: "volunteer", label: "志工" },
  { value: "restaurant", label: "志願餐廳" },
  { value: "government", label: "政府單位" },
  { value: "organizer", label: "資料整理者" },
];

const identityLabels: Record<IdentityRole, string> = {
  volunteer: "志工",
  restaurant: "志願餐廳",
  government: "政府單位",
  organizer: "資料整理者",
};

const taskKindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "需求線索候選",
  assignment_candidate: "人力線索候選",
  announcement_candidate: "公告候選",
  unknown: "待判斷候選",
};

const bentoNeedGroups = [
  "資料整理志工",
  "現場清理志工",
  "臨時休息站工作人員",
  "待人工確認的其他需求",
];

const mockRestaurantCapacity = [
  {
    name: "示範餐廳 A",
    capacity: 80,
    assigned: 65,
    mealType: "午餐",
    bentoType: "一般便當",
    pickupWindow: "11:30-12:10",
    status: "待電話確認",
    constraint: "需確認是否可分批取餐。",
    action: "先確認出餐時間，再決定是否增加分配。",
    note: "示範可討論一般便當，需人工確認出餐時間。",
  },
  {
    name: "示範餐廳 B",
    capacity: 50,
    assigned: 35,
    mealType: "午餐",
    bentoType: "素食 / 一般",
    pickupWindow: "12:00-12:40",
    status: "數量待確認",
    constraint: "素食數量不可直接推估。",
    action: "先拆分素食與一般需求，再回頭確認供應量。",
    note: "示範可討論素食選項，仍需確認數量是否足夠。",
  },
  {
    name: "示範餐廳 C",
    capacity: 40,
    assigned: 20,
    mealType: "晚餐",
    bentoType: "備援便當",
    pickupWindow: "17:20-18:00",
    status: "備援草稿",
    constraint: "只能作為備援，不代表已接受訂單。",
    action: "保留為備援，等資料整理端確認缺口後再使用。",
    note: "只能作為備援供應，不代表已接受訂單。",
  },
];

export function App() {
  const [activeAppMode, setActiveAppMode] = useState<AppMode>("organizer");
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [drafts, setDrafts] = useState<
    Record<string, Phase0JudgementDraft | undefined>
  >(() => buildInitialDrafts(phase0Records));
  const [workbenchUnlocked, setWorkbenchUnlocked] = useState(false);
  const [humanGateOpen, setHumanGateOpen] = useState(false);
  const [humanGatePuzzleValue, setHumanGatePuzzleValue] = useState(0);
  const [pendingWorkbenchRecordId, setPendingWorkbenchRecordId] = useState<
    string | null
  >(null);
  const [bentoNeedGroup, setBentoNeedGroup] = useState(bentoNeedGroups[0]);
  const [bentoCount, setBentoCount] = useState(20);
  const [bentoMealType, setBentoMealType] = useState("午餐");
  const [bentoNotice, setBentoNotice] = useState("");
  const [bentoRecords, setBentoRecords] = useState<Phase0MessyRecord[]>([]);
  const [actionTaskCandidates, setActionTaskCandidates] = useState<
    ActionTaskCandidate[]
  >([]);
  const [reviewerRole, setReviewerRole] = useState("");
  const [reviewerAcknowledged, setReviewerAcknowledged] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const allRecords = [...phase0Records, ...bentoRecords];
  const humanGateSolved = humanGatePuzzleValue >= 92;

  function requestWorkbench(recordId = selectedRecordId) {
    setSelectedRecordId(recordId);

    if (workbenchUnlocked) {
      setActiveTab("workbench");
      return;
    }

    setPendingWorkbenchRecordId(recordId);
    setHumanGatePuzzleValue(0);
    setHumanGateOpen(true);
  }

  function selectForWorkbench(recordId: string) {
    requestWorkbench(recordId);
  }

  function confirmHumanGate() {
    if (!humanGateSolved) return;

    setWorkbenchUnlocked(true);
    setSelectedRecordId(pendingWorkbenchRecordId ?? selectedRecordId);
    setActiveTab("workbench");
    setHumanGateOpen(false);
    setPendingWorkbenchRecordId(null);
  }

  function cancelHumanGate() {
    setHumanGateOpen(false);
    setHumanGatePuzzleValue(0);
    setPendingWorkbenchRecordId(null);
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

  function storeBentoNeedDraft() {
    const safeCount = Number.isFinite(bentoCount)
      ? Math.max(1, Math.min(200, Math.round(bentoCount)))
      : 1;
    const recordId = `BENTO-${String(bentoRecords.length + 1).padStart(3, "0")}`;
    const rawText = `便當需求回報草稿：${bentoNeedGroup}需要 ${safeCount} 個${bentoMealType}便當。此為本機示範回報，未確認、未訂購、未送出。`;
    const nextRecord: Phase0MessyRecord = {
      id: recordId,
      rawText,
      sourceType: "mock",
      verificationStatus: "needs_review",
      updatedAt: new Date().toISOString(),
    };
    const nextDraft: Phase0JudgementDraft = {
      messyRecordId: recordId,
      possibleKind: "task_candidate",
      confidence: "low",
      evidence: [
        `回報端本機暫存：${bentoNeedGroup} / ${safeCount} 個 / ${bentoMealType}。`,
        "此資料尚未寫入正式資料來源，也沒有送出訂單。",
      ],
      blockers: [
        "便當需求尚未由資料整理者確認。",
        "不得直接下單、付款、派送或通知餐廳。",
        "仍需確認需求群組、數量、餐別與負責窗口。",
      ],
      suggestedNextStep: "send_to_human_review",
      unsafeToActDirectly: true,
      humanReviewNote: "回報端產生的便當需求草稿，只能交給資料整理端人工確認。",
    };

    setBentoRecords((prev) => [...prev, nextRecord]);
    setDrafts((prev) => ({ ...prev, [recordId]: nextDraft }));
    setSelectedRecordId(recordId);
    setBentoNotice(
      `已暫存成待確認草稿：${recordId}，${bentoNeedGroup} 需要 ${safeCount} 個${bentoMealType}便當。這不是正式訂單，仍需人工確認；請不要據此通知餐廳。`,
    );
  }

  function submitTaskCandidate(
    record: Phase0MessyRecord,
    draft: Phase0JudgementDraft,
    identity: string,
  ) {
    if (!identityOptions.some((option) => option.value === identity)) return;

    const submitter = identity as IdentityRole;
    const existingIndex = actionTaskCandidates.findIndex(
      (task) => task.recordId === record.id,
    );
    const nextTask: ActionTaskCandidate = {
      id:
        existingIndex >= 0
          ? actionTaskCandidates[existingIndex].id
          : `CAND-${String(actionTaskCandidates.length + 1).padStart(3, "0")}`,
      recordId: record.id,
      title: `${taskKindLabels[draft.possibleKind]}：${record.id}`,
      summary:
        record.rawText.length > 90
          ? `${record.rawText.slice(0, 90)}...`
          : record.rawText,
      submittedBy: submitter,
      submittedAt: new Date().toISOString(),
      blockers: draft.blockers,
      unsafeToActDirectly: draft.unsafeToActDirectly,
      status: "execution_project",
      viewedBy: undefined,
    };

    setActionTaskCandidates((prev) => {
      if (existingIndex < 0) return [...prev, nextTask];
      return prev.map((task) =>
        task.recordId === record.id ? nextTask : task,
      );
    });
    setActionNotice(
      `已建立行動端候選草稿檢視：${nextTask.id}。這仍需人工確認，只能被標記查看，不能當成正式派工。`,
    );
    setActiveAppMode("actor");
  }

  function markTaskCandidateViewed(taskId: string) {
    if (!identityOptions.some((option) => option.value === reviewerRole)) {
      setActionNotice("請先用下拉選單選擇查看角色。");
      return;
    }

    if (!reviewerAcknowledged) {
      setActionNotice("請先確認：這不是正式派工，也不可直接行動。");
      return;
    }

    const reviewer = reviewerRole as IdentityRole;
    setActionTaskCandidates((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: "review_marked", viewedBy: reviewer }
          : task,
      ),
    );
    setActionNotice(
      `已由${identityLabels[reviewer]}標記查看 ${taskId} 的候選草稿；這不是正式派工。`,
    );
  }

  function unmarkTaskCandidateViewed(taskId: string) {
    setActionTaskCandidates((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: "execution_project", viewedBy: undefined }
          : task,
      ),
    );
    setActionNotice(`已取消 ${taskId} 的查看標記；候選草稿仍需人工確認。`);
  }

  const statusCounts = allRecords.reduce<Record<string, number>>(
    (counts, record) => ({
      ...counts,
      [record.verificationStatus]: (counts[record.verificationStatus] ?? 0) + 1,
    }),
    {},
  );
  const reviewCount = allRecords.filter(
    (record) => record.verificationStatus !== "verified",
  ).length;
  const draftedCount = Object.values(drafts).filter(Boolean).length;

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊協作原型</h1>
        <p>
          目前主要完成「資料整理端」：先讓資訊整理者看見原始資料、判斷不確定性，
          再決定哪些候選資訊可以進一步檢查或交給後續協作者。
        </p>
        <p className="hero__boundary">
          這不是新的災情回報表，也不接收真實現場資料、地址、電話或個資。
        </p>
        <div className="decision-strip" aria-label="訪談後的決策摘要">
          <div>
            <span>目前判斷</span>
            <strong>先服務資訊整理者</strong>
          </div>
          <div>
            <span>資料狀態</span>
            <strong>
              {statusCounts.needs_review ?? 0} 待人工確認 /{" "}
              {statusCounts.unverified ?? 0} 未查核
            </strong>
          </div>
          <div>
            <span>決策邊界</span>
            <strong>{reviewCount} 筆都不能直接變成任務</strong>
          </div>
          <div>
            <span>整理進度</span>
            <strong>
              {draftedCount} / {allRecords.length} 筆有草稿
            </strong>
          </div>
        </div>
      </header>

      <nav className="app-switcher" aria-label="切換使用端">
        {appModes.map((mode) => (
          <button
            key={mode.key}
            className={activeAppMode === mode.key ? "active" : ""}
            type="button"
            onClick={() => setActiveAppMode(mode.key)}
          >
            <strong>{mode.label}</strong>
            <span>{mode.description}</span>
          </button>
        ))}
      </nav>

      <section className="boundary-board" aria-label="責任邊界">
        <div>
          <span>責任邊界</span>
          <strong>不判定真偽、不核准任務、不派工</strong>
        </div>
        <div>
          <span>外部行為</span>
          <strong>不下單、不付款、不通知餐廳</strong>
        </div>
        <div>
          <span>資料使用</span>
          <strong>只用 mock 與本機草稿，不保存真實回報</strong>
        </div>
      </section>

      {activeAppMode === "organizer" ? (
        <nav className="tabs" aria-label="資料整理端工作區">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              type="button"
              onClick={() =>
                tab.key === "workbench"
                  ? requestWorkbench()
                  : setActiveTab(tab.key)
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}

      <section className="panel">
        {activeAppMode === "reporter" ? (
          <section className="endpoint-panel" aria-label="回報端">
            <div className="panel__header">
              <div>
                <p className="eyebrow">回報端</p>
                <h2>便當需求回報網站原型</h2>
                <p>
                  用來示範「誰需要便當」的回報流程。這裡只做本機試算，
                  不會送出訂單、不會新增
                  fixture，也不會要求填真實姓名、地址或電話。
                </p>
              </div>
            </div>
            <div className="endpoint-flow" aria-label="回報流程">
              <span>填寫需求</span>
              <span>本機暫存</span>
              <span>資料整理者人工確認</span>
            </div>
            <form className="bento-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                誰需要便當
                <select
                  value={bentoNeedGroup}
                  onChange={(event) => setBentoNeedGroup(event.target.value)}
                >
                  {bentoNeedGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                需要數量
                <input
                  min={1}
                  max={200}
                  type="number"
                  value={bentoCount}
                  onChange={(event) =>
                    setBentoCount(Number(event.target.value))
                  }
                />
              </label>

              <label>
                餐別
                <select
                  value={bentoMealType}
                  onChange={(event) => setBentoMealType(event.target.value)}
                >
                  <option value="早餐">早餐</option>
                  <option value="午餐">午餐</option>
                  <option value="晚餐">晚餐</option>
                </select>
              </label>

              <button type="button" onClick={storeBentoNeedDraft}>
                暫存成待確認草稿
              </button>
            </form>

            {bentoNotice ? (
              <p className="endpoint-notice" role="status">
                {bentoNotice}
              </p>
            ) : null}

            <div className="endpoint-grid">
              <article>
                <span>回報內容</span>
                <h3>誰需要便當</h3>
                <p>只記錄群組或角色，不填真實姓名、電話或地址。</p>
              </article>
              <article>
                <span>回報狀態</span>
                <h3>未整理便當需求</h3>
                <p>暫存後仍要交給資料整理端確認，不能直接變成訂單。</p>
              </article>
              <article>
                <span>現在不做</span>
                <h3>真實訂購送出</h3>
                <p>目前不串接餐廳、不付款、不通知外部服務。</p>
              </article>
            </div>
          </section>
        ) : activeAppMode === "actor" ? (
          <section className="endpoint-panel" aria-label="行動端">
            <div className="panel__header">
              <div>
                <p className="eyebrow">行動端</p>
                <h2>行動端候選草稿檢視</h2>
                <p>
                  只檢視資料整理端送來的候選草稿與供應風險。這裡使用 mock
                  餐廳名稱，不代表真實店家承諾，也不會派工、下單或派送。
                </p>
              </div>
            </div>
            <div className="supply-summary" aria-label="便當供應摘要">
              <div>
                <span>示範可討論量</span>
                <strong>
                  {mockRestaurantCapacity.reduce(
                    (sum, restaurant) => sum + restaurant.capacity,
                    0,
                  )}{" "}
                  個
                </strong>
              </div>
              <div>
                <span>分配假設草稿</span>
                <strong>
                  {mockRestaurantCapacity.reduce(
                    (sum, restaurant) => sum + restaurant.assigned,
                    0,
                  )}{" "}
                  個
                </strong>
              </div>
              <div>
                <span>剩餘可討論量</span>
                <strong>
                  {mockRestaurantCapacity.reduce(
                    (sum, restaurant) =>
                      sum + restaurant.capacity - restaurant.assigned,
                    0,
                  )}{" "}
                  個
                </strong>
              </div>
            </div>

            {actionNotice ? (
              <p className="endpoint-notice" role="status">
                {actionNotice}
              </p>
            ) : null}

            <section className="task-claim-board" aria-label="候選草稿檢視">
              <div className="task-claim-board__header">
                <div>
                  <p className="eyebrow">行動端</p>
                  <h3>候選草稿檢視</h3>
                  <p>
                    這裡接收資料整理端送出的草稿，只能標記為已查看或願意討論，
                    不代表正式派工、救災優先順序或已確認資料。
                  </p>
                </div>
                <label>
                  查看角色（本機聲明，非授權）
                  <select
                    value={reviewerRole}
                    onChange={(event) => {
                      setReviewerRole(event.target.value);
                      setReviewerAcknowledged(false);
                    }}
                  >
                    <option value="">請選擇身份</option>
                    {identityOptions.map((identity) => (
                      <option key={identity.value} value={identity.value}>
                        {identity.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="task-claim-board__ack">
                <input
                  checked={reviewerAcknowledged}
                  type="checkbox"
                  onChange={(event) =>
                    setReviewerAcknowledged(event.target.checked)
                  }
                />
                我知道這只是候選草稿，不是正式派工、餐廳承諾、訂單或付款。
              </label>

              {actionTaskCandidates.length === 0 ? (
                <div className="task-claim-board__empty">
                  目前沒有可檢視的候選草稿。請先到資料整理端草稿區，選擇角色後送出候選草稿供討論。
                </div>
              ) : (
                <div className="task-claim-list">
                  {actionTaskCandidates.map((task) => (
                    <article className="task-claim-card" key={task.id}>
                      <div>
                        <span>{task.id}</span>
                        <strong>{task.title}</strong>
                      </div>
                      <p>{task.summary}</p>
                      <dl>
                        <div>
                          <dt>送出角色</dt>
                          <dd>{identityLabels[task.submittedBy]}</dd>
                        </div>
                        <div>
                          <dt>目前狀態</dt>
                          <dd>
                            {task.status === "review_marked" ? (
                              `已由${identityLabels[task.viewedBy ?? "volunteer"]}標記查看`
                            ) : (
                              <span className="task-status task-status--execution">
                                實行專案
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>安全邊界</dt>
                          <dd>
                            {task.unsafeToActDirectly
                              ? "不可直接行動"
                              : "仍需人工確認"}
                          </dd>
                        </div>
                      </dl>
                      <ul>
                        {(task.blockers.length > 0
                          ? task.blockers
                          : ["仍需補齊確認理由。"]
                        )
                          .slice(0, 3)
                          .map((blocker) => (
                            <li key={blocker}>{blocker}</li>
                          ))}
                      </ul>
                      <p className="task-claim-card__boundary">
                        非訂單、非承諾、非付款；只能作為下一步人工討論的線索。
                      </p>
                      {task.status === "review_marked" ? (
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => unmarkTaskCandidateViewed(task.id)}
                        >
                          取消查看標記
                        </button>
                      ) : (
                        <button
                          disabled={!reviewerRole || !reviewerAcknowledged}
                          type="button"
                          onClick={() => markTaskCandidateViewed(task.id)}
                        >
                          {reviewerRole === "restaurant"
                            ? "標記願意討論供應"
                            : "標記已查看草稿"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div
              className="supply-table"
              role="table"
              aria-label="餐廳便當分配"
            >
              <div role="row">
                <strong role="columnheader">示範餐廳</strong>
                <strong role="columnheader">示範可討論量</strong>
                <strong role="columnheader">分配假設草稿</strong>
                <strong role="columnheader">仍可討論</strong>
                <strong role="columnheader">餐別</strong>
                <strong role="columnheader">類型</strong>
                <strong role="columnheader">示範取餐時段</strong>
                <strong role="columnheader">確認狀態</strong>
              </div>
              {mockRestaurantCapacity.map((restaurant) => (
                <div role="row" key={restaurant.name}>
                  <span role="cell">{restaurant.name}</span>
                  <span role="cell">{restaurant.capacity} 個</span>
                  <span role="cell">{restaurant.assigned} 個</span>
                  <span role="cell">
                    {restaurant.capacity - restaurant.assigned} 個
                  </span>
                  <span role="cell">{restaurant.mealType}</span>
                  <span role="cell">{restaurant.bentoType}</span>
                  <span role="cell">{restaurant.pickupWindow}</span>
                  <span role="cell">{restaurant.status}</span>
                  <div className="supply-row-detail">
                    <p>
                      <strong>限制：</strong>
                      {restaurant.constraint}
                    </p>
                    <p>
                      <strong>建議動作：</strong>
                      {restaurant.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <section className="allocation-checklist" aria-label="分配檢核">
              <h3>分配前待確認</h3>
              <label>
                <input readOnly type="checkbox" />
                便當需求仍需由資料整理端人工確認
              </label>
              <label>
                <input readOnly type="checkbox" />
                餐廳供應量仍是示範草稿，不是訂單或承諾
              </label>
              <label>
                <input readOnly type="checkbox" />
                餐別、取餐時段、素食數量與負責窗口尚未完成確認
              </label>
            </section>

            <div className="endpoint-grid">
              <article>
                <span>分配前需要</span>
                <h3>確認供應意向</h3>
                <p>要先確認出餐時段、數量、餐別與聯絡窗口。</p>
              </article>
              <article>
                <span>不能顯示成</span>
                <h3>不能當成訂單</h3>
                <p>分配假設草稿不等於訂單成立，也不代表餐廳已接受。</p>
              </article>
              <article>
                <span>現在不做</span>
                <h3>配送付款流程</h3>
                <p>不產生路線、不付款、不通知餐廳或外部服務。</p>
              </article>
            </div>
          </section>
        ) : allRecords.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "dashboard" ? (
          <Phase0Dashboard
            records={allRecords}
            drafts={drafts}
            onSelect={selectForWorkbench}
            selectedRecordId={selectedRecordId}
            onPreviewSelect={setSelectedRecordId}
            onClassify={classifyRecord}
          />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={allRecords}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : (
          <Phase0Workbench
            records={allRecords}
            selectedRecordId={selectedRecordId}
            drafts={drafts}
            onSelect={setSelectedRecordId}
            onSaveDraft={saveDraft}
            onDeleteDraft={deleteDraft}
            onResetDraft={resetDraft}
            taskSubmitIdentities={identityOptions}
            onSubmitTaskCandidate={submitTaskCandidate}
          />
        )}
      </section>

      {humanGateOpen ? (
        <div className="human-gate" role="presentation">
          <section
            aria-labelledby="human-gate-title"
            aria-modal="true"
            className="human-gate__dialog"
            role="dialog"
          >
            <div className="human-gate__header">
              <p className="eyebrow">本機校準</p>
              <h2 id="human-gate-title">拼圖校準閱讀提醒</h2>
            </div>

            <div className="human-gate__puzzle" aria-hidden="true">
              <div className="human-gate__puzzle-board">
                <span className="human-gate__puzzle-target" />
                <span
                  className="human-gate__puzzle-piece"
                  style={{ left: `${humanGatePuzzleValue}%` }}
                />
              </div>
              <p>{humanGateSolved ? "校準完成" : "把拼圖移到右側缺口"}</p>
            </div>

            <label className="human-gate__slider">
              <span>
                <strong>我知道這些資料仍是未整理資料</strong>
                <small>將拼圖校準到右側，才可進入整理草稿區。</small>
              </span>
              <input
                aria-label="拼圖校準"
                max={100}
                min={0}
                type="range"
                value={humanGatePuzzleValue}
                onChange={(event) =>
                  setHumanGatePuzzleValue(Number(event.target.value))
                }
              />
            </label>

            <div className="human-gate__status">
              <span>{pendingWorkbenchRecordId ?? selectedRecordId}</span>
              <p>
                這一步只在本機確認使用意圖，沒有外部驗證或資料送出；勾選不代表任何資料已被查證。
              </p>
              <p>這也不是回報提交驗證，目前不接收新的真實回報。</p>
            </div>

            <div className="human-gate__actions">
              <button type="button" onClick={cancelHumanGate}>
                取消
              </button>
              <button
                disabled={!humanGateSolved}
                type="button"
                onClick={confirmHumanGate}
              >
                進入整理草稿區
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
