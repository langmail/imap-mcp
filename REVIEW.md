# Review instructions

What matters in this repository. The review format, and what no review
reports, are in the prompt of langmail/factory's `review.yml`.

## What Important means here

Reserve Important for findings that would break behavior for an MCP
client or a mailbox: incorrect logic, mail written to the wrong folder or
account, headers or bodies that mail clients would show garbled,
credentials or message content in log lines or error messages, and tool
names, inputs, or outputs that change without a breaking-change commit.

## Always check

- A tool's description still matches what its handler does
- A new tool in `src/tools/` has a `*.test.ts` next to it
