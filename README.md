# PUClass · Schedule Feasibility Engine

選課不只是在檢查「時間有沒有撞到」。

兩堂課表面上沒有重疊，但如果上一堂在 A 棟 10:00 下課、下一堂在另一棟 10:05 上課，這張課表實際上仍然不可行。PUClass 現在把這種 **時間、移動與負荷限制** 放進同一個可測試的 domain core。

## 這版處理的問題

- 課程時間直接衝突
- 跨校舍移動時間不足
- 來得及走到，但沒有緩衝的 tight transition
- 未提供移動時間資料的 unknown transition
- 每日／每週上課負荷
- 同一門課有多個 section 時，從所有組合中找出較可行的版本
- 將最後課表輸出成可匯入行事曆的 `.ics`

這不是學校正式選課系統；校舍移動分鐘數也不是官方資料。重點是把「一張課表到底能不能真的照著走」寫成清楚、可驗證的規則。

## Quick start

```bash
npm test

node src/cli.js sample/courses.json --ics schedule.ics
node src/cli.js sample/choices.json
```

如果存在直接衝堂或不可能完成的跨棟移動，CLI 會回傳非 0 exit code。

## Feasibility flow

```text
course / section choices
        ↓
normalize meetings
        ↓
time-overlap check
        +
building travel check
        ↓
hard violations / tight transitions
        ↓
daily load + idle-time penalty
        ↓
best feasible section set
        ↓
JSON summary + ICS export
```

## Travel constraints

`travelMinutes` 用簡單 matrix 表示：

```json
{
  "Main": {
    "RenYuan": 12
  }
}
```

若兩堂課中間只有 5 分鐘、移動需要 12 分鐘，狀態是 `impossible`。

若中間剛好 12 分鐘，雖然理論上走得到，但預設還要求 5 分鐘 buffer，所以會標成 `tight`。

如果沒有提供兩棟之間的資料，PUClass 不會猜一個時間，而是標成 `unknown`。

## Section optimizer

`sample/choices.json` 可以替每門課放入多個 section。PUClass 會枚舉組合並用透明規則排序：

1. 直接衝堂是最高成本
2. 不可能完成的跨棟移動
3. tight transition
4. unknown transition
5. 最忙一天的上課分鐘數
6. 課間空檔

這不是大型 constraint solver。預設最多評估 5,000 種組合，超過就直接拒絕，避免用暴力搜尋假裝可以處理任意規模。

## Calendar export

```bash
node src/cli.js sample/courses.json --ics schedule.ics
```

輸出：

- `TZID=Asia/Taipei`
- 每週重複
- 預設 18 週
- 課名、代碼、section、上課地點

可以再把 `.ics` 匯入 Apple Calendar、Google Calendar 或其他支援 iCalendar 的行事曆。

## Project structure

```text
src/
  planner.js      time / travel / workload rules
  optimizer.js    alternative section search
  ics.js          iCalendar export
  cli.js
sample/
  courses.json
  choices.json
test/
.github/workflows/ci.yml
```

## Scope

這個 repo 刻意把 UI 放到後面。現在先把課表的 domain rules 做到：

- deterministic
- dependency-light
- testable
- 可被 Web / Mobile / 校園 Super App 直接引用

如果未來要擴大，再接正式課程 API、真實校舍步行時間、選課容量與先修規則會比較合理，而不是先做一個漂亮但規則空洞的畫面。
