-- migrations/004_create_role_permissions_table.sql
CREATE TABLE IF NOT EXISTS role_permissions (
                                                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                role_key VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role_key (role_key),
    INDEX idx_permission_key (permission_key),
    UNIQUE INDEX uk_role_permission (role_key, permission_key)
    );