import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
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
      screen.getByRole("button", { name: "預覽資料" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
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
    expect(screen.getByText("優先人工確認")).toBeInTheDocument();
    expect(screen.getByText(/這不是救災優先順序/)).toBeInTheDocument();
    expect(screen.getByText(/本機規則式分析/)).toBeInTheDocument();
    expect(screen.getAllByText("12 / 12").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /M-001/ })).toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
    expect(screen.queryByText("外部 AI 分析匯入")).not.toBeInTheDocument();
    expect(screen.getByText("判斷追溯")).toBeInTheDocument();
    expect(screen.getByText("原文可見")).toBeInTheDocument();
    expect(screen.getByText("候選判斷")).toBeInTheDocument();
    expect(screen.getByText("仍有缺口")).toBeInTheDocument();
    expect(screen.getByText("誤用風險")).toBeInTheDocument();
    expect(screen.getByText("流程檢核")).toBeInTheDocument();
    expect(screen.getByText("1. 查看來源與原文")).toBeInTheDocument();
    expect(screen.getByText("2. 判斷來源與內容是否清楚")).toBeInTheDocument();
    expect(screen.getByText("3. 判斷是否能形成候選資訊")).toBeInTheDocument();
    expect(screen.getByText("4. 標註驗證狀態與不確定性")).toBeInTheDocument();
    expect(screen.getByText("5. 留下判斷理由與來源")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "標示需要人工確認" }),
    ).toBeInTheDocument();
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.queryByText("尚未建立整理草稿")).not.toBeInTheDocument();
    expect(screen.queryByText("決策引導")).not.toBeInTheDocument();
    expect(screen.queryByText("不要直接變成任務")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });
});
