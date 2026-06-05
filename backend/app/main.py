from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router

app = FastAPI(
    title="ERP API",
    description="API REST para el sistema ERP - Gestión de Usuarios, Clientes, Proveedores e Inventario",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://frontend:5173",     # Docker service name
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar router principal de API v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root():
    """Health check del backend."""
    return {
        "status": "online",
        "app": "ERP Backend API",
        "version": "1.0.0",
        "docs": "/docs",
    }
