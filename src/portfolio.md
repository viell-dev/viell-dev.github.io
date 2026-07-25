---
title: Portfolio
---

# Portfolio

I always have multiple projects in the works, but I only publish the ones I consider
feature-complete: a project gets cleaned up and polished before it goes public. So this list is
short on purpose - these are the released ones, with more on the way. You can find me on:

- **Codeberg**: [viell](https://codeberg.org/viell), with my more serious work under the
  [Devious Concepts](https://codeberg.org/Devious-Concepts) namespace
- **GitHub**: [viell-dev](https://github.com/viell-dev)

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
Monday: for every year it emits, the calendar uses the holiday rules that were legally in force
that year.
Easter is calculated with the anonymous Gregorian computus, and events carry stable UIDs so
subscriptions don't duplicate on refresh. This one is effectively final: it only needs to change if
Swedish holiday law does.

The holiday date math is mine, ported from calculations I originally wrote by hand for a work
project; the Worker plumbing around it was agent-assisted.

## Archived

There's also a decade of older, pre-AI work. Most of it no longer matters, but a few pieces are
still worth a mention. These repos are archived on GitHub and Codeberg and won't change again.

::: details Older projects (2013 - 2018)

### mb_trim

Userland `mb_trim`, `mb_ltrim` and `mb_rtrim` functions for PHP 5.4, written in 2013.
PHP had no multibyte-aware trim back then; native versions only arrived in PHP 8.4, over a decade
later. They work like the regular trim functions but accept an encoding parameter like other `mb_`
functions. I wrote them for my own use, but being MIT-licensed and a single drop-in file, they
later ended up running in production in software I maintained professionally. An unfinished,
configurable PHP 5.6 rework from 2015 lives on a branch.
[GitHub](https://github.com/viell-dev/mb_trim.php) -
[Codeberg](https://codeberg.org/viell/mb_trim)

### tnebot

A Ruby bot I started in 2014 for a Nintendo forum I was part of. It ran on a schedule
on a VPS, read the forum's RSS feed, tweeted new entries, and cached what it had already posted in
SQLite to prevent double-posting. Last touched in early 2015.
[GitHub](https://github.com/viell-dev/tnebot.rb) -
[Codeberg](https://codeberg.org/viell/tnebot)

### zf3-hashids

A Zend Framework 3 module for the PHP Hashids library: a fork of the
unmaintained ZF2 module that I updated for ZF3 in 2018 while upgrading the same production
software `mb_trim` ran in, adding a view helper and hex encode/decode support along the way.
[GitHub](https://github.com/viell-dev/zf3-hashids) -
[Codeberg](https://codeberg.org/viell/zf3-hashids)

:::

<small>Last updated: July 2026</small>
