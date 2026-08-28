CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  role app_role NOT NULL DEFAULT 'vendedor',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

CREATE UNIQUE INDEX users_email_lower_idx ON public.users (lower(email));

GRANT ALL ON public.users TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
