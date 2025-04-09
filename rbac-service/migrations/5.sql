-- migrations/005_create_audit_logs_table.sql
CREATE TABLE IF NOT EXISTS audit_logs (
                                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    actor_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(10) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(20) NULL,
    target_key VARCHAR(255) NULL,
    details JSON NULL,
    status VARCHAR(10) NOT NULL,
    error_message TEXT NULL,
    INDEX idx_timestamp (timestamp),
    INDEX idx_actor_id (actor_id),
    INDEX idx_actor_type (actor_type),
    INDEX idx_action (action),
    INDEX idx_target_type (target_type),
    INDEX idx_target_key (target_key),
    INDEX idx_status (status),
    INDEX idx_actor_timestamp (actor_id, timestamp),
    INDEX idx_action_timestamp (action, timestamp),
    INDEX idx_target_timestamp (target_type, target_key, timestamp)
    );