CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS entities (
  id text PRIMARY KEY, kind text NOT NULL, owner_id text, zone text,
  status text, version integer NOT NULL DEFAULT 1, data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entities_kind_status ON entities(kind,status);
CREATE INDEX IF NOT EXISTS entities_owner ON entities(owner_id,kind);
CREATE INDEX IF NOT EXISTS entities_zone ON entities(zone,kind,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS one_live_offer_per_driver_trip
  ON entities(owner_id,(data->>'tripId')) WHERE kind='offer' AND status='live';
CREATE UNIQUE INDEX IF NOT EXISTS one_active_trip_per_driver
  ON entities((data->>'driverId')) WHERE kind='trip' AND status IN ('Assigned','Driver arrived','In progress');
CREATE UNIQUE INDEX IF NOT EXISTS one_trip_per_quote
  ON entities(owner_id,(data->>'quoteId')) WHERE kind='trip' AND data ? 'quoteId';
CREATE TABLE IF NOT EXISTS idempotency (
  actor_id text NOT NULL, operation text NOT NULL, resource_id text NOT NULL,
  request_key text NOT NULL, fingerprint text NOT NULL, response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id,operation,resource_id,request_key)
);
CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY, event_type text NOT NULL, aggregate_id text NOT NULL,
  zone text, occurred_at timestamptz NOT NULL DEFAULT now(), payload jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS events_type_time ON events(event_type,occurred_at);
CREATE TABLE IF NOT EXISTS audit_log (
  id text PRIMARY KEY, actor_id text NOT NULL, action text NOT NULL,
  target_id text NOT NULL, reason text NOT NULL, before_state jsonb, after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS work_items (
  id text PRIMARY KEY, kind text NOT NULL, aggregate_id text NOT NULL,
  operation_key text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
  last_error text, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ratings (
  trip_id text NOT NULL, rider_id text NOT NULL, stars integer NOT NULL CHECK(stars BETWEEN 1 AND 5),
  feedback text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(trip_id,rider_id)
);
CREATE TABLE IF NOT EXISTS locations (
  assignment_id text PRIMARY KEY, driver_id text NOT NULL, epoch text NOT NULL,
  sequence bigint NOT NULL, lat double precision NOT NULL, lng double precision NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
