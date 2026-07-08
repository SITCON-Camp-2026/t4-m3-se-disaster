# Testing

測試不是為了追求覆蓋率，而是為了把完成條件、資料格式與 Phase 0 安全邊界變成可驗證的成果。

## Required checks

- [ ] fixture validation
- [ ] one component or app smoke test
- [ ] one uncertainty or review-state test

## Commands

```bash
pnpm validate:data
pnpm test
pnpm check
```

## 完成條件（AC）對應測試

| 完成條件 | Test / manual check |
| -------- | ------------------- |
| AC-01    |                     |
| AC-02    |                     |
| AC-03    |                     |
| AC-04    |                     |

## Notes

- Phase 0 原始資訊來自 `src/fixtures/phase-0/`。
- 不確定資訊不能顯示成 confirmed / verified。
- 新增 UI 時，測試應確認 GitHub Pages 首頁看得到核心成果。
