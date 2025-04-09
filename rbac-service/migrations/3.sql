-- migrations/003_create_user_roles_table.sql
CREATE TABLE IF NOT EXISTS user_roles (
                                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          user_id VARCHAR(36) NOT NULL,
    role_key VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_role_key (role_key),
    UNIQUE INDEX uk_user_role (user_id, role_key)
    );