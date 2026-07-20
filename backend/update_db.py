import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found in .env")
    exit(1)

engine = create_engine(db_url)

with engine.begin() as conn:
    # 1. Update user
    print("Updating Bhaveshaggarwal143@Gmail.com to admin and growth plan...")
    res = conn.execute(text("UPDATE public.profiles SET role = 'admin', plan = 'growth' WHERE lower(email) = 'bhaveshaggarwal143@gmail.com'"))
    print(f"Rows updated: {res.rowcount}")

    # 2. Add RLS policy for admins to update profiles
    print("Adding RLS policy for profiles_admin_update...")
    conn.execute(text("""
    drop policy if exists "profiles_admin_update" on public.profiles;
    create policy "profiles_admin_update" on public.profiles
      for update using (public.is_admin()) with check (public.is_admin());
    """))
    print("Done.")
