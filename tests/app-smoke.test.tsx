import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

function openWorkbenchWithHumanCheck() {
  fireEvent.click(screen.getByRole("button", { name: "整理草稿區" }));

  expect(
    screen.getByRole("dialog", { name: "進入前閱讀提醒" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "進入整理草稿區" })).toBeDisabled();

  fireEvent.click(screen.getByLabelText(/我知道這些資料仍是未整理資料/));
  fireEvent.click(screen.getByRole("button", { name: "進入整理草稿區" }));
}

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理草稿區")).toBeInTheDocument();
    expect(screen.getByText(/這不是新的災情回報表/)).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "整理儀表板" }),
    ).toBeInTheDocument();
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
