import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getPlan, type Plan } from "@/lib/plans";

export type AppUser = {
  id: string;
  email: string;
  plan: Plan;
  planStatus: string;
};

// Pega o usuario logado (Supabase Auth) e garante a linha dele em `users`.
// Retorna null se nao tiver sessao.
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email ?? "";

  // Upsert: cria no primeiro acesso, mantem plano se ja existe.
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  let row = existing[0];
  if (!row) {
    const inserted = await db
      .insert(users)
      .values({ id: user.id, email })
      .onConflictDoNothing()
      .returning();
    row = inserted[0] ?? { id: user.id, email, plan: "free", planStatus: "active" } as typeof users.$inferSelect;
  }

  return {
    id: row.id,
    email: row.email,
    plan: getPlan(row.plan),
    planStatus: row.planStatus,
  };
}
