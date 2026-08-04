import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";

// Usuarios. O id espelha o uid do Supabase Auth (nao geramos aqui).
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Supabase Auth user id
  email: text("email").notNull(),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro' | 'business'
  planStatus: text("plan_status").notNull().default("active"), // 'active' | 'past_due' | 'canceled'
  periodEnd: timestamp("period_end", { withTimezone: true }), // fim do ciclo pago (null no free)
  gatewayCustomerId: text("gateway_customer_id"), // Fase 3
  gatewaySubscriptionId: text("gateway_subscription_id"), // Fase 3
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contador agregado: 1 linha por usuario por mes. Base da TRAVA.
// Vira o mes -> nova linha -> reset natural.
export const usageCounters = pgTable(
  "usage_counters",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // 'YYYY-MM'
    searchesCount: integer("searches_count").notNull().default(0),
    leadsExtracted: integer("leads_extracted").notNull().default(0),
    exportsCount: integer("exports_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.period] })],
);

// Historico de buscas (feature de plano pago).
export const searches = pgTable("searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // 'places' | 'mercadolivre'
  query: text("query").notNull(),
  location: text("location"),
  resultCount: integer("result_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// LOG DE TUDO (append-only). Cada acao vira um evento: busca, enrich, export.
// A trava le o usage_counters; este log e pra auditoria/relatorio/custo.
export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(), // 'search' | 'enrich' | 'export'
  source: text("source"), // 'places' | 'mercadolivre' | null
  quantity: integer("quantity").notNull().default(1), // ex: nº de leads no enrich
  meta: jsonb("meta"), // query, location, plano no momento, etc
  ip: text("ip"), // pra demo anonimo / anti-abuso
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Log de webhook do gateway (Fase 3, auditoria da cobranca).
export const billingEvents = pgTable("billing_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  type: text("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contador de demo anonimo por IP por dia (anti-abuso do hero da LP).
export const anonUsage = pgTable(
  "anon_usage",
  {
    ip: text("ip").notNull(),
    day: text("day").notNull(), // 'YYYY-MM-DD'
    searchesCount: integer("searches_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.ip, t.day] })],
);
