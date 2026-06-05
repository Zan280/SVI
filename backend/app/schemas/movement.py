from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.schemas.inventory import InventarioOut


class MovimientoInventarioBase(BaseModel):
    sucursal_id: int
    producto_id: int
    tipo: str  # INGRESO_COMPRA, SALIDA_VENTA, TRASLADO_INGRESO, TRASLADO_SALIDA, AJUSTE_INGRESO, AJUSTE_SALIDA
    cantidad: Decimal
    costo_unitario: Decimal
    costo_total: Decimal
    referencia: Optional[str] = None
    usuario_id: int


class MovimientoInventarioCreate(BaseModel):
    sucursal_id: int
    producto_id: int
    tipo: str
    cantidad: Decimal
    costo_unitario: Optional[Decimal] = None  # Si no se envía, se puede autocalcular (o tomar costo medio)
    referencia: Optional[str] = None


class MovimientoInventarioOut(MovimientoInventarioBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True


class MovimientoInventarioDetail(MovimientoInventarioOut):
    producto: Optional[InventarioOut] = None
    nombre_sucursal: Optional[str] = None  # Campo extra para facilitar lectura
    nombre_usuario: Optional[str] = None

    class Config:
        from_attributes = True
