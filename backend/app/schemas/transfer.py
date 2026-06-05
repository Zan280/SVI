from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.schemas.inventory import InventarioOut
from app.schemas.branch import SucursalOut


class TrasladoBase(BaseModel):
    sucursal_origen_id: int
    sucursal_destino_id: int
    producto_id: int
    cantidad: Decimal
    estado: str  # PENDIENTE, AUTORIZADO, APROBADO, RECHAZADO
    usuario_envia_id: Optional[int] = None
    usuario_recibe_id: Optional[int] = None


class TrasladoCreate(BaseModel):
    sucursal_origen_id: int
    sucursal_destino_id: int
    producto_id: int
    cantidad: Decimal


class TrasladoUpdate(BaseModel):
    estado: str  # AUTORIZADO, APROBADO, RECHAZADO
    usuario_recibe_id: Optional[int] = None


class TrasladoOut(TrasladoBase):
    id: int
    creado_en: datetime
    autorizado_en: Optional[datetime] = None
    recibido_en: Optional[datetime] = None

    class Config:
        from_attributes = True


class TrasladoDetail(TrasladoOut):
    producto: Optional[InventarioOut] = None
    sucursal_origen: Optional[SucursalOut] = None
    sucursal_destino: Optional[SucursalOut] = None
    nombre_usuario_envia: Optional[str] = None
    nombre_usuario_recibe: Optional[str] = None

    class Config:
        from_attributes = True
