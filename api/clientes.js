/* =========================================================
   🔷 API CLIENTES - CADASTRO DE CLIENTES
   ========================================================= */

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔷 IDENTIFICA EMPRESA (TEMPORÁRIO)
  const empresa_id = req.query.empresa_id || 1;

  /* =========================================================
     🔷 GET → LISTAR OU BUSCAR CLIENTE
     ========================================================= */
  if (req.method === "GET") {
    const { login } = req.query;

    let result;

    if (login) {
      result = await pool.query(
        "SELECT * FROM clientes WHERE cpf_cnpj = $1 AND empresa_id = $2",
        [login, empresa_id],
      );
    } else {
      result = await pool.query(
        "SELECT * FROM clientes WHERE empresa_id = $1 ORDER BY id DESC",
        [empresa_id],
      );
    }

    return res.status(200).json(result.rows);
  }

  /* =========================================================
     🔷 DELETE → EXCLUIR CLIENTE
     ========================================================= */
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ erro: "ID não informado" });
      }

      await pool.query(
        "DELETE FROM clientes WHERE id = $1 AND empresa_id = $2",
        [id, empresa_id],
      );

      return res.status(200).json({
        success: true,
        mensagem: "Cliente excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      return res.status(500).json({ erro: "Erro ao excluir cliente" });
    }
  }

  /* =========================================================
     🔷 PUT → ATUALIZAR CLIENTE
     ========================================================= */
  if (req.method === "PUT") {
    try {
      const { id, nome, cpf_cnpj, senha, tabela_nome, tipo } = req.body;

      if (!id) {
        return res.status(400).json({ erro: "ID não informado" });
      }

      await pool.query(
        `
        UPDATE clientes
        SET nome = $1,
            cpf_cnpj = $2,
            senha = $3,
            tabela_nome = $4,
            tipo = $5
        WHERE id = $6 AND empresa_id = $7
        `,
        [nome, cpf_cnpj, senha, tabela_nome, tipo, id, empresa_id],
      );

      return res.status(200).json({
        success: true,
        mensagem: "Cliente atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      return res.status(500).json({ erro: "Erro ao atualizar cliente" });
    }
  }

  /* =========================================================
     🔷 POST → CADASTRAR CLIENTE
     ========================================================= */
  if (req.method === "POST") {
    try {
      const { cpf_cnpj, nome, senha, tabela_nome, tipo } = req.body;

      if (!cpf_cnpj || !nome || !senha || !tabela_nome || !tipo) {
        return res.status(400).json({ erro: "Dados incompletos" });
      }

      await pool.query(
        `
        INSERT INTO clientes (cpf_cnpj, nome, senha, tabela_nome, tipo, empresa_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [cpf_cnpj, nome, senha, tabela_nome, tipo, empresa_id],
      );

      return res.status(200).json({
        success: true,
        mensagem: "Cliente cadastrado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao inserir cliente:", error);
      return res.status(500).json({ erro: "Erro interno no servidor" });
    }
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
