/* =========================================================
   🔷 API CLIENTES - CADASTRO DE CLIENTES (SEGURO)
   ========================================================= */

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  // =========================================================
  // 🔷 CORS
  // =========================================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-empresa-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =========================================================
  // 🔐 EMPRESA VEM DO HEADER (PADRÃO OFICIAL)
  // =========================================================
  const empresa_id = Number(req.headers["x-empresa-id"]);

  if (!empresa_id || isNaN(empresa_id)) {
    return res.status(401).json({ erro: "Empresa não autenticada" });
  }

  try {
    /* =========================================================
       🔷 GET → LISTAR OU BUSCAR CLIENTE
       ========================================================= */
    if (req.method === "GET") {
      const { login, mostrar_senha } = req.query;

      // 🔐 controla se mostra senha ou não
      const incluirSenha = mostrar_senha === "true";

      let query;
      let params;

      if (login) {
        query = `
          SELECT id, cpf_cnpj, nome, tabela_nome, tipo, empresa_id
          ${incluirSenha ? ", senha" : ""}
          FROM clientes
          WHERE cpf_cnpj = $1 AND empresa_id = $2
        `;
        params = [login, empresa_id];
      } else {
        query = `
          SELECT id, cpf_cnpj, nome, tabela_nome, tipo, empresa_id
          ${incluirSenha ? ", senha" : ""}
          FROM clientes
          WHERE empresa_id = $1
          ORDER BY id DESC
        `;
        params = [empresa_id];
      }

      const result = await pool.query(query, params);

      return res.status(200).json(result.rows);
    }

    /* =========================================================
       🔷 DELETE → EXCLUIR CLIENTE
       ========================================================= */
    if (req.method === "DELETE") {
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
    }

    /* =========================================================
       🔷 PUT → ATUALIZAR CLIENTE
       ========================================================= */
    if (req.method === "PUT") {
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
    }

    /* =========================================================
       🔷 POST → CADASTRAR CLIENTE
       ========================================================= */
    if (req.method === "POST") {
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
    }

    return res.status(405).json({ erro: "Método não permitido" });
  } catch (error) {
    console.error("Erro geral clientes:", error);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
