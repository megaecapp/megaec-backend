// =====================================
// API LOGIN - MEGAEC
// =====================================

// Importa o cliente PostgreSQL
import pkg from "pg";
const { Pool } = pkg;

// =====================================
// CONFIGURAÇÃO DO BANCO (NEON)
// =====================================

// Usa variável de ambiente (segurança)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// =====================================
// FUNÇÃO PRINCIPAL (REQUISIÇÃO)
// =====================================

export default async function handler(req, res) {
  // =====================================
  // LIBERA CORS (OBRIGATÓRIO)
  // =====================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responde preflight (IMPORTANTE)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Permitir apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    // =====================================
    // RECEBE DADOS DO FRONT-END
    // =====================================
    const { cpf_cnpj, senha } = req.body;

    // Validação simples
    if (!cpf_cnpj || !senha) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    // =====================================
    // CONSULTA NO BANCO
    // =====================================
    const resultado = await pool.query(
      "SELECT * FROM clientes WHERE cpf_cnpj = $1 AND senha = $2",
      [cpf_cnpj, senha],
    );

    // =====================================
    // VERIFICA SE ENCONTROU USUÁRIO
    // =====================================
    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: "Login inválido" });
    }

    const cliente = resultado.rows[0];

    // =====================================
    // RETORNO DE SUCESSO
    // =====================================
    return res.status(200).json({
      sucesso: true,
      nome: cliente.nome,
      tabela: cliente.tabela_nome,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
}
