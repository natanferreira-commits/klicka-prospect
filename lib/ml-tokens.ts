import { promises as fs } from "fs";
import path from "path";

// Token store simples em arquivo local. Serve pro uso do Klicka Prospect
// rodando na maquina do time. O arquivo fica no .gitignore e guarda o
// access_token (curta duracao) + refresh_token (rotativo) do Mercado Livre.
// Em producao serverless (Vercel) trocar por um KV, mas pro fluxo local
// de prospeccao isso resolve.

export type MLTokens = {
  accessToken: string;
  refreshToken: string;
  // epoch em ms de quando o access_token expira
  expiresAt: number;
};

const TOKEN_FILE = path.join(process.cwd(), ".ml-tokens.json");

export async function readTokens(): Promise<MLTokens | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<MLTokens>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function writeTokens(tokens: MLTokens): Promise<void> {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

export async function clearTokens(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch {
    // se nao existe, tudo bem
  }
}
