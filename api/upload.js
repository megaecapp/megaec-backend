// 🚀 VERSÃO SIMPLIFICADA (SEM MULTER)

// teste deploy

import pkg from "pg";
import xlsx from "xlsx";

const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_hw1zCItW4GMd@ep-royal-bar-aml4z1ek-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false },
});

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
    console.log("🚀 Upload iniciado");

    // ⚠️ Vercel não lê multipart automaticamente
    // vamos forçar erro controlado pra confirmar fluxo

    return res.status(200).json({
      sucesso: true,
      mensagem: "API upload OK (teste)",
    });
  } catch (error) {
    console.error("❌ ERRO:", error);

    return res.status(500).json({
      erro: "Erro interno",
      detalhe: error.message,
    });
  }
}
