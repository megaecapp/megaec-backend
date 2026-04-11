// ================================
// IMPORTA BIBLIOTECAS
// ================================
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const { Pool } = require("pg");

// ================================
// CONFIGURAÇÕES
// ================================
const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ================================
// CONEXÃO COM NEON
// ================================
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_hw1zCItW4GMd@ep-royal-bar-aml4z1ek-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

// ================================
// ROTA DE UPLOAD
// ================================
router.post("/", upload.single("arquivo"), async (req, res) => {
  try {
    console.log("📥 Arquivo recebido");

    const caminho = req.file.path;

    const workbook = xlsx.readFile(caminho);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = xlsx.utils.sheet_to_json(sheet);

    console.log("📊 Linhas:", dados.length);

    for (const linha of dados) {
      await pool.query(
        `
        INSERT INTO taxas 
        (tabela_nome, modalidade, visa, master, elo, outros)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          "A",
          linha.modalidade,
          linha.visa,
          linha.master,
          linha.elo,
          linha.outros,
        ],
      );

      console.log("✅ Inserido:", linha.modalidade);
    }

    res.json({ sucesso: true });
  } catch (erro) {
    console.error("❌ Erro:", erro);
    res.status(500).json({ erro: "Erro no upload" });
  }
});

module.exports = router;
