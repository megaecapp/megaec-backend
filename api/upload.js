// VERSÃO FINAL - COMPATÍVEL COM VERCEL 🚀

import pkg from "pg";
import multer from "multer";
import xlsx from "xlsx";

const { Pool } = pkg;

/* 🔷 Configuração do multer (memória) */
const upload = multer({ storage: multer.memoryStorage() });

/* 🔷 Conexão com banco */
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_hw1zCItW4GMd@ep-royal-bar-aml4z1ek-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

/* 🔷 Helper para usar multer na Vercel */
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

/* =========================================================
   🔷 API UPLOAD (SERVERLESS)
========================================================= */
export default async function handler(req, res) {
  /* 🔷 CORS */
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
    console.log("📥 Iniciando upload...");

    /* 🔥 Processa o arquivo */
    await runMiddleware(req, res, upload.single("file"));

    const file = req.file;
    const tipo = req.body.tipo;

    if (!file) {
      return res.status(400).json({ erro: "Arquivo não enviado" });
    }

    console.log("📁 Arquivo:", file.originalname);
    console.log("🏷 Tipo:", tipo);

    /* =========================================================
       🔷 EXTRAIR NOME DA TABELA DO ARQUIVO
       tabela_A.xlsx → A
    ========================================================= */
    const nomeTabela = file.originalname
      .replace(".xlsx", "")
      .replace("tabela_", "");

    console.log("🧠 Nome tabela:", nomeTabela);

    /* =========================================================
       🔷 LER EXCEL
    ========================================================= */
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = xlsx.utils.sheet_to_json(sheet);

    console.log("📊 Linhas:", dados.length);

    /* =========================================================
       🔷 SALVAR TABELA (REGISTRO)
    ========================================================= */
    await pool.query(
      `
      INSERT INTO tabelas_taxas (nome_tabela, tipo)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
      [nomeTabela, tipo],
    );

    /* =========================================================
       🔷 INSERIR TAXAS
    ========================================================= */
    for (const linha of dados) {
      await pool.query(
        `
        INSERT INTO taxas 
        (tabela_nome, modalidade, visa, master, elo, outros)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          nomeTabela,
          linha.modalidade,
          linha.visa,
          linha.master,
          linha.elo,
          linha.outros,
        ],
      );
    }

    console.log("✅ Upload concluído");

    return res.status(200).json({
      sucesso: true,
      tabela: nomeTabela,
    });
  } catch (erro) {
    console.error("❌ Erro:", erro);

    return res.status(500).json({
      erro: "Erro no upload",
      detalhe: erro.message,
    });
  }
}
