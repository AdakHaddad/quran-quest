# HifzOS

HifzOS is a memorization operating system for Qur'an retention.

It is built around discipline, recall, review, retention, understanding, and consistency.

## Core Problem

Most hifz tools optimize for reading more.
HifzOS optimizes for forgetting less.

It targets:
- weak daily consistency
- forgetting old memorization
- confusion between similar ayat
- passive reading without recall
- weak morning discipline

## Product Goal

Every day the app should answer:
1. What should I memorize today?
2. What should I review today?
3. Which ayat are becoming weak?
4. What must I fix before sleeping?

## Current Repository Direction (Version 1)

This repository now prioritizes V1 HifzOS behavior:
- recite-to-dismiss alarm workflow (mockable)
- blank recall engine
- weak ayah tracker
- repeat-to-hear flow
- daily review planner

## Architecture Summary

The Next.js app remains the runtime foundation.

Domain modules are organized in `/lib/hifzos`:
- `types.ts` — core data model
- `storage.ts` — persistence boundaries
- `mission-planner.ts` — daily mission planning
- `review-priority.ts` — review ranking formula
- `weak-ayah-tracker.ts` — weakness scoring updates
- `recall-engine.ts` — blank recall prompt + validation
- `repeat-to-hear.ts` — repeat/listen flow model
- `feature-flags.ts` — staged rollout controls
- `ayah-catalog.ts` — seed ayah references for V1 flow

## Docs

See `/docs` for product and system framing:
- philosophy
- daily framework
- review system
- blank recall engine
- similarity grouping
- weak ayah system
- image hints
- meaning layer
- speech validation
- roadmap
- research notes

## Roadmap Phasing

### Version 1 (implemented direction)
Core discipline loop only.

### Version 2 (flagged/deferred)
- similarity grouping
- image hint recall
- meaning layer
- mushaf position hint
- spaced repetition upgrades

### Version 3 (deferred)
- teacher mode
- parent mode
- halaqah groups
- progress dashboard expansion

## Local Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run build
```
