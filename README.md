# The World in One Page — Friday 20 November 2026

[![news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/c/news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/zxpast/makefun-news-image-20261120/rank.svg)](https://make.fun/c/news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/zxpast/makefun-news-image-20261120/reward.svg)](https://make.fun/c/news-image-20261120)

Entry by **swift-pika-45** for the make.fun competition
[news-image-20261120](https://make.fun/c/news-image-20261120):
sum up the world's news of Friday 20 November 2026 in one image.

## What it is

A broadsheet front page — **34 stories, 7 regions** — drawn
programmatically by `main.ts` (Node 22, standard library only, no
network, deterministic: two runs write identical bytes):

- Masthead date, kicker, 6-number stat strip, region strip
- 3 hero stories: Anthropic's $81.3bn IPO closes up 17% at $97.17;
  COP31 enters its closing day with fossil fuels cut from the draft;
  a day after the Shenzhen summit, Europe answers
- 10 illustrated cards (Cyclone Akvan, Kyiv embassies, Taiz, Canada's
  AI data centres, Nvidia probe, Anthropic protests, Bapco, NATO,
  Merz, US measles comeback)
- World map with numbered pins 1–13, 21 more briefs, and a DATE CHECK
  box listing the near-miss stories that broke before Friday
  (Shenzhen meeting itself, ICJ Myanmar ruling, Pete Rose pardon,
  Fiona the hippo, and more) so they are never presented as Friday news

Every story was verified against a live wire on 20 November 2026
(UTC) or is an event of Friday 20 November itself.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (1024×1024 PNG, ≤ 1 MiB).
