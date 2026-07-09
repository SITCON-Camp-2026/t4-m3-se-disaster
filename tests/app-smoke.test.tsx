import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

function openWorkbenchWithHumanCheck() {
  fireEvent.click(screen.getByRole("button", { name: "整理草稿區" }));

  expect(
    screen.getByRole("dialog", { name: "拼圖校準閱讀提醒" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "進入整理草稿區" })).toBeDisabled();

  fireEvent.change(screen.getByLabelText("拼圖校準"), {
    target: { value: "96" },
  });
  expect(screen.getByText("校準完成")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "進入整理草稿區" }));
}

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊協作原型")).toBeInTheDocument();
    expect(screen.getByText(/這不是新的災情回報表/)).toBeInTheDocument();
    expect(screen.getByText("責任邊界")).toBeInTheDocument();
    expect(
      screen.getByText("不判定真偽、不核准任務、不派工"),
    ).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "整理儀表板" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /資料整理端/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /回報端/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /行動端/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理草稿區" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "預覽資料" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("switches to bento reporter and actor endpoints without enabling real actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /回報端/ }));

    expect(
      screen.getByRole("heading", { name: "便當需求回報網站原型" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("誰需要便當")).toBeInTheDocument();
    expect(screen.getByLabelText("需要數量")).toBeInTheDocument();
    expect(screen.getByLabelText("餐別")).toBeInTheDocument();
    expect(screen.getByText("填寫需求")).toBeInTheDocument();
    expect(screen.getByText("本機暫存")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "暫存成待確認草稿" }));
    expect(
      screen.getByText(/已暫存成待確認草稿：BENTO-001/),
    ).toBeInTheDocument();
    expect(screen.getByText(/請不要據此通知餐廳/)).toBeInTheDocument();
    expect(screen.getByText("未整理便當需求")).toBeInTheDocument();
    expect(screen.getByText("真實訂購送出")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "整理儀表板" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^資料整理端/ }));
    expect(screen.getByText("BENTO-001 的確認缺口")).toBeInTheDocument();
    expect(screen.getAllByText(/便當需求回報草稿/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /行動端/ }));

    expect(
      screen.getByRole("heading", { name: "行動端候選草稿檢視" }),
    ).toBeInTheDocument();
    expect(screen.getByText("示範餐廳 A")).toBeInTheDocument();
    expect(screen.getAllByText("示範可討論量").length).toBeGreaterThan(0);
    expect(screen.getByText("示範取餐時段")).toBeInTheDocument();
    expect(screen.getByText("待電話確認")).toBeInTheDocument();
    expect(screen.getByText("分配前待確認")).toBeInTheDocument();
    expect(screen.getByText(/素食數量不可直接推估/)).toBeInTheDocument();
    expect(screen.getByText("不能當成訂單")).toBeInTheDocument();
    expect(screen.getByText("配送付款流程")).toBeInTheDocument();
  });

  it("shows organizer visualizations on the default screen", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "整理儀表板" }),
    ).toBeInTheDocument();
    expect(screen.getByText("查核狀態分布")).toBeInTheDocument();
    expect(screen.getByText("資料風險熱度圖")).toBeInTheDocument();
    expect(screen.getByText("資訊取得方式")).toBeInTheDocument();
    expect(screen.getByText("候選整理狀態")).toBeInTheDocument();
    expect(screen.getByText("建議先檢查：M-001")).toBeInTheDocument();
    expect(screen.getByText("最需要補資料")).toBeInTheDocument();
    expect(screen.getByText("整理預覽")).toBeInTheDocument();
    expect(screen.getByText("未分類")).toBeInTheDocument();
    expect(screen.getByText("簡略草稿")).toBeInTheDocument();
    expect(screen.getByText("M-001 的確認缺口")).toBeInTheDocument();
    expect(screen.getByText(/深色只代表確認缺口多/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "看預覽" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看選取資料的整理草稿" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/這不是救災優先順序/)).toBeInTheDocument();
    expect(screen.getByText(/本機規則式分析/)).toBeInTheDocument();
    expect(screen.getAllByText("12 / 12").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /M-001/ }).length).toBe(2);

    fireEvent.click(screen.getByRole("button", { name: "查看缺口" }));
    expect(screen.getByText(/缺口檢視：M-001/)).toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    openWorkbenchWithHumanCheck();

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
    expect(
      screen.getByText("不是派工畫面，也不是回報入口。"),
    ).toBeInTheDocument();
    expect(screen.getByText("目前不能直接變成任務，因為")).toBeInTheDocument();
    expect(screen.queryByText("外部 AI 分析匯入")).not.toBeInTheDocument();
    expect(screen.getByText("判斷追溯")).toBeInTheDocument();
    expect(screen.getByText("原文可見")).toBeInTheDocument();
    expect(screen.getByText("候選判斷")).toBeInTheDocument();
    expect(screen.getByText("仍有缺口")).toBeInTheDocument();
    expect(screen.getByText("誤用風險")).toBeInTheDocument();
    expect(screen.getByText("流程檢核")).toBeInTheDocument();
    expect(screen.getByText("轉送前檢核")).toBeInTheDocument();
    expect(screen.queryByText("資料轉運站流程")).not.toBeInTheDocument();
    expect(screen.getByText("可能重複")).toBeInTheDocument();
    expect(screen.getByText("來源可追溯")).toBeInTheDocument();
    expect(screen.getByText("訊息清楚")).toBeInTheDocument();
    expect(screen.getByText("1. 查看來源、原文與時間")).toBeInTheDocument();
    expect(screen.getByText("2. 檢查是否可能重複上傳")).toBeInTheDocument();
    expect(screen.getByText("3. 檢查來源是否可追溯")).toBeInTheDocument();
    expect(screen.getByText("4. 檢查訊息是否清楚")).toBeInTheDocument();
    expect(screen.getByText("5. 判斷是否足夠形成候選資訊")).toBeInTheDocument();
    expect(screen.getByText("6. 留下判斷紀錄")).toBeInTheDocument();
    expect(screen.getByText("輸出給下一位協作者檢查")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/標示可能重複/).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/暫存可疑來源/).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/留下補問問題/).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/需要人工確認/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/流程標記用來表示這筆資料卡在哪一站/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "標示可能重複" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("草稿編輯：M-001")).toBeInTheDocument();
    expect(screen.getByText("快速套用組件")).toBeInTheDocument();
    expect(screen.getByLabelText(/重複上傳檢核/)).toBeInTheDocument();
    expect(screen.getByLabelText(/可疑來源檢核/)).toBeInTheDocument();
    expect(screen.getByLabelText(/模糊訊息補問/)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/候選但不可行動/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("button", { name: "重複上傳檢核" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("信心程度範圍")).toBeInTheDocument();
    expect(screen.getByText("佐證快速選擇")).toBeInTheDocument();
    expect(screen.getByText("卡住點快速選擇")).toBeInTheDocument();
    expect(screen.getByLabelText("人工審核備註模板")).toBeInTheDocument();
    expect(screen.getByText("可能是需求線索（不可派工）")).toBeInTheDocument();
    expect(screen.queryByText("任務候選（不可派工）")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("佐證 (一行一條)")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("卡住的地方 (一行一條)"),
    ).not.toBeInTheDocument();
  });

  it("sends a draft to the actor endpoint and marks it as reviewed", () => {
    render(<App />);

    openWorkbenchWithHumanCheck();

    expect(
      screen.getByRole("heading", { name: "送出候選草稿供討論" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "送出候選草稿供討論" }),
    ).toBeDisabled();
    expect(screen.getByText("已保留卡住點")).toBeInTheDocument();
    expect(screen.getByText("仍標示不可直接行動")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("角色聲明（本機下拉，非驗證）"), {
      target: { value: "organizer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送出候選草稿供討論" }));

    expect(
      screen.getByText(/已建立行動端候選草稿檢視：CAND-001/),
    ).toBeInTheDocument();
    expect(screen.getByText("候選草稿檢視")).toBeInTheDocument();
    expect(screen.getByText("CAND-001")).toBeInTheDocument();
    expect(screen.getByText("實行專案")).toHaveClass("task-status--execution");
    expect(screen.getAllByText(/不可直接行動/).length).toBeGreaterThan(0);
    expect(screen.getByText(/非訂單、非承諾、非付款/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("查看角色（本機聲明，非授權）"), {
      target: { value: "volunteer" },
    });
    expect(
      screen.getByRole("button", { name: "標記已查看草稿" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/我知道這只是候選草稿/));
    fireEvent.click(screen.getByRole("button", { name: "標記已查看草稿" }));

    expect(
      screen.getByText(/已由志工標記查看 CAND-001 的候選草稿/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消查看標記" })).toBeEnabled();
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    openWorkbenchWithHumanCheck();

    expect(screen.queryByText("尚未建立整理草稿")).not.toBeInTheDocument();
    expect(screen.queryByText("決策引導")).not.toBeInTheDocument();
    expect(screen.queryByText("不要直接變成任務")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });
});
