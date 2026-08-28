---
title: "Trading RL: Paper Trading with Reinforcement Learning"
date: "2026-04-28"
tags: ["Reinforcement Learning", "PPO", "CoreML", "SwiftUI"]
summary: "A PPO agent to size positions in SPY, aiming to match the index's return with a better Sharpe ratio by stepping aside during drawdowns."
pinned: false
coverImage: "/projects/trading-rl/tabular_hero.jpg"
---

## The problem

I often get really scared to start investing, since you know you gotta put your money and all. At first I didn't really know how to start with learning the basics of trading, where are the source, how do I even trade? But then I read that you can train an agent to trade using reinforcement learning. SO might as well learn both (That's the gist of the project really).

I picked a target that I think is probable enough. **Match SPY's return, beat SPY's Sharpe ratio by going to cash during drawdowns.** Not outperform on return. The realistic edge for a retail-scale RL agent is not predicting tops, it is avoiding the worst 20% of bear days. That is a narrower claim, and it is falsifiable.

The system is a PPO agent that outputs a single continuous number: what fraction of the portfolio to hold in the asset, from 0 (all cash) to 1 (fully long). It trains on daily OHLCV bars in a custom Gymnasium environment, gets evaluated walk-forward, then exports to CoreML and runs on-device in a SwiftUI iOS app for paper trading.

I built this to learn RL on a problem where the reward function is genuinely contested. In a game, the score is the score. In trading, choosing what to reward *is* the entire modelling problem, and I wanted to feel that rather than read about it.

## Key learnings and technical outcomes

- Built an end-to-end RL pipeline: data ingestion, feature engineering, a custom Gymnasium environment, PPO training via Stable-Baselines3, Optuna hyperparameter search, and walk-forward validation.
- Implemented walk-forward evaluation with per-fold scaler fitting, which is what turned an encouraging result into an honest negative one.
- Exported a PyTorch policy network to CoreML and reimplemented the entire feature pipeline in Swift for on-device inference.
- Learned to read action entropy as the primary training diagnostic, and to distinguish reward-function failures from feature failures before adding model capacity.
- Learned both trading strategies and reainforcement learning.

## Key considerations and trade-offs

- **Long-only, allocation in [0, 1].** No shorting.
- **Daily bars only.** No intraday, no order book, no news.
- **Sharpe-based reward** rather than benchmark-relative.
- **Single asset at a time.** SPY for training; QQQ and IWM used as generalization tests with no retraining.
- **On-device inference.** No server, no brokerage integration, paper trading only.

## Why long-only

Shorting was the first thing I cut, and it was not a difficulty decision.

Short positions have an asymmetric payoff, the gain is capped at 100% and the loss is unbounded. They carry borrow costs and recall risk that my simulator has no way to model, so a backtest containing shorts would be measuring a world that does not exist. And structurally, shorting fights SPY's roughly 9%/yr upward drift, which means a long-short agent has to be right considerably more often just to break even against a long-only one. Simply put I don't understand it and the I'd rather the model do what I understand. TL;DR it's a bit too complicated to design the model to do position sizing from -1 to 1.

## The environment

The agent sees a 10-dimensional observation: eight market features plus two channels the environment injects. (These features are selected from hyper param tuning)

| # | Feature | What it measures |
| --- | --- | --- |
| 1 | `sma_ratio` | close / SMA-20 — short-term trend |
| 2 | `rsi_14` | RSI, Wilder EWM — momentum exhaustion |
| 3 | `macd_hist` | MACD histogram / close — trend acceleration |
| 4 | `obv_ret` | On-Balance Volume 1-day change — volume confirmation |
| 5 | `adx` | Average Directional Index — trend strength |
| 6 | `drawdown_60d` | close / 60-day max − 1 — depth from recent peak |
| 7 | `vol_regime` | vol_20d / vol_60d — is volatility expanding? |
| 8 | `ret_20d` | 20-day return |
| 9 | `position` | current allocation (env-injected) |
| 10 | `equity_return` | portfolio value / initial cash − 1 (env-injected) |

Every feature is deliberately **scale-free**: a ratio, a bounded oscillator, or a percentage change. Raw prices and raw volumes do not transfer between assets, and I wanted a policy trained on SPY to be runnable on QQQ without retraining. Features 6 and 7 exist specifically for the stated goal: they are the two channels that describe *regime* rather than direction.

