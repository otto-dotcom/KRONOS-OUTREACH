/**
 * Structured logger for KRONOS dashboard.
 * Outputs JSON lines to stdout — readable in Vercel function logs.
 * copyedit events are used to review and improve the copy agent system prompt.
 */

function ts() {
  return new Date().toISOString();
}

export const log = {
  info(event: string, data?: Record<string, unknown>) {
    console.log(JSON.stringify({ ts: ts(), level: "info", event, ...data }));
  },

  error(event: string, err: unknown, data?: Record<string, unknown>) {
    console.error(
      JSON.stringify({
        ts: ts(),
        level: "error",
        event,
        error: err instanceof Error ? err.message : String(err),
        ...data,
      })
    );
  },

  api(route: string, method: string, data?: Record<string, unknown>) {
    console.log(
      JSON.stringify({ ts: ts(), level: "info", event: "api_call", route, method, ...data })
    );
  },

  /** Log when a user manually edits a generated email field */
  edit(
    recordId: string,
    company: string,
    field: "subject" | "body",
    original: string,
    edited: string
  ) {
    console.log(
      JSON.stringify({
        ts: ts(),
        level: "copyedit",
        event: "email_edited",
        recordId,
        company,
        field,
        original: original.slice(0, 300),
        edited: edited.slice(0, 300),
      })
    );
  },

  /** Log when a user requests email regeneration */
  regen(recordId: string, company: string, mode: "standard" | "plain") {
    console.log(
      JSON.stringify({
        ts: ts(),
        level: "copyedit",
        event: "email_regenerated",
        recordId,
        company,
        mode,
      })
    );
  },

  /** Log each email send with edit metadata */
  sent(
    recordId: string,
    company: string,
    toEmail: string,
    wasEdited: boolean,
    wasRegenerated: boolean
  ) {
    console.log(
      JSON.stringify({
        ts: ts(),
        level: "info",
        event: "email_sent",
        recordId,
        company,
        toEmail,
        wasEdited,
        wasRegenerated,
      })
    );
  },
};
