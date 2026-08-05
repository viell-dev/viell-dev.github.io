import { describe, expect, it } from "vitest";

import {
  applyTaskStates,
  contentHash,
  highlightCode,
  isMarkdownFile,
  parseTaskList,
  renderMarkdown,
} from "./gist";

/**
 * Exercises everything that has tripped or nearly tripped the checkbox
 * mapping: nesting, escapes, alternative markers, ordered lists, look-alike
 * text inside fences, and tasks inside footnote definitions.
 */
const trickyDocument = `# Checklist

- [x] Completed task
- [X] Uppercase completed task
- [ ] Incomplete task
- [ ] Parent task
  - [x] Completed child task
  - [ ] Incomplete child task
- [ ] \\(Optional) Escaped opening parenthesis
- [ ]Not a task (no space after bracket)
- [y] Not a task (invalid marker)

* [ ] Asterisk marker task

1. [ ] Ordered task
2. [x] Ordered completed task

Not tasks below:

\`\`\`markdown
- [ ] Task syntax inside a fence
\`\`\`

    - [ ] task syntax in an indented code block

A footnote.[^note]

[^note]: Definition containing a task list:
    - [ ] Task inside a footnote definition
`;

async function renderedCheckboxCount(content: string): Promise<{
  total: number;
  checked: number;
}> {
  const html = await renderMarkdown(content, { enableTaskCheckboxes: true });
  const boxes = html.match(/class="task-list-item-checkbox"[^>]*/g) ?? [];
  return {
    total: boxes.length,
    checked: boxes.filter((box) => box.includes("checked")).length,
  };
}

describe("parseTaskList", () => {
  it("matches the checkboxes renderMarkdown produces", async () => {
    const info = await parseTaskList(trickyDocument);
    const rendered = await renderedCheckboxCount(trickyDocument);
    expect(info.states).toHaveLength(rendered.total);
    expect(info.states.filter(Boolean)).toHaveLength(rendered.checked);
    expect(info.lines).toHaveLength(info.states.length);
  });

  it("reads states and source lines correctly", async () => {
    const info = await parseTaskList(trickyDocument);
    const lines = trickyDocument.split("\n");
    info.lines.forEach((line, index) => {
      expect(lines[line]).toMatch(info.states[index] ? /\[[xX]\]/ : /\[ \]/);
    });
    expect(info.states).toEqual([
      true,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it("skips fences, indented code, and malformed markers", async () => {
    const info = await parseTaskList(trickyDocument);
    const lines = trickyDocument.split("\n");
    for (const line of info.lines) {
      expect(lines[line]).not.toContain("inside a fence");
      expect(lines[line]).not.toContain("indented code block");
      expect(lines[line]).not.toContain("Not a task");
    }
  });

  it("finds tasks inside footnote definitions", async () => {
    const info = await parseTaskList(trickyDocument);
    const lines = trickyDocument.split("\n");
    const footnoteTask = info.lines.find((line) =>
      lines[line].includes("footnote definition"),
    );
    expect(footnoteTask).toBeDefined();
  });

  it("returns nothing for documents without tasks", async () => {
    const info = await parseTaskList("# Just a heading\n\n- a plain list\n");
    expect(info.states).toHaveLength(0);
  });
});

describe("applyTaskStates", () => {
  it("round-trips a full flip and back", async () => {
    const info = await parseTaskList(trickyDocument);
    const flipped = applyTaskStates(
      trickyDocument,
      info,
      info.states.map((state) => !state),
    );
    const reparsed = await parseTaskList(flipped);
    expect(reparsed.states).toEqual(info.states.map((state) => !state));

    // Restoring differs from the original only by [X] -> [x] normalisation.
    const restored = applyTaskStates(flipped, info, info.states);
    expect(restored).toBe(trickyDocument.replace("[X]", "[x]"));
  });

  it("only touches task-marker lines", async () => {
    const info = await parseTaskList(trickyDocument);
    const rewritten = applyTaskStates(
      trickyDocument,
      info,
      info.states.map(() => true),
    );
    const before = trickyDocument.split("\n");
    const after = rewritten.split("\n");
    after.forEach((line, index) => {
      if (line !== before[index]) {
        expect(info.lines).toContain(index);
      }
    });
  });

  it("preserves CRLF line endings", async () => {
    const crlf = "- [ ] one\r\n- [x] two\r\n";
    const info = await parseTaskList(crlf);
    expect(applyTaskStates(crlf, info, [true, false])).toBe(
      "- [x] one\r\n- [ ] two\r\n",
    );
  });

  it("ignores out-of-range lines and missing states", () => {
    const content = "- [ ] only\n";
    expect(
      applyTaskStates(content, { lines: [5, -1], states: [false, false] }, [
        true,
        true,
      ]),
    ).toBe(content);
    expect(applyTaskStates(content, { lines: [0], states: [false] }, [])).toBe(
      content,
    );
  });
});

describe("contentHash", () => {
  it("is stable and change-sensitive", () => {
    expect(contentHash(trickyDocument)).toBe(contentHash(trickyDocument));
    expect(contentHash(trickyDocument)).not.toBe(
      contentHash(`${trickyDocument} `),
    );
  });
});

describe("isMarkdownFile", () => {
  it("matches markdown extensions case-insensitively", () => {
    expect(isMarkdownFile("README.md")).toBe(true);
    expect(isMarkdownFile("notes.MARKDOWN")).toBe(true);
    expect(isMarkdownFile("script.ts")).toBe(false);
    expect(isMarkdownFile("md")).toBe(false);
  });
});

describe("renderMarkdown", () => {
  it("renders disabled checkboxes unless enabled", async () => {
    const html = await renderMarkdown("- [ ] task\n");
    expect(html).toContain("disabled");
    const enabled = await renderMarkdown("- [ ] task\n", {
      enableTaskCheckboxes: true,
    });
    expect(enabled).not.toContain("disabled");
  });

  it("escapes raw HTML in the source", async () => {
    const html = await renderMarkdown('<script>alert("x")</script>\n');
    expect(html).not.toContain("<script>");
  });

  it("highlights fences and namespaces footnotes by docId", async () => {
    const html = await renderMarkdown(
      "```ts\nconst a = 1;\n```\n\nRef.[^n]\n\n[^n]: note\n",
      { docId: "test-doc" },
    );
    expect(html).toContain('class="shiki');
    expect(html).toContain("fn-test-doc-1");
  });
});

describe("highlightCode", () => {
  it("highlights known extensions and content-sniffed XML", async () => {
    expect(await highlightCode("a.ts", "const a = 1;")).toContain(
      'class="shiki',
    );
    expect(await highlightCode("Money.CT", "<CheatTable/>")).toContain(
      'class="shiki',
    );
    expect(
      await highlightCode("no-extension", '<?xml version="1.0"?>'),
    ).toContain('class="shiki');
  });

  it("returns null for unknown languages", async () => {
    expect(await highlightCode("mystery.zzz", "???")).toBeNull();
    expect(await highlightCode("no-extension", "plain text")).toBeNull();
  });
});
