"""
Upload local bucket files to Supabase Storage.

Usage:
  python scripts/upload_to_supabase.py

Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from environment (or .env).
Set SKIP_EXISTING=1 to skip files already uploaded (for resuming).
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # use service key, not anon key

BUCKET_DIR = Path(__file__).parent.parent.parent / "bucket"
SKIP_EXISTING = os.getenv("SKIP_EXISTING", "1") == "1"

UPLOADS = [
    {
        "local_dir": BUCKET_DIR / "videos",
        "bucket": "duosign-videos",
        "mime": "video/mp4",
        "glob": "*.mp4",
    },
    {
        "local_dir": BUCKET_DIR / "poses_v3",
        "bucket": "duosign-poses",
        "mime": "application/octet-stream",
        "glob": "*.pose",
    },
]

try:
    from supabase import create_client
except ImportError:
    print("supabase package not installed. Run: pip install supabase")
    sys.exit(1)


def upload_dir(client, local_dir: Path, bucket: str, mime: str, glob: str):
    files = sorted(local_dir.glob(glob))
    if not files:
        print(f"  No files found in {local_dir}")
        return

    print(f"\nUploading {len(files)} files → bucket '{bucket}'")

    ok = skipped = failed = 0

    for i, path in enumerate(files, 1):
        dest = path.name  # flat structure: ACCEPT.mp4, BOOK.pose, etc.

        if SKIP_EXISTING:
            try:
                existing = client.storage.from_(bucket).list()
                names = {f["name"] for f in existing}
                if dest in names:
                    skipped += 1
                    continue
            except Exception:
                pass  # if list() fails just try to upload

        try:
            with open(path, "rb") as f:
                data = f.read()
            client.storage.from_(bucket).upload(
                dest,
                data,
                {"content-type": mime, "upsert": "false"},
            )
            ok += 1
        except Exception as e:
            err = str(e)
            if "already exists" in err.lower() or "duplicate" in err.lower():
                skipped += 1
            else:
                print(f"  FAILED {dest}: {err}")
                failed += 1

        if i % 100 == 0 or i == len(files):
            print(f"  {i}/{len(files)} — ok={ok} skipped={skipped} failed={failed}")

    print(f"Done: {ok} uploaded, {skipped} skipped, {failed} failed")


def main():
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print(f"Connected to: {SUPABASE_URL}")

    for job in UPLOADS:
        upload_dir(client, job["local_dir"], job["bucket"], job["mime"], job["glob"])

    print("\nAll done. Set these env vars on Render:")
    print(f"  SUPABASE_URL={SUPABASE_URL}")
    print(f"  SUPABASE_STORAGE_URL={SUPABASE_URL}/storage/v1/object/public")


if __name__ == "__main__":
    main()
