from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.schemas.inventory import InventarioOut
from app.schemas.branch import SucursalOut


class MovimientoRefOut(BaseModel):
    """Referencia mínima del MovimientoInventario para mostrar en el Kardex."""
    id: int
    referencia: Optional[str] = None
    tipo: Optional[str] = None

    class Config:
        from_attributes = True


class KardexBase(BaseModel):
    sucursal_id: int
    producto_id: int
    movimiento_id: Optional[int] = None
    tipo_movimiento: str
    cantidad_entrada: Decimal
    costo_entrada: Decimal
    cantidad_salida: Decimal
    costo_salida: Decimal
    cantidad_saldo: Decimal
    costo_unitario_saldo: Decimal
    costo_total_saldo: Decimal


class KardexCreate(KardexBase):
    pass


class KardexOut(KardexBase):
    id: int
    creado_en: datetime
    movimiento: Optional[MovimientoRefOut] = None

    class Config:
        from_attributes = True


class KardexDetail(KardexOut):
    producto: Optional[InventarioOut] = None
    sucursal: Optional[SucursalOut] = None

    class Config:
        from_attributes = True
