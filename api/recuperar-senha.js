import pkg from "pg";
const { Pool } = pkg;

import nodemailer from "nodemailer";

// 🔷 CONEXÃO BANCO
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🔷 CONFIGURAÇÃO EMAIL (GMAIL - REMETENTE)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "marcorobertom@gmail.com", // 🔥 TROCAR
    pass: "hifc zrmv uyze kbpe", // 🔥 TROCAR
  },
});

// 🔷 GERAR SENHA
function gerarSenha() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  // 🔥 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { login } = req.body;

    // 🔷 validação
    if (!login) {
      return res.status(400).json({ erro: "Informe o login" });
    }

    // 🔷 busca empresa
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

    // 🔷 gera nova senha
    const novaSenha = gerarSenha();

    // 🔷 atualiza no banco
    await pool.query("UPDATE empresas SET senha = $1 WHERE login = $2", [
      novaSenha,
      login,
    ]);

    // 🔷 ENVIA EMAIL
    await transporter.sendMail({
      from: '"Zion Simulador" <marcorobertom@gmail.com>', // 🔥 TROCAR
      to: empresa.email,
      subject: "🔐 Recuperação de senha — Zion Simulador de Taxas",
      html: `
        <div style="font-family: Arial; padding:20px;">
          <h2>Recuperação de senha</h2>

          <p>Olá, ${empresa.nome_empresa || "empresa"}.</p>

          <p>Sua nova senha é:</p>

          <h1 style="color:#16a34a;">${novaSenha}</h1>

          <p>Use essa senha para acessar o sistema.</p>
        </div>
      `,
    });

    // 🔷 resposta segura (SEM senha)
    return res.status(200).json({
      sucesso: true,
      mensagem: "Nova senha enviada para o email",
    });
  } catch (error) {
    console.error("Erro recuperar senha:", error);
    return res.status(500).json({ erro: "Erro interno" });
  }
}
