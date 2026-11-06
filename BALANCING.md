# Rich Simulator Balancing Guide

## Life scene systems

- `src/game/config/index.ts` sets `GAME_MONTH_SECONDS` to 60. At 1x, one game month is exactly 60 real seconds; pause, x2, and x4 are applied in `tick`.
- Earnings accumulate in `accruedMonthlyIncome`; cash changes only when `processGameMonth` runs payday, after which the same transaction deducts itemized bills.
- `src/data/courses.ts` contains enrollment costs, monthly tuition, retake fees, difficulty, duration in game months, prerequisites, and skill rewards. Runtime seconds are always derived from `durationMonths * GAME_MONTH_SECONDS`.
- Each course also declares minimum housing status, food-plan level, and vehicle status. Enrollment requires enough monthly surplus to cover tuition.
- `src/game/education.ts` controls study gain, exam success odds, and interview odds.
- `src/data/jobs.ts` controls salaries plus education, skill, prior-role experience, housing, food, and transport requirements; monthly experience is recorded by job id.
- `src/game/requirements.ts` is the single checklist evaluator. Add a new gate by composing requirement records rather than embedding bespoke lock logic in a screen.
- `src/data/lifeEvents.ts` contains the event archetypes, scene, dialogue, two choices, requirements, and outcomes. Four narrative variants per archetype currently produce 80 events. When health is below 55 or stress reaches 65, the selector strongly favors wellness issues such as burnout, migraines, anxiety, and sleep debt.
- `src/game/config/index.ts` owns the one-game-month offline cap. Online and offline income use the same income formulas; offline monthly bills use `monthlyBillsFor` and can run only once per absence.
- Starter balance: every new life begins with $0, no job, homeless housing, community meals, no health cover, walking, and therefore $0 in automatic monthly bills. The courier base salary is $450/month. The first-study requirements—shared room and budget groceries—cost $240/month, leaving a $210 monthly surplus before optional transport or health cover.

All tuning values are data-driven or isolated in pure formulas.

## Education and careers

- Course costs, durations, prerequisites, and skill rewards: `src/data/courses.ts`
- Job salaries, active-work bonuses, course gates, and skill gates: `src/data/jobs.ts`
- Promotion rate, energy cost, and stress gain: `workHard`, `processGameMonth`, and `tick` in `src/store/lifeStore.ts`.
- Active work grants 10 performance. A promotion requires 100 performance plus 3 additional months of experience per level, and promotion level is capped at 5.
- Salary gains 12.5% per promotion. Moving into a better career is therefore more valuable than repeatedly farming one entry-level job.
- Technology advances through Junior Developer, Mid-Level Developer, Senior Developer, and Technology Team Lead. Finance advances through Junior Accountant, Financial Analyst, Senior Financial Analyst, Finance Manager, and CFO. Each role after the first requires months in the previous role.

There is no free starter gig or automatic starting income. The player begins unemployed and must open Career and attend the Delivery Courier interview. The courier accepts the zero-cost starting lifestyle. Better work checks the living requirements declared on each job.

## Calendar, bills, and family

- One game month is `GAME_MONTH_SECONDS` in `src/game/config/index.ts` (60 seconds at 1x). Save migration normalizes older month lengths to this value.
- Housing prices, rent, utilities, upkeep, comfort, status, capacity, vehicle economics, food, and healthcare: `src/data/living.ts`.
- Consumer phones, laptops, timepieces, and paintings are configured in `src/data/goods.ts`; they give a one-time happiness gain and contribute only their configured resale value to net worth.
- Bill assembly, child age brackets, mortgage amortization, relationship gates, and divorce split: `src/game/lifeCosts.ts`.
- Mortgages use 20% down, 5.5% annual interest, and 360 months. Vehicle finance uses 15% down, 7% annual interest, and 60 months.
- A missed month adds a fixed 5% charge based on that month’s base bills. Late balances do not compound and are capped at two months of current bills; two consecutive misses downgrade housing and three can repossess a financed or leased vehicle.
- Starter living costs are chosen by the player instead of silently assigned. Education and better careers require progressively stronger housing, food, and transport choices. Later family, private-school, nanny, luxury-home, and luxury-vehicle choices increase monthly obligations.
- Bank credit requires six clean months in the current job. New loans use at least 18% APR, a 12-month term, a two-month salary principal ceiling, and a 25% total debt-payment-to-job-salary ceiling. Late bills or missed payments block new borrowing.

Character ethnicity, skin tone, and hairstyle are cosmetic and do not change money or skills. Keep reusable formulas in `src/game/lifeCosts.ts` so unit tests continue to document expected behavior.

## Companies

- Startup costs, base revenue, and employee wages: `src/data/companyTypes.ts`
- Net profit formula: `companyProfitPerSecond` in `src/store/lifeStore.ts`
- Employees add productivity but charge salary every second.
- Each marketing/equipment/location upgrade adds 20% output and doubles in price.
- Managers cost 1.5× startup cost. IPO requires level 5 and 60 reputation.
- Sale proceeds are 75% of valuation; an IPO sells 35% ownership and keeps 65%.

## Market

- Starting prices, sectors, volatility, and dividends: `src/data/marketAssets.ts`
- Random walk, trends, news frequency, and sector shocks: `src/game/marketEngine.ts`
- Broker fee: `BROKER_FEE` in `src/store/lifeStore.ts` (currently 0.5%).
- Prices tick every two seconds and retain 36 chart points.
- Dividends are evaluated once per minute for playable mobile pacing.
- Offline sessions advance at most two aggregated market ticks during the one-game-month cap.

## Casino

- Blackjack shoe/rules/payouts: `src/game/blackjack.ts`
- Roulette bet coverage and payouts: `src/game/roulette.ts`
- Horse ratings, form, odds, and payouts: `src/game/horseRacing.ts`
- Casino unlock threshold: `CasinoScreen.tsx` (currently $25K net worth).
- Default daily loss limit: `createInitialLifeState` (currently $5K).

The roulette wheel uses European single zero. Blackjack naturals return 2.5× the wager (stake plus 3:2 win). Horse odds include a 12% margin before place/show divisors.

## Idle, lifestyle, and prestige

- Offline cap: `OFFLINE_CAP_GAME_MONTHS` in `src/game/config/index.ts` (one 60-second game month).
- Offline job salary is separately capped at one monthly paycheck per absence. Business, partner, passive, and dividend income retain their existing capped-time calculations.
- Broker access requires $25K net worth; founding the first company requires $50K net worth. Both UI and store actions enforce the gates.
- Lifestyle prices, income bonuses, and upkeep: `src/data/shop.ts`.
- Prestige threshold: `floor(sqrt(lifetime earnings / 1,000,000))` in `src/game/formulas.ts`.
- Each Legacy Point adds 5% income.
- Retirement keeps completed courses, lifestyle trophies, achievements, settings, and 25% of skill points.

After balance changes, run:

```bash
npm test
npm run typecheck
npm run lint
npm run audit:jsx
```
