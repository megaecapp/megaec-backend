import pkg from "pg";
import xlsx from "xlsx";

const { Pool } = pkg;

// 🔐 conexão segura
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  // 🔥 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-empresa-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  // 🔐 EMPRESA VIA HEADER (PADRÃO DO SISTEMA)
  const empresa_id = Number(req.headers["x-empresa-id"]);

  if (!empresa_id || isNaN(empresa_id)) {
    return res.status(401).json({ erro: "Empresa não autenticada" });
  }

  try {
    console.log("🚀 Upload iniciado");
    console.log("🏢 Empresa:", empresa_id);

    // 🔴 POR ENQUANTO: TESTE SIMPLES
    return res.status(200).json({
      sucesso: true,
      empresa: empresa_id,
      mensagem: "API upload OK (teste com empresa)",
    });
  } catch (error) {
    console.error("❌ ERRO:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
