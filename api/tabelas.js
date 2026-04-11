// VERSAO FINAL FUNCIONAL 🚀

import pkg from "pg";
const { Client } = pkg;

export default async function handler(req, res) {
  /* =========================================================
     🔷 CORS
  ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    console.log("🚀 Iniciando API /api/tabelas");

    /* =========================================================
       🔷 CONEXÃO COM BANCO (NEON)
    ========================================================= */
    const DATABASE_URL =
      "postgresql://neondb_owner:npg_hw1zCItW4GMd@ep-royal-bar-aml4z1ek-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();
    console.log("✅ Conectado ao banco");

    /* =========================================================
       🔷 CONSULTA
    ========================================================= */
    const result = await client.query(`
      SELECT nome_tabela, tipo
      FROM tabelas_taxas
      ORDER BY nome_tabela
    `);

    console.log("📊 Resultado:", result.rows);

    await client.end();

    /* =========================================================
       🔷 RESPOSTA
    ========================================================= */
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ ERRO GERAL:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
