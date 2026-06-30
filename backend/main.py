from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import sqlite3
import json
import os
import uuid
import aiofiles
import httpx
import re
import xml.etree.ElementTree as ET
from functools import lru_cache

# ── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
DB_PATH = os.getenv("DB_PATH", "newspaper.db")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Newspaper API")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_raw_origins != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# ── Database ─────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            excerpt TEXT,
            content TEXT NOT NULL,
            thumbnail TEXT,
            category TEXT NOT NULL,
            author TEXT NOT NULL,
            is_featured INTEGER DEFAULT 0,
            published_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS breaking_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)

    # Default admin
    existing = c.execute("SELECT id FROM users WHERE username='admin'").fetchone()
    if not existing:
        hashed = pwd_context.hash("NewsAdmin@2024")
        c.execute("INSERT INTO users (username, hashed_password, is_admin) VALUES (?,?,1)",
                  ("admin", hashed))

    # Default YouTube settings
    c.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('youtube_channel_id','@gunaplushindi')")
    c.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('youtube_embed_id','')")
    c.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('site_name','मेरा समाचार')")
    c.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('site_tagline','आपका विश्वसनीय समाचार स्रोत')")
    c.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('site_city','आपका शहर, मध्य प्रदेश')")

    # Sample breaking news (only inserted once on first run)
    c.execute("INSERT OR IGNORE INTO breaking_news (id,text) VALUES (1,'ब्रेकिंग: विधानसभा सत्र आज से शुरू')")
    c.execute("INSERT OR IGNORE INTO breaking_news (id,text) VALUES (2,'मौसम अपडेट: आज से मानसून की शुरुआत')")

    conn.commit()
    conn.close()

init_db()

