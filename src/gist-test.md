---
title: Gist test
sidebar: false
---

# Gist test

Temporary page for manually testing the `GistFile` component. Not linked from anywhere.

## Plain text (no extension)

<GistFile id="edc98075cd1d1caa3ad93b094dd88860" file="en_SE" />

## Cheat table (XML-ish, `.CT`)

<GistFile id="403b3a9b6b52156e5d65a13279d7f637" file="X4 9.0 Linux Money.CT" />

## Markdown

<GistFile id="da307e64d58e55d7c709a9ba7d066e78" file="TEST.md" />

## Checklist mode (mutable checkboxes, persisted)

<GistFile id="da307e64d58e55d7c709a9ba7d066e78" file="TEST.md" persistent />

## Expanded by default

<GistFile id="edc98075cd1d1caa3ad93b094dd88860" file="en_SE" expanded />

## Missing file (error state)

<GistFile id="edc98075cd1d1caa3ad93b094dd88860" file="does-not-exist.txt" />

## Bad gist id (error state)

<GistFile id="0000000000000000000000000000dead" file="nope.txt" />
