-- Solar Management System Database Schema (PostgreSQL)

-- ── Custom ENUM types ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'employee', 'electrician', 'dwcra');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_category AS ENUM ('panel', 'inverter', 'battery', 'mounting', 'wire', 'connector', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_type AS ENUM ('panel_cleaning', 'inverter_repair', 'wiring_issue', 'performance_drop', 'physical_damage', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assigned_to_type AS ENUM ('local_electrician', 'dwcra_group');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Trigger function for updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       user_role NOT NULL DEFAULT 'employee',
  phone      VARCHAR(20),
  street     VARCHAR(255),
  village    VARCHAR(100),
  taluka     VARCHAR(100),
  district   VARCHAR(100),
  state      VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Projects table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                  SERIAL PRIMARY KEY,
  project_name        VARCHAR(200) NOT NULL,
  customer_name       VARCHAR(150) NOT NULL,
  customer_email      VARCHAR(150),
  customer_phone      VARCHAR(20),
  site_address        TEXT NOT NULL,
  system_size_kw      NUMERIC(10,2) NOT NULL,
  panel_type          VARCHAR(100),
  panel_count         INT,
  inverter_type       VARCHAR(100),
  inverter_count      INT,
  project_cost        NUMERIC(12,2),
  status              project_status NOT NULL DEFAULT 'planning',
  start_date          DATE,
  expected_completion DATE,
  actual_completion   DATE,
  notes               TEXT,
  created_by          INT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Invoices table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id               SERIAL PRIMARY KEY,
  invoice_number   VARCHAR(50) NOT NULL UNIQUE,
  project_id       INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_name    VARCHAR(150) NOT NULL,
  customer_email   VARCHAR(150),
  customer_address TEXT,
  subtotal         NUMERIC(12,2) NOT NULL,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  tax_amount       NUMERIC(12,2) NOT NULL,
  total_amount     NUMERIC(12,2) NOT NULL,
  status           invoice_status NOT NULL DEFAULT 'draft',
  due_date         DATE,
  paid_date        DATE,
  notes            TEXT,
  created_by       INT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Invoice items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL
);

-- ── Inventory table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id              SERIAL PRIMARY KEY,
  item_name       VARCHAR(200) NOT NULL,
  category        inventory_category NOT NULL,
  sku             VARCHAR(100) UNIQUE,
  quantity        INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 10,
  unit_price      NUMERIC(12,2),
  supplier        VARCHAR(200),
  location        VARCHAR(200),
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS inventory_updated_at ON inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Maintenance requests table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id                SERIAL PRIMARY KEY,
  project_id        INT REFERENCES projects(id) ON DELETE SET NULL,
  requested_by      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_type        issue_type NOT NULL,
  description       TEXT NOT NULL,
  priority          priority_level NOT NULL DEFAULT 'medium',
  status            maintenance_status NOT NULL DEFAULT 'pending',
  assigned_to       assigned_to_type,
  electrician_name  VARCHAR(150),
  electrician_phone VARCHAR(20),
  scheduled_date    DATE,
  completed_date    DATE,
  resolution_notes  TEXT,
  amount            NUMERIC(12,2),
  payment_status    payment_status NOT NULL DEFAULT 'unpaid',
  before_photo_1    VARCHAR(500),
  before_photo_2    VARCHAR(500),
  after_photo_1     VARCHAR(500),
  after_photo_2     VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS maintenance_requests_updated_at ON maintenance_requests;
CREATE TRIGGER maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Migration: rename photo_1/2 → before_photo_1/2, add after_photo_1/2 ───────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_requests' AND column_name = 'photo_1'
  ) THEN
    ALTER TABLE maintenance_requests RENAME COLUMN photo_1 TO before_photo_1;
    ALTER TABLE maintenance_requests RENAME COLUMN photo_2 TO before_photo_2;
    ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS after_photo_1 VARCHAR(500);
    ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS after_photo_2 VARCHAR(500);
  END IF;
END $$;

-- ── Seed admin user (password: admin123) ───────────────────────
INSERT INTO users (name, email, password, role, phone)
VALUES ('Admin User', 'admin@solar.com', '$2a$10$xVqYLGEES9mY3OMbPGeMn.9lQCHxMo/wABei8K.4k7qaUDYNocePS', 'admin', '9999999999')
ON CONFLICT (email) DO NOTHING;