@app.on_event("startup")
async def prewarm_youtube():
    """Fetch RSS on startup so first browser request is instant."""
    try:
        conn = get_db()
        s = {r["key"]: r["value"] for r in conn.execute("SELECT key,value FROM settings").fetchall()}
        conn.close()
        handle = (s.get("youtube_channel_id") or "").strip()
        if not handle or handle == "UCxxxxxxxxxxxxxxx":
            return
        channel_id = await resolve_channel_id(handle)
        if not channel_id:
            return
        rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(rss_url, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code == 200:
            videos = _parse_rss(resp.text)
            _rss_cache[channel_id] = (videos, datetime.utcnow())
    except Exception:
        pass

# ── Auth Helpers ─────────────────────────────────────────────────────────────
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def hash_password(pw): return pwd_context.hash(pw)

def create_token(data: dict):
    exp = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({**data, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    cred_exc = HTTPException(status_code=401, detail="Invalid credentials",
                             headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username: raise cred_exc
    except JWTError:
        raise cred_exc
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
    conn.close()
    if not user: raise cred_exc
    return dict(user)

def require_admin(user=Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ── Schemas ───────────────────────────────────────────────────────────────────
class ArticleCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    thumbnail: Optional[str] = None
    category: str
    author: str
    is_featured: bool = False

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    is_featured: Optional[bool] = None

class BreakingNewsCreate(BaseModel):
    text: str

class SettingsUpdate(BaseModel):
    value: str

# ── Auth Routes ───────────────────────────────────────────────────────────────
@app.post("/api/auth/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=?", (form.username,)).fetchone()
    conn.close()
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    token = create_token({"sub": user["username"], "is_admin": user["is_admin"]})
    return {"access_token": token, "token_type": "bearer", "is_admin": user["is_admin"]}

@app.get("/api/auth/me")
def me(user=Depends(get_current_user)):
    return {"username": user["username"], "is_admin": user["is_admin"]}

# ── Articles (Public) ─────────────────────────────────────────────────────────
@app.get("/api/articles")
def list_articles(category: Optional[str] = None, featured: Optional[bool] = None,
                  limit: int = 20, offset: int = 0):
    conn = get_db()
    q = "SELECT * FROM articles WHERE 1=1"
    params = []
    if category:
        q += " AND category=?"; params.append(category)
    if featured is not None:
        q += " AND is_featured=?"; params.append(1 if featured else 0)
    q += " ORDER BY published_at DESC LIMIT ? OFFSET ?"
    params += [limit, offset]
    rows = conn.execute(q, params).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    conn.close()
    return {"articles": [dict(r) for r in rows], "total": total}

@app.get("/api/articles/{slug}")
def get_article(slug: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM articles WHERE slug=?", (slug,)).fetchone()
    conn.close()
    if not row: raise HTTPException(404, "Article not found")
    return dict(row)

# ── Articles (Admin) ──────────────────────────────────────────────────────────
@app.post("/api/admin/articles")
def create_article(article: ArticleCreate, admin=Depends(require_admin)):
    if article.slug:
        slug = article.slug
    else:
        ascii_part = re.sub(r'[^\x00-\x7F]+', '', article.title.lower().replace(" ", "-")).strip("-")[:40]
        slug = (ascii_part + "-" if len(ascii_part) > 3 else "article-") + uuid.uuid4().hex[:8]
    conn = get_db()
    try:
        conn.execute("""INSERT INTO articles (title,slug,excerpt,content,thumbnail,category,author,is_featured)
                        VALUES (?,?,?,?,?,?,?,?)""",
                     (article.title, slug, article.excerpt, article.content,
                      article.thumbnail, article.category, article.author, int(article.is_featured)))
        conn.commit()
        row = conn.execute("SELECT * FROM articles WHERE slug=?", (slug,)).fetchone()
        conn.close()
        return dict(row)
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(400, "Slug already exists")

@app.put("/api/admin/articles/{article_id}")
def update_article(article_id: int, article: ArticleUpdate, admin=Depends(require_admin)):
    conn = get_db()
    try:
        existing = conn.execute("SELECT * FROM articles WHERE id=?", (article_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Article not found")
        updates = {k: v for k, v in article.dict().items() if v is not None}
        if "is_featured" in updates:
            updates["is_featured"] = int(updates["is_featured"])
        updates["updated_at"] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{k}=?" for k in updates)
        conn.execute(f"UPDATE articles SET {set_clause} WHERE id=?", list(updates.values()) + [article_id])
        conn.commit()
        row = conn.execute("SELECT * FROM articles WHERE id=?", (article_id,)).fetchone()
        return dict(row)
    except HTTPException:
        raise
    except sqlite3.IntegrityError as e:
        raise HTTPException(400, f"Update failed: {e}")
    finally:
        conn.close()

@app.delete("/api/admin/articles/{article_id}")
def delete_article(article_id: int, admin=Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM articles WHERE id=?", (article_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@app.get("/api/admin/export")
def export_articles(admin=Depends(require_admin)):
    """Download all articles + breaking news as a JSON backup."""
    from fastapi.responses import JSONResponse
    conn = get_db()
    articles = [dict(r) for r in conn.execute("SELECT * FROM articles ORDER BY id").fetchall()]
    breaking = [dict(r) for r in conn.execute("SELECT * FROM breaking_news ORDER BY id").fetchall()]
    conn.close()
    return JSONResponse(
        content={"articles": articles, "breaking_news": breaking},
        headers={"Content-Disposition": "attachment; filename=newspaper_backup.json"},
    )

@app.post("/api/admin/import")
def import_articles(payload: dict, admin=Depends(require_admin)):
    """Restore articles from a previously exported JSON backup."""
    articles = payload.get("articles", [])
    breaking = payload.get("breaking_news", [])
    conn = get_db()
    try:
        for a in articles:
            a.pop("id", None)
            conn.execute(
                """INSERT OR IGNORE INTO articles
                   (title,slug,excerpt,content,thumbnail,category,author,is_featured,published_at,updated_at)
                   VALUES (:title,:slug,:excerpt,:content,:thumbnail,:category,:author,:is_featured,:published_at,:updated_at)""",
                {k: a.get(k) for k in ("title","slug","excerpt","content","thumbnail","category","author","is_featured","published_at","updated_at")},
            )
        for b in breaking:
            b.pop("id", None)
            conn.execute(
                "INSERT OR IGNORE INTO breaking_news (text,is_active,created_at) VALUES (:text,:is_active,:created_at)",
                {k: b.get(k) for k in ("text","is_active","created_at")},
            )
        conn.commit()
        return {"message": f"Imported {len(articles)} articles, {len(breaking)} breaking news items"}
    finally:
        conn.close()

@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...), admin=Depends(require_admin)):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
        raise HTTPException(400, "Only image files allowed")
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)
    return {"url": f"/uploads/{filename}", "filename": filename}

# ── Breaking News ─────────────────────────────────────────────────────────────
@app.get("/api/breaking-news")
def list_breaking():
    conn = get_db()
    rows = conn.execute("SELECT * FROM breaking_news WHERE is_active=1 ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/admin/breaking-news")
def create_breaking(news: BreakingNewsCreate, admin=Depends(require_admin)):
    conn = get_db()
    conn.execute("INSERT INTO breaking_news (text) VALUES (?)", (news.text,))
    conn.commit()
    conn.close()
    return {"message": "Created"}

@app.put("/api/admin/breaking-news/{news_id}")
def update_breaking(news_id: int, news: BreakingNewsCreate, admin=Depends(require_admin)):
    conn = get_db()
    conn.execute("UPDATE breaking_news SET text=? WHERE id=?", (news.text, news_id))
    conn.commit(); conn.close()
    return {"message": "Updated"}

@app.delete("/api/admin/breaking-news/{news_id}")
def delete_breaking(news_id: int, admin=Depends(require_admin)):
    conn = get_db()
    
    conn.execute("DELETE FROM breaking_news WHERE id=?", (news_id,))
    conn.commit(); conn.close()
    return {"message": "Deleted"}

# ── Settings ──────────────────────────────────────────────────────────────────
@app.get("/api/settings")
def get_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

@app.put("/api/admin/settings/{key}")
def update_setting(key: str, data: SettingsUpdate, admin=Depends(require_admin)):
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)", (key, data.value))
    conn.commit(); conn.close()
    return {"message": "Updated"}

# ── YouTube ───────────────────────────────────────────────────────────────────
_rss_cache: dict = {}  # channel_id → (videos, fetched_at)

def _db_get_channel_id() -> Optional[str]:
    conn = get_db()
    row = conn.execute("SELECT value FROM settings WHERE key='youtube_resolved_channel_id'").fetchone()
    conn.close()
    return row["value"] if row and row["value"] else None

def _db_save_channel_id(cid: str):
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('youtube_resolved_channel_id',?)", (cid,))
    conn.commit(); conn.close()

async def resolve_channel_id(handle: str) -> Optional[str]:
    if handle.startswith("UC"):
        return handle
    # Try DB cache first (survives restarts)
    cached = _db_get_channel_id()
    if cached:
        return cached
    url = f"https://www.youtube.com/{handle}" if handle.startswith("@") else f"https://www.youtube.com/user/{handle}"
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as c:
            resp = await c.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            if resp.status_code != 200:
                return None
            m = re.search(r'"externalId":"(UC[^"]{20,})"', resp.text) or \
                re.search(r'"channelId":"(UC[^"]{20,})"', resp.text)
            if not m:
                return None
            cid = m.group(1)
            _db_save_channel_id(cid)
            return cid
    except Exception:
        return None

def _parse_rss(xml_text: str) -> list:
    root = ET.fromstring(xml_text)
    ns = {
        "atom":  "http://www.w3.org/2005/Atom",
        "yt":    "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }
    videos = []
    for entry in root.findall("atom:entry", ns):
        vid_id = entry.find("yt:videoId", ns).text
        title  = entry.find("atom:title",  ns).text
        published = entry.find("atom:published", ns).text
        thumb_el  = entry.find("media:group/media:thumbnail", ns)
        videos.append({
            "video_id":  vid_id,
            "title":     title,
            "published": published,
            "thumbnail": thumb_el.get("url") if thumb_el is not None else None,
            "embed_url": f"https://www.youtube.com/embed/{vid_id}?rel=0&modestbranding=1",
        })
    return videos[:6]

@app.get("/api/youtube/latest")
async def youtube_latest():
    conn = get_db()
    s = {r["key"]: r["value"] for r in conn.execute("SELECT key,value FROM settings").fetchall()}
    conn.close()
    handle = (s.get("youtube_channel_id") or "").strip()
    if not handle or handle == "UCxxxxxxxxxxxxxxx":
        raise HTTPException(404, "YouTube channel not configured")

    channel_id = await resolve_channel_id(handle)
    if not channel_id:
        raise HTTPException(502, "Could not resolve channel ID — check handle in settings")

    # Return cached RSS if fresh (10 min)
    now = datetime.utcnow()
    if channel_id in _rss_cache:
        videos, fetched_at = _rss_cache[channel_id]
        if (now - fetched_at).total_seconds() < 600:
            return {"videos": videos, "channel_id": channel_id, "cached": True}

    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(rss_url, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            raise HTTPException(502, f"YouTube RSS returned {resp.status_code}")
        videos = _parse_rss(resp.text)
        _rss_cache[channel_id] = (videos, now)
        return {"videos": videos, "channel_id": channel_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"RSS error: {e}")

# ── Social Share Preview ──────────────────────────────────────────────────────
@app.get("/share/{slug}", response_class=None)
def share_preview(slug: str):
    from fastapi.responses import HTMLResponse
    conn = get_db()
    row = conn.execute("SELECT * FROM articles WHERE slug=?", (slug,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Article not found")
    article = dict(row)

    frontend_url = os.environ.get("FRONTEND_URL", "https://newspaper-gnp.vercel.app")
    redirect_url = f"{frontend_url}/?article={slug}"

    thumbnail = article.get("thumbnail") or ""
    if thumbnail and not thumbnail.startswith("http"):
        backend_url = os.environ.get("BACKEND_URL", "")
        thumbnail = f"{backend_url}{thumbnail}"

    title = article.get("title", "Guna Plus E-Paper")
    excerpt = article.get("excerpt", "")

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>{title} | Guna Plus E-Paper</title>
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="Guna Plus E-Paper"/>
  <meta property="og:title" content="{title}"/>
  <meta property="og:description" content="{excerpt}"/>
  <meta property="og:url" content="{redirect_url}"/>
  {f'<meta property="og:image" content="{thumbnail}"/>' if thumbnail else ''}
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{title}"/>
  {f'<meta name="twitter:image" content="{thumbnail}"/>' if thumbnail else ''}
  <meta http-equiv="refresh" content="0;url={redirect_url}"/>
  <script>window.location.replace("{redirect_url}")</script>
</head>
<body></body>
</html>"""
    return HTMLResponse(content=html)

# ── Categories ────────────────────────────────────────────────────────────────
@app.get("/api/categories")
def get_categories():
    return ["होम", "राजनीति", "खेल", "मनोरंजन", "व्यापार", "राज्य", "देश-दुनिया", "अपराध", "स्वास्थ्य"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)