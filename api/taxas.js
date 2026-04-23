// =====================================
// 🔷 IMPORTAÇÃO POSTGRES
// =====================================
import { Pool } from "pg";

// =====================================
// 🔷 CONEXÃO COM BANCO
// =====================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// =====================================
// 🔷 FUNÇÃO PRINCIPAL
// =====================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔷 IDENTIFICA EMPRESA (TEMPORÁRIO)
  const empresa_id = req.query.empresa_id || 1;

  // =====================================
  // 🔷 GET - BUSCAR TAXAS
  // =====================================
  if (req.method === "GET") {
    try {
      const tabela = String(req.query.tabela || "").trim();

      if (!tabela) {
        return res.status(400).json({ erro: "Tabela não informada" });
      }

      const result = await pool.query(
        `
        SELECT t.*, tt.tipo
        FROM taxas t
        JOIN tabelas_taxas tt ON tt.nome_tabela = t.tabela_nome
        WHERE t.tabela_nome = $1
        AND tt.empresa_id = $2
        ORDER BY
          CASE
            WHEN modalidade = 'pix' THEN 0
            WHEN modalidade = 'debito' THEN 1
            ELSE CAST(REPLACE(modalidade, 'x', '') AS INTEGER)
          END
        `,
        [tabela, empresa_id],
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("💥 ERRO GET:", error);
      return res.status(500).json({
        erro: "Erro ao buscar taxas",
        detalhe: error.message,
      });
    }
  }

  // =====================================
  // 🔷 DELETE - EXCLUIR TABELA
  // =====================================
  if (req.method === "DELETE") {
    try {
      const tabela = String(req.query.tabela || "").trim();

      if (!tabela) {
        return res.status(400).json({ erro: "Tabela não informada" });
      }

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `DELETE FROM taxas 
           USING tabelas_taxas tt
           WHERE taxas.tabela_nome = $1
           AND tt.nome_tabela = taxas.tabela_nome
           AND tt.empresa_id = $2`,
          [tabela, empresa_id],
        );

        await client.query(
          `DELETE FROM tabelas_taxas 
           WHERE nome_tabela = $1 
           AND empresa_id = $2`,
          [tabela, empresa_id],
        );

        await client.query("COMMIT");

        return res.status(200).json({ sucesso: true });
      } catch (err) {
        await client.query("ROLLBACK");
        return res.status(500).json({ erro: "Erro ao excluir tabela" });
      } finally {
        client.release();
      }
    } catch (error) {
      return res.status(500).json({ erro: "Erro interno" });
    }
  }

  // =====================================
  // 🔒 SOMENTE POST
  // =====================================
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const tabela_nome = String(req.body.tabela_nome || "").trim();
    const tipo = String(req.body.tipo || "").trim();
    const taxas = req.body.taxas;

    if (!tabela_nome || !tipo || !Array.isArray(taxas)) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 🔷 GARANTE QUE A TABELA PERTENCE À EMPRESA
      await client.query(
        `
        INSERT INTO tabelas_taxas (nome_tabela, tipo, empresa_id)
        SELECT $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1 FROM tabelas_taxas 
          WHERE nome_tabela = $1 AND empresa_id = $3
        )
        `,
        [tabela_nome, tipo, empresa_id],
      );

      // 🔥 REMOVE SOMENTE DA EMPRESA
      await client.query(
        `
        DELETE FROM taxas 
        USING tabelas_taxas tt
        WHERE taxas.tabela_nome = $1
        AND tt.nome_tabela = taxas.tabela_nome
        AND tt.empresa_id = $2
        `,
        [tabela_nome, empresa_id],
      );

      // 🔥 INSERE NOVAS TAXAS
      for (const t of taxas) {
        const modalidade = String(t.modalidade || "").trim();

        const visa = parseFloat(String(t.visa || "0").replace(",", ".")) || 0;
        const master =
          parseFloat(String(t.master || "0").replace(",", ".")) || 0;
        const elo = parseFloat(String(t.elo || "0").replace(",", ".")) || 0;
        const outros =
          parseFloat(String(t.outros || "0").replace(",", ".")) || 0;

        if (!modalidade) continue;

        await client.query(
          `
          INSERT INTO taxas (tabela_nome, modalidade, visa, master, elo, outros)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [tabela_nome, modalidade, visa, master, elo, outros],
        );
      }

      await client.query("COMMIT");

      return res.status(200).json({
        sucesso: true,
        mensagem: "Taxas salvas com sucesso",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        erro: "Erro ao salvar dados",
        detalhe: err.message,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
