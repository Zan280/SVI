from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.inventory import InventarioOut


class LineaFacturaCreate(BaseModel):
    producto_id: int
    cantidad: Decimal


class LineaFacturaOut(BaseModel):
    id: int
    producto_id: int
    tipo_item: str
    cantidad: Decimal
    precio_venta: Decimal
    costo_cpp: Decimal
    subtotal: Decimal
    producto: Optional[InventarioOut] = None

    class Config:
        from_attributes = True


class FacturaVentaCreate(BaseModel):
    cliente_nombre: Optional[str] = "Cliente General"
    notas: Optional[str] = None
    lineas: List[LineaFacturaCreate]


class FacturaVentaOut(BaseModel):
    id: int
    numero_factura: str
    cliente_nombre: Optional[str]
    sucursal_id: int
    usuario_id: int
    total_venta: Decimal
    notas: Optional[str]
    creado_en: datetime
    lineas: List[LineaFacturaOut] = []

    class Config:
        from_attributes = True
