# AI Log

這份紀錄用來留下小組如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有對話，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助分析原始資訊。
- AI 協助找出不能判斷處。
- AI 協助判斷哪些資訊不能直接相信。
- AI 協助判斷哪些資訊不能直接變成任務。
- AI 協助修改畫面標示或前端工作台。
- AI 可能補了原文沒有的資訊。
- AI 建議被小組拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實

## 不需要記錄

- 不需要逐字貼完整對話
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間 | 階段 | 任務 | AI / Agent 建議 | 採用 / 拒絕 | 人類判斷理由 | 相關檔案 / commit |
| ---- | ---- | ---- | --------------- | ----------- | ------------ | ----------------- |
|      |      |      |                 |             |              |                   |

## 範例

| 時間  | 階段    | 任務         | AI / Agent 建議                        | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | ------- | ------------ | -------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0 | 分析原始資訊 | 建議把社群貼文直接轉成 verified report | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |
| 2026-07-09 09:49 | Phase 0 | 分析並摘要 Phase 0 必讀文件與原始資料 | 列出每筆資料可見欄位、不可確定之處、並建議在 UI 保持 `needs_review`/`unverified` 標示 | 採用 | 保守處理，不補真實資料；將需要人工確認的欄位標示供後續人工核實 | `docs/phase0-observations.md`, `src/fixtures/phase-0/messy-reports.json` |
| 2026-07-09 09:54 | Phase 0 | 實作最小工作台草稿功能 | 在工作台新增草稿建立/編輯/重設/刪除的 UI（僅存在於 client state），並在側欄顯示草稿標示與草稿數量 | 採用 | 讓小組能在不改動原始檔案下嘗試整理草稿與審核流程 | `src/features/phase-0/Phase0Editor.tsx`, `src/features/phase-0/Phase0Workbench.tsx` |
| 2026-07-09 10:00 | Phase 0 | 預先建立示範草稿 | 為加速示範與達成 sprint 要求，預先在工作台初始化 6 筆保守草稿（前 2 筆為需要人類質疑的候選） | 採用 | 方便小組快速檢視草稿流程與完成第一階段檢查，草稿僅存在 UI state，無寫回 fixtures | `src/features/phase-0/Phase0Workbench.tsx` |
| 2026-07-09 10:05 | Phase 0 | 標註示範草稿為需人類質疑 | 將初始化的前 2 筆草稿分別標記為 `confidence: low/medium`、加入 `blockers` 與 `humanReviewNote`，並將 `suggestedNextStep` 設為 `send_to_human_review` 以示範人類質疑流程 | 採用 | 讓學生在打開工作台時立即看到需要人工核實的範例，方便教學演示 | `src/features/phase-0/Phase0Workbench.tsx` |
| 2026-07-09 13:45 | Release 01 | 啟動使用者訪談階段 | 將 Release 01 `01-interview-kit` 的訪談模板複製到 `docs/`，準備填寫 `docs/interview-notes.md`、`docs/interview-summary.md`、`docs/decisions.md` | 採用 | 這個階段是需求分析，不會修改 `src/`；先把訪談文件放到正確位置，才能按指引進行訪談與決策 | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md` |
| 2026-07-09 14:10 | Release 01 | 產生三個 persona 的使用者回饋草稿 | 根據 `subagent-interview` prompt 與各 persona 模板生成三種觀點的回饋，並寫入 `docs/interview-notes.md` | 採用 | 這些回饋為初稿，後續需要人類檢查、修改與補充；保持 `docs/` 文件為主作業區 | `docs/interview-notes.md`, `docs/ai-log.md` |
| 2026-07-09 14:25 | Release 02 | 撰寫流程設計初稿 | 建立 `docs/flow.md`，說明 v1 優先服務資訊整理者的原始資訊整理流程與人工確認點 | 採用 | 這是 Release 02 的流程設計階段，先把流程說清楚再進行實作 | `docs/flow.md`, `docs/ai-log.md` |

## 課後反思

### AI 幫助最大的地方

-

### AI 最容易誤導的地方

-

### 下次使用 AI 開發前，我們會先準備

-
