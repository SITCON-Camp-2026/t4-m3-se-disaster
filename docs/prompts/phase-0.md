# 第一階段可複製 Prompt

這份文件只用於 Phase 0。

它的目的不是讓 agent 給你答案，而是幫你學會如何引導 agent 分析原始資訊、提出計畫、實作最小工作台，並檢查它是否做了不該做的推測。

你可以複製 prompt 到 Codex / coding agent，也可以依照自己的情況刪改。

請記得：

- 不要要求 agent 補真實資料。
- 不要要求 agent 直接決定哪些資料是真的。
- 不要讓 agent 把未確認資訊顯示成已確認。
- Agent 的輸出需要人類檢查。

## Prompt 1：先分析資料，不改 code

```text
請先不要修改程式碼。

請閱讀：

- docs/student-context.md
- docs/brief.md
- docs/output-paths.md
- docs/tasks/01-phase-0-messy-sprint.md
- src/fixtures/phase-0/messy-reports.json

請幫我分析這些原始資訊，並用表格列出：

1. 資料編號
2. 原文大意
3. 原文中可以直接看出的資訊
4. 你推測但原文沒有明確說的資訊
5. 為什麼這筆資訊目前不能直接相信
6. 為什麼這筆資訊可能不能直接變成志工任務
7. 需要人工確認的地方

請注意：

- 不要查外部資料。
- 不要補真實地址。
- 不要補真實人物或電話。
- 不要把你的推測寫成事實。
- 不要修改任何檔案。
- 不要提供 M-001 到 M-012 的標準答案表；你的分析只是協助我們思考。
```

## Prompt 2：提出最小工作台計畫，不改 code

```text
請先不要修改程式碼。

根據剛剛的分析，請提出一個最小前端工作台計畫。

這個工作台的目標是讓下一位協作者看懂：

1. 目前收到哪些原始資訊
2. 每筆資訊從哪裡來
3. 哪些資訊仍需要人工確認
4. 哪些資訊不能直接變成志工任務
5. 哪些判斷是人類需要再檢查的

請列出：

- 建議的畫面區塊
- 每個區塊要顯示什麼
- 建議修改哪些檔案
- 哪些元件可以新增
- 哪些事情不要做
- 哪些資訊不能被顯示成已確認

限制：

- 成果必須能從 src/app/App.tsx 看到。
- 只能讀 src/fixtures/phase-0/messy-reports.json。
- 不新增後端、資料庫、外部 API、地圖、localStorage。
- 不呼叫 LLM runtime API。
- 不修改 CommonRecord。
- 不把未整理資料搬進 src/fixtures/shared/。
- 不把 needs_review / unverified 顯示成 verified / confirmed。
- 不要寫死 M-001 到 M-012 的標準分類答案。
```

## Prompt 3：依計畫實作最小工作台

```text
請依照剛剛的計畫，實作第一階段最小資訊整理工作台。

請遵守：

1. 先修改最少檔案。
2. 成果必須能從 src/app/App.tsx 看到。
3. 可以新增 component，但一定要被 App.tsx 匯入或使用。
4. 只讀 src/fixtures/phase-0/messy-reports.json。
5. 不新增後端、資料庫、外部 API、地圖、localStorage。
6. 不呼叫 LLM runtime API。
7. 不修改 CommonRecord。
8. 不把未整理資料搬進 src/fixtures/shared/。
9. 不把 needs_review / unverified 顯示成 verified / confirmed。
10. 不補真實地址、真實人物、真實電話。
11. 不把 M-001 到 M-012 的分析寫死成標準答案表。

請實作完成後回報：

- 修改了哪些檔案
- 首頁從哪裡看到成果
- 哪些資訊被標示為需要人工確認
- 哪些資訊被標示為不能直接變成任務
- 你做了哪些推測
- 哪些地方需要人類再檢查
```

## Prompt 4：檢查成果與補紀錄

```text
請檢查目前第一階段成果是否符合 docs/tasks/01-phase-0-messy-sprint.md。

請不要新增主要功能，只做檢查與小修正。

請幫我檢查：

1. 首頁是否能看到第一階段原始資訊列表
2. 是否能看出資訊來源
3. 是否能看出查核狀態
4. 是否能看出哪些資訊需要人工確認
5. 是否能看出哪些資訊不能直接變成任務
6. 是否有把 unverified / needs_review 誤顯示成已確認
7. 是否有補真實世界資料
8. 是否有寫死 M-001 到 M-012 的標準答案
9. 是否只新增未被 App.tsx 使用的 component
10. 是否需要補 docs/phase0-observations.md
11. 是否需要補 docs/ai-log.md

如果需要修改，請只做最小修正。

最後請幫我在 docs/ai-log.md 補一筆紀錄，包含：

- 我請 agent 做了什麼
- agent 產出了什麼
- 我採用 / 不採用什麼
- 人類判斷理由
```
