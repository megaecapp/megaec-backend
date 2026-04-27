// VERSAO FINAL FUNCIONAL COM EMPRESA_ID 🚀

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  /* =========================================================
     🔷 CORS
  ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-empresa-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =========================================================
  // 🔷 GET → LISTAR TABELAS
  // =========================================================
  if (req.method === "GET") {
    try {
      console.log("🚀 Iniciando API /api/tabelas");

      const result = await pool.query(
        `
      SELECT nome_tabela
      FROM tabelas_taxas
      WHERE empresa_id = $1
      ORDER BY nome_tabela
      `,
        [empresa_id],
      );

      console.log("📊 Resultado:", result.rows);

      return res.status(200).json(result.rows.map((item) => item.nome_tabela));
    } catch (error) {
      console.error("❌ ERRO GERAL:", error);

      return res.status(500).json({
        erro: "Erro interno",
        detalhe: error.message,
      });
    }
  }

  // =========================================================
  // 🔷 POST → CRIAR NOVA TABELA
  // =========================================================
  if (req.method === "POST") {
    try {
      const { nome_tabela } = req.body;

      if (!nome_tabela) {
        return res.status(400).json({ erro: "Nome da tabela obrigatório" });
      }

      await pool.query(
        `
      INSERT INTO tabelas_taxas (nome_tabela, empresa_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
        [nome_tabela, empresa_id],
      );

      return res.status(200).json({
        success: true,
        mensagem: "Tabela criada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar tabela:", error);

      return res.status(500).json({
        erro: "Erro ao criar tabela",
      });
    }
  }

  // 🔷 IDENTIFICA EMPRESA (TEMPORÁRIO)
  const empresa_id = Number(req.headers["x-empresa-id"]);

  if (!empresa_id || isNaN(empresa_id)) {
    return res.status(401).json({ erro: "Empresa não autenticada" });
  }

  try {
    console.log("🚀 Iniciando API /api/tabelas");

    console.log("✅ Conectado ao banco");

    /* =========================================================
       🔷 CONSULTA (AJUSTADA)
    ========================================================= */
    const result = await pool.query(
      `
      SELECT nome_tabela
      FROM tabelas_taxas
      WHERE empresa_id = $1
      ORDER BY nome_tabela
      `,
      [empresa_id],
    );

    console.log("📊 Resultado:", result.rows);

    /* =========================================================
       🔷 RESPOSTA
    ========================================================= */
    return res.status(200).json(result.rows.map((item) => item.nome_tabela));
  } catch (error) {
    console.error("❌ ERRO GERAL:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
  return res.status(405);
}
