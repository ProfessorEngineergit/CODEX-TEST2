# OPUSBENCH — Claude Opus vs OpenAI Codex Benchmark Website

A fully interactive, skeuomorphic full-stack benchmark website built with **Three.js**, **Chart.js**, and vanilla JavaScript.

## What it does

- **Three.js neural-network background** — animated nodes and edges that respond to mouse movement
- **Skeuomorphic UI** — beveled panels, knobs, toggle switches, and metallic buttons
- **Interactive model selector** — radio-style toggles that update all charts and metrics live
- **Benchmark comparison table** — HumanEval, HumanEval+, MMLU, GSM8K, SWE-bench, context window, and more
- **Four interactive chart types** — Bar, Radar, Line (progress over time), and Bubble (context × quality)
- **Context window visualizer** — animated bars showing the 25× gap between Opus and Codex
- **"The Case" rant section** — data-driven argument for why GitHub Education should include Claude Opus
- **Live code demo** — side-by-side code comparison with typewriter animation and quality scores

## Running locally

Open `index.html` directly in any modern browser — no build step required.

All dependencies (Three.js r134, Chart.js 4.4) are loaded from CDN.

## Benchmark sources

- Anthropic Claude model cards (2024–2025)
- OpenAI technical reports and GPT-4 system card
- EvalPlus leaderboard (HumanEval+)
- SWE-bench.com
- Original Codex paper (Chen et al. 2021)
- HELM benchmark suite

