-- Enum additions must commit before later migrations reference the new value.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'chat_message';
