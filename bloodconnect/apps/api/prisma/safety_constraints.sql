-- ==============================================================
-- BLOODCONNECT SAFETY CONSTRAINTS & AUDIT TRIGGERS (PostgreSQL)
-- ==============================================================

-- 1. Append-Only Trigger for audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SAFETY VIOLATION: audit_logs is append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs;
CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- 2. Append-Only Trigger for case_status_history
CREATE OR REPLACE FUNCTION prevent_case_status_history_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SAFETY VIOLATION: case_status_history is immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_case_status_history_append_only ON case_status_history;
CREATE TRIGGER trg_case_status_history_append_only
BEFORE UPDATE OR DELETE ON case_status_history
FOR EACH ROW EXECUTE FUNCTION prevent_case_status_history_modification();

-- 3. Append-Only Trigger for request_status_history
CREATE OR REPLACE FUNCTION prevent_request_status_history_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SAFETY VIOLATION: request_status_history is immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_request_status_history_append_only ON request_status_history;
CREATE TRIGGER trg_request_status_history_append_only
BEFORE UPDATE OR DELETE ON request_status_history
FOR EACH ROW EXECUTE FUNCTION prevent_request_status_history_modification();

-- 4. Check constraint on donation_outcomes units_collected
ALTER TABLE donation_outcomes
ADD CONSTRAINT chk_units_collected_positive CHECK (units_collected >= 0 AND units_collected <= 10);

-- 5. Partial index for fast matching of available donors
CREATE INDEX IF NOT EXISTS idx_donors_active_matching
ON donor_profiles (blood_group, is_available)
WHERE is_available = true;

-- 6. Partial index for timer recovery sweeper
CREATE INDEX IF NOT EXISTS idx_emergency_cases_active_sweeper
ON emergency_cases (next_stage_due_at)
WHERE status IN ('ACTIVE_STAGE_1', 'ACTIVE_STAGE_2', 'NGO_ACTIVATED');

-- 7. Verification: Ensure donation_outcomes only inserted for open/active/resolving cases
CREATE OR REPLACE FUNCTION verify_donation_outcome_safety()
RETURNS TRIGGER AS $$
DECLARE
    case_rec RECORD;
BEGIN
    SELECT status, blood_centre_id INTO case_rec FROM emergency_cases WHERE id = NEW.case_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency case % does not exist', NEW.case_id;
    END IF;
    IF case_rec.status IN ('EXPIRED', 'CANCELLED', 'CLOSED') THEN
        RAISE EXCEPTION 'Cannot record outcomes on terminal case % in status %', NEW.case_id, case_rec.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_donation_outcomes_safety ON donation_outcomes;
CREATE TRIGGER trg_donation_outcomes_safety
BEFORE INSERT ON donation_outcomes
FOR EACH ROW EXECUTE FUNCTION verify_donation_outcome_safety();
