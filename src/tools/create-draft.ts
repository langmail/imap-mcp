import Imap from "imap"
import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerCreateDraft(client: Imap, server: McpServer) {
  server.tool(
    "create-draft",
    "Creates a draft email message",
    {
      to: z.string(),
      subject: z.string(),
      body: z.string(),
      from: z.string().optional(),
    },
    async ({ to, subject, body, from }) => {
      return new Promise((resolve, reject) => {
        client.once("ready", () => {
          client.getBoxes((err, boxes) => {
            const draftsPath = err ? undefined : findDraftsFolder(boxes)
            if (draftsPath) {
              client.openBox(draftsPath, false, (err) => {
                if (err) {
                  reject(
                    new Error(`Failed to open drafts folder: ${err.message}`),
                  )
                  return
                }
                createDraftMessage()
              })
              return
            }
            openFallbackDraftsFolder()
          })

          function openFallbackDraftsFolder() {
            client.openBox("INBOX.Drafts", false, (err) => {
              if (err) {
                // Try opening "Drafts" folder instead
                client.openBox("Drafts", false, (err2) => {
                  if (err2) {
                    reject(
                      new Error(
                        `Failed to open drafts folder: ${err2.message}`,
                      ),
                    )
                    return
                  }
                  createDraftMessage()
                })
                return
              }
              createDraftMessage()
            })
          }

          function createDraftMessage() {
            const message = [
              `From: ${from || process.env.IMAP_USERNAME || ""}`,
              `To: ${to}`,
              `Subject: ${subject}`,
              "",
              body,
            ].join("\r\n")

            client.append(message, { flags: ["\\Draft"] }, (err) => {
              if (err) {
                reject(new Error(`Failed to create draft: ${err.message}`))
                return
              }
              resolve({
                content: [
                  {
                    type: "text",
                    text: `Draft created successfully for ${to}`,
                  },
                ],
              })
            })
          }
        })

        client.once("error", (err: Error) => {
          reject(new Error(`IMAP connection error: ${err.message}`))
        })

        client.connect()
      })
    },
  )
}

/**
 * Returns the full path of the folder the server marks with the `\Drafts`
 * special-use attribute (RFC 6154), or undefined if none is marked.
 */
export function findDraftsFolder(
  boxes: Imap.MailBoxes,
  parents: string[] = [],
): string | undefined {
  for (const [name, box] of Object.entries(boxes)) {
    const segments = [...parents, name]
    if (box.attribs?.some((a) => a.toLowerCase() === "\\drafts")) {
      // A parent the server doesn't list has no delimiter of its own, so join
      // with the matched folder's, the server's one hierarchy separator.
      return segments.join(box.delimiter ?? "")
    }
    if (box.children) {
      const found = findDraftsFolder(box.children, segments)
      if (found) return found
    }
  }
  return undefined
}
