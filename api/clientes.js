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
  /* 🔹 LIBERA TODOS OS MÉTODOS NECESSÁRIOS */
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  /* 🔹 Responde requisição preflight (CORS) */
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* 🔹 Permitir apenas POST */
  // 🔥 SUPORTE A GET (BUSCAR CLIENTE POR CPF/CNPJ)
  if (req.method === "GET") {
    const { login } = req.query;

    let result;

    if (login) {
      // 🔍 BUSCA POR CPF/CNPJ
      result = await pool.query("SELECT * FROM clientes WHERE cpf_cnpj = $1", [
        login,
      ]);
    } else {
      // 📋 LISTAR TODOS
      result = await pool.query("SELECT * FROM clientes ORDER BY id DESC");
    }

    return res.status(200).json(result.rows);

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

  /* =========================================================
   🔷 CONTROLE DE MÉTODOS (POST / DELETE)
   ========================================================= */

  /* 🔹 DELETE → EXCLUIR CLIENTE */
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      // 🔹 validação
      if (!id) {
        return res.status(400).json({ erro: "ID não informado" });
      }

      // 🔹 executa exclusão
      await pool.query(`DELETE FROM clientes WHERE id = $1`, [id]);

      return res.status(200).json({
        success: true,
        mensagem: "Cliente excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);

      return res.status(500).json({
        erro: "Erro ao excluir cliente",
      });
    }
  }

  /* =========================================================
   🔷 PUT → ATUALIZAR CLIENTE
   ========================================================= */
  if (req.method === "PUT") {
    try {
      const { id, nome, cpf_cnpj, senha, tabela_nome, tipo } = req.body;

      // 🔹 validação
      if (!id) {
        return res.status(400).json({ erro: "ID não informado" });
      }

      // 🔹 atualização
      await pool.query(
        `
      UPDATE clientes
      SET nome = $1,
          cpf_cnpj = $2,
          senha = $3,
          tabela_nome = $4,
          tipo = $5
      WHERE id = $6
      `,
        [nome, cpf_cnpj, senha, tabela_nome, tipo, id],
      );

      return res.status(200).json({
        success: true,
        mensagem: "Cliente atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);

      return res.status(500).json({
        erro: "Erro ao atualizar cliente",
      });
    }
  }

  /* 🔹 POST → CADASTRAR CLIENTE */
  /* 🔹 POST → CADASTRAR CLIENTE */
  if (req.method === "POST") {
    try {
      const { cpf_cnpj, nome, senha, tabela_nome, tipo } = req.body;

      if (!cpf_cnpj || !nome || !senha || !tabela_nome || !tipo) {
        return res.status(400).json({ erro: "Dados incompletos" });
      }

      await pool.query(
        `
      INSERT INTO clientes (cpf_cnpj, nome, senha, tabela_nome, tipo)
      VALUES ($1, $2, $3, $4, $5)
      `,
        [cpf_cnpj, nome, senha, tabela_nome, tipo],
      );

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

  /* =========================================================
   🔷 MÉTODO NÃO SUPORTADO
   ========================================================= */
  return res.status(405).json({ erro: "Método não permitido" });
}
// ajuste deploy
