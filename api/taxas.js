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
    if (!tabela_nome || tabela_nome === "" || !Array.isArray(taxas)) {
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
        SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1 FROM tabelas_taxas WHERE nome_tabela = $1
        )
        `,
        [tabela_nome, tipo],
      );

      // =====================================
      // 🧹 REMOVE TAXAS ANTIGAS
      // =====================================
      await client.query(`DELETE FROM taxas WHERE tabela_nome = $1`, [
        tabela_nome,
      ]);

      // =====================================
      // 💾 INSERE NOVAS TAXAS
      // =====================================
      for (const t of taxas) {
        // 🔒 GARANTIR STRING
        const modalidade = String(t.modalidade || "").trim();

        // 🔒 GARANTIR NUMBER
        const visa = Number(String(t.visa || "0").replace(",", "."));

        const master = Number(String(t.master || "0").replace(",", "."));

        const elo = Number(String(t.elo || "0").replace(",", "."));

        const outros = Number(String(t.outros || "0").replace(",", "."));

        // 🔍 DEBUG FORTE
        console.log("🧪 ITEM TRATADO:", {
          modalidade,
          visa,
          master,
          elo,
          outros,
        });

        // 🔒 IGNORA SE MODALIDADE INVÁLIDA
        if (!modalidade) continue;

        await client.query(
          `
    INSERT INTO taxas (tabela_nome, modalidade, visa, master, elo, outros)
    VALUES ($1, $2, $3, $4, $5, $6)
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
