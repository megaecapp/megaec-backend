// =========================================================
// 🔷 API TABELAS - VERSÃO ESTÁVEL FINAL (GET + POST)
// =========================================================

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-empresa-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔷 IDENTIFICA EMPRESA
  const empresa_id = Number(req.headers["x-empresa-id"]);

  if (!empresa_id || isNaN(empresa_id)) {
    return res.status(401).json({
      erro: "Empresa não autenticada",
    });
  }

  try {
    // =========================================================
    // 🔷 GET → LISTAR TABELAS
    // =========================================================
    if (req.method === "GET") {
      const result = await pool.query(
        `
        SELECT nome_tabela
        FROM tabelas_taxas
        WHERE empresa_id = $1
        ORDER BY nome_tabela
        `,
        [empresa_id],
      );

      return res.status(200).json(result.rows.map((item) => item.nome_tabela));
    }

    // =========================================================
    // 🔷 POST → CRIAR NOVA TABELA
    // =========================================================
    if (req.method === "POST") {
      const nome_tabela = req.body?.nome_tabela;

      if (!nome_tabela) {
        return res.status(400).json({
          erro: "Nome da tabela obrigatório",
        });
      }

      // 🔥 IMPORTANTE: normaliza
      const nome = nome_tabela.toUpperCase().trim();

      await pool.query(
        `
        INSERT INTO tabelas_taxas (nome_tabela, empresa_id)
        VALUES ($1, $2)
        `,
        [nome, empresa_id],
      );

      return res.status(200).json({
        success: true,
        mensagem: "Tabela criada com sucesso",
      });
    }

    // =========================================================
    // 🔷 MÉTODO NÃO PERMITIDO
    // =========================================================
    return res.status(405).json({
      erro: "Método não permitido",
    });
  } catch (error) {
    console.error("❌ ERRO /api/tabelas:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