An episode is 252 trading days (that's the active trading days in a year) from a random start inside the split. Transaction cost is 0.1% of trade size and slippage is 5 basis points, both charged against portfolio value on every reallocation.

One detail took me longer to find than it should have. The reward divides by rolling 20-day volatility, and when the agent sits in cash its returns are all zero, so that denominator collapses toward zero and the reward explodes. I floored the volatility estimate at 0.3% daily. Without the floor, the optimal policy is to hold cash until the denominator is tiny and then take one enormous swing, the agent had found this and I mistook it for a bug in my logging.

## Choosing what to reward

This is where the project actually lived.

The reward is a per-step Sharpe contribution with a turnover penalty:

```
reward = (r_t − rf) / σ_t  −  (cost + slippage) · |Δposition| / σ_t
```

The penalty is divided by σ so it lives in the same units as the signal, a large rebalance in a calm market is penalized more than the same rebalance in a violent one, which is the correct incentive.

The problem is subtler and it is the finding I care most about. **Per-step Sharpe rewards risk-adjusted return, and "always fully long" scores well on it.** SPY has a positive Sharpe over almost any long window. An agent that learns to be perpetually 100% invested is not failing at this objective, it is *succeeding* at it. My reward function and my stated goal were different objectives, and I optimized the wrong one for the entire project.

What I should have used is benchmark-relative:

```
reward = (portfolio_return − spy_return) / tracking_error
```

Under this, "always long" earns approximately zero gross and slightly negative net after costs. Going to cash on a −3% SPY day earns +3%. It is a direct signal for the exact behaviour I said I wanted. I designed this replacement, wrote it into the roadmap, and did not get to training under it.

## Making the evaluation honest

My first evaluation was a single train/test split, and it looked good enough that I got suspicious.

A single 252-day episode with a random start has enormous variance. Draw a start date in early 2023 and the agent looks brilliant; draw one in early 2022 and the same policy looks broken. I was reading skill off a die roll.

So I built walk-forward validation instead. For each test year, it trains a completely fresh PPO agent on every year before it, fits a **new feature scaler on that fold's training data only**, and evaluates on the held-out year. Nothing about the future, not even the mean and standard deviation used for normalization, leaks backward. Then it repeats for the next year with an expanding window.

Fitting the scaler per fold matters more than it sounds. In my first version the scaler was fit once on the full history, which meant the 2018 model was normalizing its inputs using statistics that included the 2020 crash. That is a small leak, and it was worth about 0.2 Sharpe of illusory performance.

## Results

Eight walk-forward folds, a fresh agent trained for each, evaluated against buy-and-hold on the same year.

| Test year | Agent return | Agent Sharpe | B&H return | B&H Sharpe | ΔSharpe | Avg position |
| --- | --- | --- | --- | --- | --- | --- |
| 2018 | +0.95% | +0.14 | −5.25% | −0.23 | **+0.37** | 0.50 |
| 2019 | +13.72% | +1.28 | +31.09% | +2.24 | −0.95 | 0.70 |
| 2020 | +4.72% | +0.31 | +17.24% | +0.64 | −0.34 | 0.55 |
| 2021 | 0.00% | 0.00 | +30.51% | +2.14 | −2.14 | **0.00** |
| 2022 | −13.34% | −0.48 | −18.65% | −0.74 | **+0.26** | 0.96 |
| 2023 | +23.62% | +2.04 | +26.71% | +1.90 | **+0.14** | 0.81 |
| 2024 | +18.98% | +1.65 | +25.59% | +1.89 | −0.23 | 0.71 |
| 2025 | +10.24% | +0.62 | +18.89% | +1.00 | −0.38 | 0.85 |
| **Mean** | **+7.36%** | **+0.70** | **+15.77%** | **+1.10** | **−0.41** | — |

**The agent lost.** Mean Sharpe 0.70 against buy-and-hold's 1.10, winning 3 folds out of 8. It did not meet its goal.

But the *shape* of the failure is the interesting part, and it is not noise.

**The agent won both bear years.** In 2018 it returned +0.95% while SPY lost 5.25%, and in 2022 it lost 13.34% against SPY's 18.65%. Those are the two years in the sample where the index fell, and they are two of its three wins. The risk-off behaviour I was trying to teach is measurably present.

**It lost the bull years by being underinvested.** Average position sits between 0.50 and 0.85 in most folds. In a year like 2019 or 2021, any allocation below 1.0 is pure cost. The agent is paying an insurance premium every year and collecting on it roughly once every four.

**2021 is the most instructive fold.** The agent held 0.00 for the entire year which is completely flat, in one of the strongest bull markets in the sample, forgoing a 30.51% return. That is not a mediocre policy, it is a *collapsed* one: the model found a local optimum where holding zero is safe, and under a Sharpe-based reward with a turnover penalty, doing nothing is genuinely defensible. Zero return divided by zero volatility is not punished the way a loss is. My reward function permitted this, and one fold out of eight fell into it.

Generalization to other assets, using the SPY-trained model with no retraining:

| Asset | Agent return | Agent Sharpe | B&H Sharpe | Drawdown improvement |
| --- | --- | --- | --- | --- |
| SPY | +19.26% | 1.31 | 1.94 | +1.63% |
| QQQ | +5.51% | 0.35 | 1.51 | +6.91% |
| IWM | +10.91% | 0.62 | 0.79 | +10.61% |

The consistent pattern across all three: **the agent reliably reduces drawdown and reliably gives up more return than the drawdown reduction is worth.** On IWM it cut the max drawdown by 10.6 percentage points — genuinely substantial — and still lost on Sharpe. It learned the defensive half of the objective and never learned when to stop being defensive.

## Shipping it to a phone

The trained policy exports to CoreML and runs on-device in a SwiftUI app. The export takes only the actor path, `policy_net → action_net → clamp(0,1)` and discards the value head, since inference only needs an allocation.

The hard part was not the conversion. It was that **iOS has no pandas**, so the entire feature pipeline had to be reimplemented in Swift, by hand, matching the Python `ta` library's conventions exactly, including Wilder's EWM smoothing in RSI and ADX, and MACD's 12/26/9 signal line. A subtly different RSI does not throw an error. It produces a plausible number, which gets z-scored into a plausible observation, which produces a confident and wrong allocation. There is no runtime check anywhere in the chain that would catch it.

This is also why the scaler is exported as JSON alongside the model and copied into the app bundle. Re-running feature engineering regenerates those normalization statistics, and an old scaler in the bundle produces a systematically shifted view of the world. The retrain-to-app path is a checklist, and skipping the scaler copy is the failure I hit most often.

The app fetches 400 calendar days of bars to guarantee the 61 trading days that `drawdown_60d` and `vol_regime` need, computes the observation, runs inference, and shows a recommended allocation the user can apply.

## What didn't work

**Per-step Sharpe as the objective.** Discussed above and it is the root cause of most of what follows. I chose it because it was the standard, defensible thing and I could explain it. I did not check whether it actually rewarded the behaviour I claimed to want. It doesn't.

**A policy collapse I initially misread as a bug.** When the agent went flat for an entire fold, my first instinct was to look for an error in the environment. There was none — the policy had converged to a constant. The diagnostic that would have told me immediately is action entropy in the training logs, which I was not watching. The rule I now use: if the policy is constant, it is a reward or exploration problem; if it varies but underperforms, it is a features or data problem. Adding network capacity fixes neither, and that is where I spent time first.

**Only asset-internal features.** All eight inputs are derived from the asset's own price and volume. But bear markets are called by macro conditions — VIX, the 10Y−2Y term structure slope, credit spreads, distance from the 200-day MA. The agent is being asked to detect regime change using only information that lags regime change. I designed a macro feature set and never integrated it.

**Not enough bear market to learn from.** Training on 2010 onward gives roughly three meaningful drawdowns. Risk-off behaviour is the thing I most wanted the agent to learn, and it is the thing with the fewest examples in the data. SPY history goes back to 1993, which would roughly triple the bear examples by adding the dot-com crash and 2008. I scoped the data before I understood which examples were scarce.

**A double-charged turnover penalty.** The environment subtracts costs from the return before passing it to a reward function that subtracts costs again internally. So turnover is penalized twice, in two different unit systems. I found this while documenting the code rather than while writing it, and it plausibly contributes to the agent's under-trading.

## What I'd do differently

Switch the reward to benchmark-relative first, before anything else. Every other improvement is downstream of optimizing the objective I actually stated.

Then, in order: extend the data back to 1993 and sample multiple ETFs per episode so the agent sees more than three bear markets; add the macro feature block, since regime detection with only asset-internal features is asking the model to do something the inputs do not support; and watch action entropy from the first training run rather than discovering a collapsed policy in a validation table.

I would also run the exploratory analysis before the training, not after. The question "does any of these features have predictive rank-correlation with next-day returns, conditional on regime?" tells you the ceiling before you spend compute reaching for it. I trained first and asked that question second, which is backwards.

The broader lesson is about evaluation. The version of this project with a single train/test split showed a result I would have been happy to publish. Walk-forward validation turned it into a negative result. The negative result is the real one, and the only reason I have it is that I built the harness that could produce it. It is worth more to me than the encouraging number would have been.

---
![Poster_main](/projects/trading-rl/tabular_poster.png)
![Poster_terms](/projects/trading-rl/tabular_terms.png)

**Repository:** [github.com/ChronoStellar/Trading_RL](https://github.com/ChronoStellar/Trading_RL)