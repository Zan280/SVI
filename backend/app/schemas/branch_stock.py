from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.schemas.inventory import InventarioOut


class InventarioSucursalBase(BaseModel):
    sucursal_id: int
    producto_id: int
    stock: Decimal = Decimal("0.00")
    stock_minimo: Decimal = Decimal("0.00")
    costo_medio: Decimal = Decimal("0.00")


class InventarioSucursalCreate(InventarioSucursalBase):
    pass


class InventarioSucursalUpdate(BaseModel):
    stock: Optional[Decimal] = None
    stock_minimo: Optional[Decimal] = None
    costo_medio: Optional[Decimal] = None


class InventarioSucursalOut(InventarioSucursalBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class InventarioSucursalDetail(InventarioSucursalOut):
    producto: Optional[InventarioOut] = None

    class Config:
        from_attributes = True
