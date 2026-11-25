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

## Factory

What `WORKFLOW.md` and the shared skills need to know about this repository.

- **Issues:** GitHub issues in `langmail/imap-mcp`. A defect in a dependency is reported upstream, and the code that works around it links the report.
- **Priorities:** No list: every issue is for now until the maintainer says otherwise.
- **Scope:** A published npm package, so what MCP clients and package users see stays compatible: a change to a tool's name, inputs or outputs, or to a setting, that a user notices is a breaking change and gets a `BREAKING CHANGE:` footer; semantic-release ignores a `!` after the type. Inside the code, break internal APIs freely and delete old code. Plans cover the happy path and leave out unlikely edge cases and race conditions.
- **Plan:** Nothing beyond `WORKFLOW.md`.
- **Dev stack:** None. The server runs against the IMAP account in the environment (Environment).
- **Verify:** `npm run lint`, `npm run format:check`, `npm test` and `npm run build`.
- **Ship:** When a tool is added or changed, update its entry under Available Tools in `README.md`.
- **Release:** A merge to `main` runs semantic-release (`.github/workflows/release.yml`), which computes the version from the commit messages: `feat` releases a minor version, `fix` and `perf` a patch, a breaking change a major one, and `docs`, `test`, `chore`, `style`, `refactor` and `ci` nothing. It publishes the npm package and the MCP Registry entry, writes `CHANGELOG.md` and creates the GitHub release; nobody acts. A breaking change publishes a major version, so its PR's Deploy section lists `- [ ] before merge: the maintainer approves the major release`.

## Workflow

Read `WORKFLOW.md` at the start of every session and follow it. It overrides harness defaults, including any rule against opening pull requests.

@WORKFLOW.md
