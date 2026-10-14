/**
 * Minimal chainable fake of the supabase-js client for route-handler tests.
 * Every builder method returns the builder; awaiting it (or calling single/maybeSingle)
 * resolves to the result configured for that table. No network.
 */
export type Result = { data?: unknown; error?: unknown; count?: number | null };

export type FakeState = {
  users: Record<string, string>; // bearer token -> user id
  members: Array<{ project_id: string; user_id: string }>;
  tables: Record<string, Result>;
  calls: Array<{ table: string; op: string; args: unknown[] }>;
};

export function createFakeState(): FakeState {
  return { users: {}, members: [], tables: {}, calls: [] };
}

export function fakeClient(state: FakeState) {
  return {
    auth: {
      async getUser(token: string) {
        const id = state.users[token];
        return id ? { data: { user: { id } }, error: null } : { data: { user: null }, error: { message: "invalid" } };
      },
    },
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const resolve = (): Result => {
        if (table === "project_members") {
          const hit = state.members.find((m) => m.project_id === filters.project_id && m.user_id === filters.user_id);
          return { data: hit ?? null, error: null };
        }
        return state.tables[table] ?? { data: [], error: null };
      };
      const builder: Record<string, unknown> = {};
      for (const op of ["select", "insert", "update", "delete", "order", "limit", "gte", "lte", "lt", "in", "upsert"]) {
        builder[op] = (...args: unknown[]) => { state.calls.push({ table, op, args }); return builder; };
      }
      builder.eq = (col: string, value: unknown) => { filters[col] = value; state.calls.push({ table, op: "eq", args: [col, value] }); return builder; };
      builder.single = async () => resolve();
      builder.maybeSingle = async () => resolve();
      builder.then = (ok: (r: Result) => unknown, err?: (e: unknown) => unknown) => Promise.resolve(resolve()).then(ok, err);
      return builder;
    },
  };
}
