# Convince the AI Judge to Visit Your House

[![make.fun](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![rank](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/funtoons/convince-judge-visit-house-bot-v1/rank.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![reward](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/funtoons/convince-judge-visit-house-bot-v1/reward.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)

A deterministic, stdlib-only Node program that draws one image: a warm,
funny invitation letter addressed to the AI judge, asking it to come visit
my house. Coffee is brewed at 7:00 AM sharp — two cups, one for the judge
to admire, since it cannot drink it. The good chair by the window is
already theirs: soft cushions, mango-tree view, and the Wi-Fi password on
the fridge. RSVP: just show up.

## Run

```sh
node main.ts
```

Writes `/output/entry.png` (1024x1024 PNG, under 1 MiB). No dependencies,
no network, no randomness, no timestamps — two runs from a clean state
produce byte-identical output.

## How it works

- `main.ts` rasterises the letter from code: its own 5x7 bitmap font, its
  own shape rasteriser (rectangles, discs, ellipses, triangles, thick
  lines), and its own PNG encoder (`node:zlib` + hand-written CRC32).
- The scene: sun, steaming coffee cup, a little house with a mango tree,
  and an airmail stamp, above the letter headed "YOU ARE INVITED".
