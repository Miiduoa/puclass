# PUClass

課表不是只要「塞得進去」就好。這個小工具把課程時段、衝堂與一週負荷放在同一個檢查流程裡，讓選課前可以先看出風險。

目前刻意維持成無框架版本：核心邏輯只有 JavaScript，測試使用 Node 內建 test runner。重點放在規則是否清楚、輸入能不能被驗證，而不是先做一個很重的前端。

## 可以做什麼

- 找出同一天真正重疊的課程時段
- 統計每一天與整週上課時數
- 用課堂時數加上作業 / 專題 / 考試，估一個簡單的週壓力分數
- CLI 輸出 JSON，之後可以接網頁或行動版

## 執行

```bash
npm test
npm start
```

`npm start` 會讀 `sample/courses.json`。若有衝堂，CLI 會回傳非 0 exit code，方便之後接 CI 或其他系統。

## 資料格式

```json
{
  "courses": [
    {
      "code": "IM301",
      "name": "Data Analytics",
      "meetings": [{"day": "Mon", "start": "09:10", "end": "11:00"}]
    }
  ],
  "assignments": [
    {"title": "Midterm", "kind": "exam"}
  ]
}
```

`day` 使用 `Mon` 到 `Sun`；`kind` 目前接受一般文字，但 `exam`、`project` 會有較高權重。

## 我在這個 repo 練的東西

這不是學校正式選課系統，也沒有宣稱能取代校務系統。它主要在練三件事：把生活裡很常見的問題轉成資料結構、把規則寫成可測試的函式、以及先把核心做穩再決定 UI。

## 結構

```text
src/planner.js      核心規則
src/cli.js          CLI 入口
sample/courses.json 範例資料
test/               Node 內建測試
.github/workflows/  GitHub Actions
```
