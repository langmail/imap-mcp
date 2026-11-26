import { describe, expect, test, vi } from "vitest"
import type Imap from "imap"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerCreateDraft } from "./create-draft.js"

type Handler = (args: {
  to: string
  subject: string
  body: string
  from?: string
}) => Promise<{ content: { type: string; text: string }[] }>

function box(
  attribs: string[],
  children: Imap.MailBoxes | null = null,
): Imap.Folder {
  return {
    attribs,
    delimiter: "/",
    children: children as Imap.MailBoxes,
    parent: null as never,
  }
}

function setup(boxes: Imap.MailBoxes, existing: string[]) {
  const listeners: Record<string, (...args: unknown[]) => void> = {}
  let openedBox: string | undefined
  const client = {
    once: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners[event] = cb
    }),
    connect: vi.fn(() => listeners.ready()),
    getBoxes: vi.fn((cb: (err: Error | null, b: Imap.MailBoxes) => void) =>
      cb(null, boxes),
    ),
    openBox: vi.fn(
      (name: string, _readOnly: boolean, cb: (err: Error | null) => void) => {
        if (existing.includes(name)) {
          openedBox = name
          cb(null)
        } else {
          cb(new Error(`Mailbox doesn't exist: ${name}`))
        }
      },
    ),
    append: vi.fn((_msg: string, _opts: unknown, cb: (err: null) => void) =>
      cb(null),
    ),
  }
  let handler: Handler | undefined
  const server = {
    tool: vi.fn((...args: unknown[]) => {
      handler = args[args.length - 1] as Handler
    }),
  }
  registerCreateDraft(client as unknown as Imap, server as unknown as McpServer)
  const run = () =>
    handler!({ to: "jane@example.com", subject: "Hi", body: "Hello" })
  return { client, run, openedBox: () => openedBox }
}

describe("create-draft", () => {
  test("saves to the folder marked \\Drafts, whatever its name and nesting", async () => {
    const { client, run, openedBox } = setup(
      {
        INBOX: box(["\\HasNoChildren"]),
        "[Gmail]": box(["\\Noselect", "\\HasChildren"], {
          "All Mail": box(["\\All"]),
          Entwürfe: box(["\\HasNoChildren", "\\Drafts"]),
        }),
        Drafts: box([]),
      },
      ["[Gmail]/Entwürfe", "Drafts"],
    )

    const result = await run()

    expect(openedBox()).toBe("[Gmail]/Entwürfe")
    expect(client.append).toHaveBeenCalledOnce()
    expect(result.content[0].text).toBe(
      "Draft created successfully for jane@example.com",
    )
  })

  test("falls back to INBOX.Drafts or Drafts when no folder is marked \\Drafts", async () => {
    const { client, run, openedBox } = setup(
      { INBOX: box([]), Drafts: box([]) },
      ["Drafts"],
    )

    await run()

    expect(client.openBox.mock.calls.map((c) => c[0])).toEqual([
      "INBOX.Drafts",
      "Drafts",
    ])
    expect(openedBox()).toBe("Drafts")
    expect(client.append).toHaveBeenCalledOnce()
  })

  test("fails when no drafts folder can be opened", async () => {
    const { client, run } = setup({ INBOX: box([]) }, [])

    await expect(run()).rejects.toThrow("Failed to open drafts folder")
    expect(client.append).not.toHaveBeenCalled()
  })
})
