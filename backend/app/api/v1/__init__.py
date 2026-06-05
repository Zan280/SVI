from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, clients, suppliers, inventory,
    branches, categories, movements, transfers,
    kardex, accounting, reports, dashboard, facturacion
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/usuarios", tags=["Usuarios"])
api_router.include_router(clients.router, prefix="/clientes", tags=["Clientes"])
api_router.include_router(suppliers.router, prefix="/proveedores", tags=["Proveedores"])
api_router.include_router(inventory.router, prefix="/inventario", tags=["Inventario"])
api_router.include_router(branches.router, prefix="/sucursales", tags=["Sucursales"])
api_router.include_router(categories.router, prefix="/categorias", tags=["Categorías"])
api_router.include_router(movements.router, prefix="/movimientos", tags=["Movimientos"])
api_router.include_router(transfers.router, prefix="/traslados", tags=["Traslados"])
api_router.include_router(kardex.router, prefix="/kardex", tags=["Kardex"])
api_router.include_router(accounting.router, prefix="/contabilidad", tags=["Contabilidad"])
api_router.include_router(reports.router, prefix="/reportes", tags=["Reportes"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(facturacion.router, prefix="/facturacion", tags=["Facturación"])
