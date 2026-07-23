---
title: Portfolio
---

# Portfolio

I always have multiple projects in the works, but I only publish the ones I consider
feature-complete: a project gets cleaned up and polished before it goes public. So this list is
short on purpose - these are the released ones, with more on the way. You can find me on:

- **GitHub**: [viell-dev](https://github.com/viell-dev)
- **Codeberg**: [viell](https://codeberg.org/viell), with my more serious work under the
  [Devious Concepts](https://codeberg.org/Devious-Concepts) namespace

## strata-reader

A dependency-free Rust crate, published on [crates.io](https://crates.io/crates/strata-reader) with
source on [Codeberg](https://codeberg.org/Devious-Concepts/strata-reader).

It's a dynamically buffered reader in almost entirely safe Rust, extending the `std::io::BufReader`
concept with automatic buffer growth, explicit memory control, and consumed-data lookbehind. It
handles UTF-8-aware delimiter scanning across read boundaries, and is covered by unit tests plus
runnable doctests on essentially every public method, all under a strict Clippy lint posture.

I wrote it by hand as a deliberate learn-the-fundamentals exercise (std only, zero dependencies),
using coding agents as reviewers. It's also the first building block of Strata, an in-progress
parser project of mine that aims to preserve human-authored intent in parsed output.

## Swedish Red Days

A TypeScript Cloudflare Worker serving a subscribable iCal calendar of Swedish public holidays
("röda dagar"). It's [live on Cloudflare](https://swedish-red-days.me-cloudflare-447.workers.dev/)
and the source is on [GitHub](https://github.com/viell-dev/swedish-red-days).

The holidays follow Swedish law exactly, including the 2005 change where National Day replaced Whit
Monday: every year the calendar emits uses the holiday rules that were legally in force that year.
Easter is calculated with the anonymous Gregorian computus, and events carry stable UIDs so
subscriptions don't duplicate on refresh. This one is effectively final: it only needs to change if
Swedish holiday law does.

The holiday date math is mine, ported from calculations I originally wrote by hand for a work
project; the Worker plumbing around it was agent-assisted.

<small>Last updated: July 2026</small>
