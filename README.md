# 📊 LLM Benchmarks Database (llmdb)

Welcome to the official repository for the **LLM Benchmarks Database (llmdb)**. This platform hosts a community-driven, curated database documenting inference timing metrics (tokens/sec) for Large Language Models (LLMs) across diverse hardware configurations, optimization engines, and speculative decoding parameters.

---

## ✨ Features

* **Deterministic Deduplication Engine**: Automatically hashes and groups individual benchmark runs containing matching hardware, model, and engine settings into parent canonical aggregates with rolling min/avg/max performance records.
* **Canonical Hardware & Model Resolver**: Normalizes fragmented hardware name strings (e.g., mapping variant spellings and VRAM sizes to `"NVIDIA GeForce RTX 4090"` or `"AMD Radeon RX 7900 XTX"`).
* **Multi-lingual Localization**: Fully translated client-side architecture supporting English, Spanish, and German with an dynamic i18n engine.
* **Security & Auth Guardrails**: Multi-tier authentication implementing robust bcrypt credentials, NextAuth GitHub OAuth flows, and cryptographically salted SHA-256 API key validation for automated crawler ingestion pipelines.
* **Frosted Glassmorphic Interface**: A stunning, custom Cyberglass dark-mode UI with fluid layouts, slide-out master-details cards, and real-time multi-dimensional filter panels.

---

## 🛠️ Quick Start

### 1. Installation
Clone this repository and install the dependencies:
```bash
npm install
```

### 2. Configure Environment Secrets
Copy the template configuration file to configure local variables:
```bash
cp env.example .env.local
```
*(Open `.env.local` and customize credentials, keys, and database connections as needed)*

### 3. Bootstrap and Seed the Database
Ensure your PostgreSQL database (e.g., local Docker container or remote Neon serverless) is running, then run the seeder:
```bash
npm run db:seed
```

### 4. Run the Development Server
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the interactive benchmark explorer.

---

## 📄 License & Attributions

This project is open-source and released under the terms of the **[MIT License](LICENSE)**.

For a comprehensive list of third-party libraries, frameworks, dependencies, and license attributions used by this project, please refer to the **[Third-Party Attributions Guide](ATTRIBUTIONS.md)**.
