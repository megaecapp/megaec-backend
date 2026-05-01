// ================================
// IMPORTA BIBLIOTECAS
// ================================
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// ================================
// CONFIGURAÇÃO DO APP
// ================================
const app = express();

app.use(cors());
app.use(express.json());

// ================================
// CONEXÃO COM BANCO (NEON)
// ================================
// ================================
// CONEXÃO COM BANCO (NEON)
// ================================
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_hw1zCItW4GMd@ep-royal-bar-aml4z1ek-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

// =====================================
// 🔐 LOGIN EMPRESA (WHITE LABEL)
// =====================================
app.post("/login-empresa", async (req, res) => {
  try {
    const { login, senha } = req.body;

    // 🔷 validação
    if (!login || !senha) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    // 🔷 busca empresa
    const result = await pool.query(
      "SELECT * FROM empresas WHERE login = $1 AND senha = $2",
      [login, senha],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Login inválido" });
    }

    const empresa = result.rows[0];

    // 🔷 retorno
    return res.status(200).json({
      sucesso: true,
      empresa_id: empresa.id,
      nome_empresa: empresa.nome_empresa,
      logo_admin: empresa.logo_admin,
      banner_admin: empresa.banner_admin,
      logo_simulador: empresa.logo_simulador,
    });
  } catch (error) {
    console.error("Erro login empresa:", error);

    return res.status(500).json({
      erro: "Erro interno",
    });
  }
});

// =====================================
// 🔐 RECUPERAR SENHA (SIMPLES)
// =====================================
app.post("/recuperar-senha", async (req, res) => {
  try {
    const { login } = req.body;

    if (!login) {
      return res.status(400).json({ erro: "Informe o login" });
    }

    const result = await pool.query("SELECT * FROM empresas WHERE login = $1", [
      login,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    const empresa = result.rows[0];

    if (!empresa.email) {
      return res.status(400).json({ erro: "Empresa sem email cadastrado" });
    }

    // 🔷 gera senha
    const novaSenha = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔷 salva
    await pool.query("UPDATE empresas SET senha = $1 WHERE login = $2", [
      novaSenha,
      login,
    ]);

    console.log("Nova senha:", novaSenha);

    res.json({
      sucesso: true,
      mensagem: "Nova senha enviada para o email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// =====================================
// 🔐 LOGIN CLIENTE (SIMULADOR)
// =====================================
app.post("/login-cliente", async (req, res) => {
  try {
    const { documento, senha } = req.body;

    // validação
    if (!documento || !senha) {
      return res.status(400).json({
        erro: "Dados incompletos",
      });
    }

    // busca cliente + empresa
    const result = await pool.query(
      `
      SELECT 
        c.*,
        e.nome_empresa,
        e.logo_simulador

      FROM clientes c

      INNER JOIN empresas e
        ON c.empresa_id = e.id

      WHERE c.cpf_cnpj = $1
        AND c.senha = $2
      `,
      [documento, senha],
    );

    // não encontrou
    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: "Login inválido",
      });
    }

    const cliente = result.rows[0];

    // sucesso
    return res.status(200).json({
      sucesso: true,

      cliente_id: cliente.id,
      nome: cliente.nome,

      cpf_cnpj: cliente.cpf_cnpj,

      tabela_nome: cliente.tabela_nome,
      tipo: cliente.tipo,

      empresa_id: cliente.empresa_id,
      nome_empresa: cliente.nome_empresa,

      logo_simulador: cliente.logo_simulador,
    });
  } catch (error) {
    console.error("Erro login cliente:", error);

    return res.status(500).json({
      erro: "Erro interno",
    });
  }
});

// ================================
// 🚀 INICIAR SERVIDOR
// ================================

app.listen(3000, "127.0.0.1", () => {
  console.log("🚀 Servidor rodando em http://127.0.0.1:3000");
});
