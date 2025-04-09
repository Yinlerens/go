-- migrations/002_create_permissions_table.sql
CREATE TABLE IF NOT EXISTS permissions (
                                           id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                           permission_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_permission_key (permission_key),
    INDEX idx_type (type)
    );