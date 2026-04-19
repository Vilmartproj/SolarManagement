-- Solar Management System Database Schema

CREATE DATABASE IF NOT EXISTS solar_management;
USE solar_management;

-- Users table (employees & admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(200) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150),
  customer_phone VARCHAR(20),
  site_address TEXT NOT NULL,
  system_size_kw DECIMAL(10,2) NOT NULL,
  panel_type VARCHAR(100),
  panel_count INT,
  inverter_type VARCHAR(100),
  inverter_count INT,
  project_cost DECIMAL(12,2),
  status ENUM('planning', 'in_progress', 'completed', 'on_hold', 'cancelled') DEFAULT 'planning',
  start_date DATE,
  expected_completion DATE,
  actual_completion DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  project_id INT NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150),
  customer_address TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  tax_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(200) NOT NULL,
  category ENUM('panel', 'inverter', 'battery', 'mounting', 'wire', 'connector', 'other') NOT NULL,
  sku VARCHAR(100) UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  min_stock_level INT DEFAULT 10,
  unit_price DECIMAL(12,2),
  supplier VARCHAR(200),
  location VARCHAR(200),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  requested_by INT NOT NULL,
  issue_type ENUM('panel_cleaning', 'inverter_repair', 'wiring_issue', 'performance_drop', 'physical_damage', 'other') NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  assigned_to ENUM('local_electrician', 'dwaraka_group') DEFAULT NULL,
  electrician_name VARCHAR(150),
  electrician_phone VARCHAR(20),
  scheduled_date DATE,
  completed_date DATE,
  resolution_notes TEXT,
  amount DECIMAL(12,2) DEFAULT NULL,
  payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  photo_1 VARCHAR(500) DEFAULT NULL,
  photo_2 VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone)
VALUES ('Admin User', 'admin@solar.com', '$2a$10$xVqYLGEES9mY3OMbPGeMn.9lQCHxMo/wABei8K.4k7qaUDYNocePS', 'admin', '9999999999')
ON DUPLICATE KEY UPDATE email = email;
