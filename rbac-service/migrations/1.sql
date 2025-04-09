-- migrations/001_create_roles_table.sql
CREATE TABLE IF NOT EXISTS roles (
                                     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                     role_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role_key (role_key)
    );