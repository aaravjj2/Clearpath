import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chat, completions, documents, provider_mgmt

load_dotenv()

app = FastAPI(title="ClearPath API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(completions.router)
app.include_router(provider_mgmt.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ClearPath API"}
