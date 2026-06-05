-- PostgreSQL schema for FRACTARC

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(256) UNIQUE NOT NULL,
  role VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(128) UNIQUE NOT NULL,
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  birth_date DATE,
  sex VARCHAR(16),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE studies (
  id SERIAL PRIMARY KEY,
  study_id VARCHAR(128) UNIQUE NOT NULL,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  modality VARCHAR(64) DEFAULT 'X-Ray',
  study_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE analyses (
  id SERIAL PRIMARY KEY,
  study_id INTEGER REFERENCES studies(id) ON DELETE CASCADE,
  status VARCHAR(64) DEFAULT 'pending',
  model_outputs JSONB,
  xai_outputs JSONB,
  report JSONB,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE annotations (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
  author VARCHAR(128),
  type VARCHAR(64),
  geometry JSONB,
  review_status VARCHAR(64) DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
