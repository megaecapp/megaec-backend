/* =========================================================
   🔷 API CLIENTES - CADASTRO DE CLIENTES
   Projeto: MegaEC Backend
   Objetivo: Receber dados e salvar no banco Neon (PostgreSQL)
   Tecnologia: PG (mesma usada no login)
   ========================================================= */

/* =========================================================
   🔷 IMPORTAÇÃO DO PG (POSTGRESQL)
   ========================================================= */
import pkg from "pg";
const { Pool } = pkg;

/* =========================================================
   🔷 CONEXÃO COM BANCO (NEON)
   Usa a variável de ambiente DATABASE_URL
   ========================================================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* =========================================================
   🔷 FUNÇÃO PRINCIPAL (ROTA /api/clientes)
   ========================================================= */
export default async function handler(req, res) {
  /* =========================================================
     🔷 LIBERAÇÃO DE CORS
     Permite acesso do frontend local
     ========================================================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  /* 🔹 Responde requisição preflight (CORS) */
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* 🔹 Permitir apenas POST */
  // 🔥 SUPORTE A GET (BUSCAR CLIENTE POR CPF/CNPJ)
  if (req.method === "GET") {
    const { login } = req.query;

    if (!login) {
      return res.status(400).json({ erro: "CPF/CNPJ não informado" });
    }

    try {
      const result = await pool.query(
        "SELECT * FROM clientes WHERE cpf_cnpj = $1",
        [login],
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      return res.status(500).json({ erro: "Erro ao buscar cliente" });
    }
  }

  // 🔥 CONTINUA PERMITINDO POST
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    /* =========================================================
       🔷 RECEBER DADOS DO FRONTEND
       ========================================================= */
    const { cpf_cnpj, nome, senha, tabela_nome, tipo } = req.body;
    /* 🔹 Validação básica */
    if (!cpf_cnpj || !nome || !senha || !tabela_nome || !tipo) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    /* =========================================================
       🔷 INSERIR NO BANCO (POSTGRES / NEON)
       ========================================================= */
    await pool.query(
      `
      INSERT INTO clientes (cpf_cnpj, nome, senha, tabela_nome, tipo)
VALUES ($1, $2, $3, $4, $5)
      `,
      [cpf_cnpj, nome, senha, tabela_nome, tipo],
    );

    /* =========================================================
       🔷 RESPOSTA DE SUCESSO
       ========================================================= */
    return res.status(200).json({
      success: true,
      mensagem: "Cliente cadastrado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao inserir cliente:", error);

    return res.status(500).json({
      erro: "Erro interno no servidor",
    });
  }
}
// ajuste deploy
