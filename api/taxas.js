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
    const { tabela_nome, tipo, taxas } = req.body;

    // Validação básica
    if (!tabela_nome || !tipo || !taxas || !Array.isArray(taxas)) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // =====================================
    // REMOVE TAXAS ANTIGAS
    // =====================================
    await pool.query("DELETE FROM taxas WHERE tabela_nome = $1 AND tipo = $2", [
      tabela_nome,
      tipo,
    ]);

    // =====================================
    // INSERE NOVAS TAXAS
    // =====================================
    for (const item of taxas) {
      await pool.query(
        `INSERT INTO taxas 
        (tabela_nome, tipo, modalidade, visa, master, elo, outros)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tabela_nome,
          tipo,
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
