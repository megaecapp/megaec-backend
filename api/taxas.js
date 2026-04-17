// =====================================
// IMPORTAÇÃO DO POSTGRES (NEON)
// =====================================
import pkg from "pg";
const { Pool } = pkg;

// =====================================
// CONEXÃO COM O BANCO
// =====================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// =====================================
// FUNÇÃO PRINCIPAL
// =====================================
export default async function handler(req, res) {
  // =====================================
  // LIBERA CORS
  // =====================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =====================================
  // PERMITE SOMENTE POST
  // =====================================
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    // =====================================
    // RECEBE OS DADOS DO FRONT
    // =====================================
    const { tabela_nome, taxas } = req.body;

    // =====================================
    // VALIDAÇÃO
    // =====================================
    if (!tabela_nome || !taxas || !Array.isArray(taxas)) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // =====================================
    // REMOVE TAXAS ANTIGAS DA TABELA
    // =====================================
    await pool.query("DELETE FROM taxas WHERE tabela_nome = $1", [tabela_nome]);

    // =====================================
    // INSERE NOVAS TAXAS
    // =====================================
    for (const item of taxas) {
      await pool.query(
        `INSERT INTO taxas 
        (tabela_nome, modalidade, visa, master, elo, outros)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tabela_nome,
          item.modalidade,
          item.visa,
          item.master,
          item.elo,
          item.outros,
        ],
      );
    }

    // =====================================
    // SUCESSO
    // =====================================
    return res.status(200).json({
      sucesso: true,
      mensagem: "Taxas salvas com sucesso",
    });
  } catch (error) {
    console.error("❌ ERRO:", error);

    return res.status(500).json({
      erro: "Erro ao salvar taxas",
      detalhe: error.message,
    });
  }
}
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    

    const { tabela_nome, tipo, taxas } = req.body;

// 🔍 DEBUG (COLOQUE AQUI)
// 🔍 DEBUG (COLE EXATAMENTE AQUI)
console.log("📥 BODY RECEBIDO:", req.body);
console.log("📌 TABELA:", tabela_nome);
console.log("📌 TIPO:", tipo);

    if (!tabela_nome || !taxas) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 🔷 1. INSERIR TABELA SE NÃO EXISTIR
      await client.query(
        `
        INSERT INTO tabelas_taxas (nome_tabela, tipo)
        SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1 FROM tabelas_taxas WHERE nome_tabela = $1
        )
        `,
        [tabela_nome, tipo]
      );

      // 🔷 2. REMOVER TAXAS ANTIGAS (EDIÇÃO SEGURA)
      await client.query(
        `DELETE FROM taxas WHERE tabela_nome = $1`,
        [tabela_nome]
      );

      // 🔷 3. INSERIR NOVAS TAXAS
      for (const t of taxas) {
        await client.query(
          `
          INSERT INTO taxas (tabela_nome, modalidade, visa, master, elo, outros)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            tabela_nome,
            t.modalidade,
            t.visa,
            t.master,
            t.elo,
            t.outros,
          ]
        );
      }

      await client.query("COMMIT");

      res.json({ sucesso: true });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ erro: "Erro ao salvar dados" });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro geral" });
  }
}