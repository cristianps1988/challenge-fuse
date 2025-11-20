CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('processing', 'completed', 'needs_review', 'reviewed', 'failed')),
  type TEXT CHECK(type IN ('bank_statement', 'government_id', 'w9', 'certificate_of_insurance', 'articles_of_incorporation')),
  type_confidence REAL CHECK(type_confidence >= 0 AND type_confidence <= 1),
  processed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);

CREATE TABLE IF NOT EXISTS extractions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  fields TEXT NOT NULL,
  overall_confidence REAL NOT NULL CHECK(overall_confidence >= 0 AND overall_confidence <= 1),
  extracted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_extractions_document_id ON extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_extractions_overall_confidence ON extractions(overall_confidence);

CREATE TABLE IF NOT EXISTS corrections (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  extraction_id TEXT,
  previous_type TEXT,
  corrected_type TEXT,
  previous_fields TEXT,
  corrected_fields TEXT,
  corrected_by TEXT NOT NULL,
  corrected_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_corrections_document_id ON corrections(document_id);
CREATE INDEX IF NOT EXISTS idx_corrections_corrected_at ON corrections(corrected_at);

CREATE TABLE IF NOT EXISTS learning_examples (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  correction_id TEXT NOT NULL,
  example_type TEXT NOT NULL CHECK(example_type IN ('classification', 'extraction')),
  example_data TEXT NOT NULL,
  confidence_boost REAL NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_examples_document_type ON learning_examples(document_type);
CREATE INDEX IF NOT EXISTS idx_learning_examples_example_type ON learning_examples(example_type);
CREATE INDEX IF NOT EXISTS idx_learning_examples_usage_count ON learning_examples(usage_count);

CREATE TABLE IF NOT EXISTS thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type TEXT NOT NULL UNIQUE,
  confidence_threshold REAL NOT NULL CHECK(confidence_threshold >= 0 AND confidence_threshold <= 1),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_thresholds_document_type ON thresholds(document_type);

INSERT OR IGNORE INTO thresholds (document_type, confidence_threshold) VALUES
  ('bank_statement', 0.85),
  ('government_id', 0.90),
  ('w9', 0.85),
  ('certificate_of_insurance', 0.80),
  ('articles_of_incorporation', 0.80);
