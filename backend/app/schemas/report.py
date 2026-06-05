from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime


class StockValuationRow(BaseModel):
    producto_id: int
    codigo_barras: str
    nombre: str
    categoria: Optional[str] = None
    unidad_medida: str
    stock: Decimal
    costo_medio: Decimal
    valoracion: Decimal
    stock_minimo: Decimal
    alerta_stock: bool


class DashboardStats(BaseModel):
    valoracion_total: Decimal
    total_productos: int
    total_sucursales: int
    transferencias_pendientes: int
    movimientos_mes: int


class CategoryDistribution(BaseModel):
    categoria: str
    valoracion: Decimal
    cantidad: Decimal


class MonthlyMovementsTrend(BaseModel):
    mes: str  # YYYY-MM
    ingresos: Decimal
    egresos: Decimal


class AccountBalanceRow(BaseModel):
    codigo: str
    nombre: str
    tipo: str
    debe: Decimal
    haber: Decimal
    saldo: Decimal  # Deudor o acreedor depending on type/nature
