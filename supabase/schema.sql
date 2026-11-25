-- ====================================================================
-- ArPOS RESTAURANT MANAGEMENT PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- Multi-tenant, Modular Architecture with Dynamic Module Entitlements
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TENANTS & BRANCHES
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'IDR',
    currency_symbol VARCHAR(10) DEFAULT 'Rp',
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_settings (
    restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
    tax_rate_percent NUMERIC(5, 2) DEFAULT 11.00,
    tax_enabled BOOLEAN DEFAULT TRUE,
    service_charge_percent NUMERIC(5, 2) DEFAULT 5.00,
    service_charge_enabled BOOLEAN DEFAULT TRUE,
    allow_split_bill BOOLEAN DEFAULT TRUE,
    allow_offline_orders BOOLEAN DEFAULT TRUE,
    blind_shift_closing BOOLEAN DEFAULT TRUE,
    receipt_header TEXT DEFAULT 'Welcome to ArPOS Restaurant',
    receipt_footer TEXT DEFAULT 'Thank you for dining with us!',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, code)
);

-- 3. MODULE REGISTRY & CONFIGURATION
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'cashier_pos', 'kitchen_display', 'inventory'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_core BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS module_dependencies (
    module_id VARCHAR(50) REFERENCES modules(id) ON DELETE CASCADE,
    required_module_id VARCHAR(50) REFERENCES modules(id) ON DELETE CASCADE,
    PRIMARY KEY (module_id, required_module_id)
);

CREATE TABLE IF NOT EXISTS restaurant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, module_id)
);

-- 4. USERS & ACCESS CONTROL (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'owner', 'administrator', 'manager', 'cashier', 'kitchen_staff'
    pin_code VARCHAR(10),       -- Quick POS pin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, email)
);

-- 5. CATALOG (CATEGORIES, PRODUCTS, MODIFIERS)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kitchen_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    kitchen_station_id UUID REFERENCES kitchen_stations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    base_price BIGINT NOT NULL DEFAULT 0, -- integer currency (e.g. 35000 IDR)
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Small", "Regular", "Large"
    sku VARCHAR(100),
    price BIGINT NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    min_selections INT DEFAULT 0,
    max_selections INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS modifier_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_delta BIGINT DEFAULT 0, -- integer delta (e.g. +5000)
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_modifier_links (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_id)
);

-- 6. CASHIER SHIFTS & CASH MANAGEMENT
CREATE TABLE IF NOT EXISTS cashier_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id),
    device_code VARCHAR(100) DEFAULT 'POS-TERM-01',
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'reviewed'
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    opening_cash BIGINT NOT NULL DEFAULT 0,
    cash_sales BIGINT NOT NULL DEFAULT 0,
    total_cash_in BIGINT NOT NULL DEFAULT 0,
    total_cash_out BIGINT NOT NULL DEFAULT 0,
    total_cash_refunds BIGINT NOT NULL DEFAULT 0,
    total_cash_drops BIGINT NOT NULL DEFAULT 0,
    
    expected_cash BIGINT NOT NULL DEFAULT 0,
    actual_cash BIGINT,
    discrepancy BIGINT, -- actual_cash - expected_cash
    
    closing_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES cashier_shifts(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'cash_in', 'cash_out', 'cash_drop', 'petty_cash'
    amount BIGINT NOT NULL,
    reason TEXT NOT NULL,
    authorized_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES cashier_shifts(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(100) NOT NULL,
    table_number VARCHAR(50),
    customer_name VARCHAR(100),
    order_type VARCHAR(30) DEFAULT 'dine_in', -- 'dine_in', 'takeaway', 'delivery'
    order_source VARCHAR(30) DEFAULT 'pos_cashier', -- 'pos_cashier', 'kds_manual', 'qr_customer'
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'in_kitchen', 'ready', 'completed', 'cancelled'
    
    subtotal BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    service_charge_amount BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'partially_paid', 'refunded'
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    variant_id UUID REFERENCES product_variants(id),
    variant_name VARCHAR(100),
    unit_price BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal BIGINT NOT NULL,
    notes TEXT,
    modifiers_json JSONB DEFAULT '[]'::jsonb,
    kitchen_status VARCHAR(30) DEFAULT 'pending'
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES cashier_shifts(id) ON DELETE SET NULL,
    method VARCHAR(30) NOT NULL, -- 'cash', 'qris', 'debit_card', 'credit_card', 'bank_transfer'
    amount BIGINT NOT NULL,
    tendered_amount BIGINT,
    change_amount BIGINT,
    reference_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'successful',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. KITCHEN TICKETS (KDS)
CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    table_number VARCHAR(50),
    order_type VARCHAR(30) DEFAULT 'dine_in',
    status VARCHAR(30) DEFAULT 'queued', -- 'queued', 'preparing', 'ready', 'completed'
    station_id UUID REFERENCES kitchen_stations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES kitchen_tickets(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    notes TEXT,
    modifiers_summary TEXT,
    status VARCHAR(30) DEFAULT 'pending'
);

-- 10. REALTIME PUBLICATION FOR SUPABASE
-- Enables instant live updates for KDS, active shifts, and orders!
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE cashier_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_movements;

-- 11. SEED DATA FOR DEMO & TESTING
INSERT INTO modules (id, name, category, description, is_core, icon) VALUES
('core', 'Core Platform', 'core', 'Multi-tenant auth, RBAC, and audit logs.', TRUE, 'ShieldCheck'),
('order_management', 'Order Management', 'operations', 'Order lifecycle and routing.', FALSE, 'Receipt'),
('payment_management', 'Payment Management', 'finance', 'Cash, QRIS, card payments.', FALSE, 'CreditCard'),
('cashier_pos', 'Cashier POS Terminal', 'operations', 'Interactive cashier register.', FALSE, 'ShoppingCart'),
('cashier_shifts', 'Cashier & Shift Management', 'operations', 'Opening float and blind closing.', FALSE, 'Clock'),
('cash_management', 'Cash Drawer Management', 'finance', 'Cash in/out and drops.', FALSE, 'Wallet'),
('settlement', 'Settlement & Reconciliation', 'finance', 'Expected vs actual balancing.', FALSE, 'Scale'),
('kitchen_display', 'Kitchen Display System (KDS)', 'kitchen', 'Kitchen order queue display.', FALSE, 'ChefHat'),
('reporting', 'Reporting & Analytics', 'finance', 'Sales & shift breakdown.', FALSE, 'BarChart3'),
('inventory', 'Inventory Management', 'operations', 'Stock tracking & recipes.', FALSE, 'Boxes'),
('staff', 'Staff Management', 'operations', 'Employee schedules & PINs.', FALSE, 'Users'),
('qr_ordering', 'QR / Customer Ordering', 'customer', 'Customer table QR order.', FALSE, 'QrCode')
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_dependencies (module_id, required_module_id) VALUES
('order_management', 'core'),
('payment_management', 'core'),
('payment_management', 'order_management'),
('cashier_pos', 'core'),
('cashier_pos', 'order_management'),
('cashier_pos', 'payment_management'),
('cashier_shifts', 'core'),
('cashier_shifts', 'cashier_pos'),
('cash_management', 'core'),
('cash_management', 'cashier_shifts'),
('settlement', 'core'),
('settlement', 'payment_management'),
('settlement', 'cashier_shifts'),
('settlement', 'cash_management'),
('kitchen_display', 'core'),
('kitchen_display', 'order_management'),
('reporting', 'core'),
('reporting', 'order_management')
ON CONFLICT DO NOTHING;
