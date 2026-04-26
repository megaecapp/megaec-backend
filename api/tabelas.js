// =========================================================
// 🔷 API TABELAS (VERSÃO FINAL SEGURA)
// =========================================================

const { Pool } = require("pg");

// 🔐 conexão padrão (Vercel / Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = async function handler(req, res) {
  /* =========================================================
     🔷 CORS
  ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-empresa-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  // 🔐 EMPRESA VIA HEADER (SEGURO)
  const empresa_id = Number(req.headers.empresa_id);

  if (!empresa_id || isNaN(empresa_id)) {
    return res.status(401).json({ erro: "Empresa não autenticada" });
  }

  try {
    console.log("🚀 Iniciando API /api/tabelas");
    console.log("🏢 Empresa:", empresa_id);

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
};
