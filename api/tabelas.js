// VERSAO NOVA TESTE 123

/* =========================================================
   🔷 API TABELAS - LISTAR TABELAS (VERSÃO DEBUG)
   ========================================================= */

import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  /* 🔷 CORS */
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
    /* 🔥 DEBUG */
    console.log("Iniciando API tabelas");

    const DATABASE_URL =
      "postgresql://neondb_owner:npg_hw1zCItW4GMd@ep-royal-bar-aml4z1ek-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

    if (!DATABASE_URL) {
      console.error("DATABASE_URL não encontrada");
      return res.status(500).json({ erro: "Sem conexão com banco" });
    }

    const sql = neon(DATABASE_URL);

    console.log("Conectado ao banco");

    const resultado = await sql`
      SELECT nome_tabela, tipo
      FROM tabelas_taxas
      ORDER BY nome_tabela
    `;

    console.log("Resultado:", resultado);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("ERRO GERAL:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
