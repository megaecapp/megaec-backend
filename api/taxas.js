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
  // =====================================
  // 🔓 CORS
  // =====================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =====================================
  // 🔷 GET - BUSCAR TAXAS POR TABELA
  // =====================================
  if (req.method === "GET") {
    try {
      const tabela = String(req.query.tabela || "").trim();

      console.log("📥 GET tabela:", tabela);

      if (!tabela) {
        return res.status(400).json({ erro: "Tabela não informada" });
      }

      const result = await pool.query(
        `
      SELECT t.*, tt.tipo
FROM taxas t
JOIN tabelas_taxas tt ON tt.nome_tabela = t.tabela_nome
WHERE t.tabela_nome = $1::varchar
ORDER BY
  CASE
    WHEN modalidade = 'pix' THEN 0
    WHEN modalidade = 'debito' THEN 1
    ELSE CAST(REPLACE(modalidade, 'x', '') AS INTEGER)
  END
      `,
        [tabela],
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
  // 🔒 SOMENTE POST
  // =====================================
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    // =====================================
    // 📥 RECEBER DADOS
    // =====================================
    const tabela_nome = String(req.body.tabela_nome || "").trim();
    const tipo = String(req.body.tipo || "").trim();
    const taxas = req.body.taxas;

    // 🔍 DEBUG
    console.log("📥 BODY RECEBIDO:", req.body);
    console.log("📌 TABELA:", tabela_nome);
    console.log("📌 TIPO:", tipo);
    console.log("🧪 TIPO tabela_nome:", typeof tabela_nome);

    // =====================================
    // 🔍 VALIDAÇÃO
    // =====================================
    if (
      !tabela_nome ||
      tabela_nome === "" ||
      !tipo ||
      tipo === "" ||
      !Array.isArray(taxas)
    ) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // =====================================
    // 🔗 CONEXÃO
    // =====================================
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // =====================================
      // 🔷 INSERE TABELA (SE NÃO EXISTIR)
      // =====================================
      await client.query(
        `
       INSERT INTO tabelas_taxas (nome_tabela, tipo)
SELECT $1::varchar, $2::varchar
WHERE NOT EXISTS (
  SELECT 1 FROM tabelas_taxas WHERE nome_tabela = $1::varchar
)
        `,
        [tabela_nome, tipo],
      );

      // =====================================
      // 🧹 REMOVE TAXAS ANTIGAS
      // =====================================
      await client.query(`DELETE FROM taxas WHERE tabela_nome = $1::varchar`, [
        tabela_nome,
      ]);

      // =====================================
      // 💾 INSERE NOVAS TAXAS
      // =====================================
      for (const t of taxas) {
        // 🔒 GARANTIR STRING
        const modalidade = String(t.modalidade || "").trim();

        // 🔒 GARANTIR NUMBER
        const visa = parseFloat(String(t.visa || "0").replace(",", ".")) || 0;
        const master =
          parseFloat(String(t.master || "0").replace(",", ".")) || 0;

        const elo = parseFloat(String(t.elo || "0").replace(",", ".")) || 0;

        const outros =
          parseFloat(String(t.outros || "0").replace(",", ".")) || 0;

        // 🔍 DEBUG FORTE
        console.log("🧪 ITEM TRATADO:", {
          modalidade,
          visa,
          master,
          elo,
          outros,
        });

        // 🔒 IGNORA SE MODALIDADE INVÁLIDA
        if (!modalidade || modalidade === "") continue;

        await client.query(
          `
    INSERT INTO taxas (tabela_nome, modalidade, visa, master, elo, outros)
VALUES ($1::varchar, $2::varchar, $3::numeric, $4::numeric, $5::numeric, $6::numeric)
    `,
          [tabela_nome, modalidade, visa, master, elo, outros],
        );
      }
      // =====================================
      // ✅ COMMIT
      // =====================================
      await client.query("COMMIT");

      return res.status(200).json({
        sucesso: true,
        mensagem: "Taxas salvas com sucesso",
      });
    } catch (err) {
      await client.query("ROLLBACK");

      console.error("💥 ERRO SQL:", err);

      return res.status(500).json({
        erro: "Erro ao salvar dados",
        detalhe: err.message,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("💥 ERRO GERAL:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
