# imap-mcp

MCP server exposing IMAP operations as tools for AI assistants.

## Tech Stack

- TypeScript, ESM, compiled with `tsc` to `dist/`.
- ESLint (`npm run lint`) and Prettier (`npm run format:check`) for `src/`; husky runs lint-staged on commit.
- Vitest for tests (`npm test`), semantic-release for publishing.

## Layout

- `src/index.ts`: server entry; wires up `StdioServerTransport` and registers the tools.
- `src/tools/<tool>.ts`: one file per MCP tool, with a `*.test.ts` next to it.

## Environment

The server reads `IMAP_HOST`, `IMAP_PORT`, `IMAP_USERNAME`, `IMAP_PASSWORD` and `IMAP_USE_SSL` from the environment, or from a `.env` file through `dotenv`.

## Before pushing

Run `npm run lint`, `npm run format:check`, `npm test` and `npm run build`; CI runs the same checks.
