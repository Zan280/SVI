from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime
from app.schemas.account import PlanCuentasOut


class DetalleAsientoBase(BaseModel):
    cuenta_id: int
    debe: Decimal = Decimal("0.00")
    haber: Decimal = Decimal("0.00")
    glosa: Optional[str] = None


class DetalleAsientoCreate(DetalleAsientoBase):
    pass


class DetalleAsientoOut(DetalleAsientoBase):
    id: int
    asiento_id: int

    class Config:
        from_attributes = True


class DetalleAsientoDetail(DetalleAsientoOut):
    cuenta: Optional[PlanCuentasOut] = None

    class Config:
        from_attributes = True


class AsientoContableBase(BaseModel):
    fecha: date
    descripcion: str
    sucursal_id: Optional[int] = None
    movimiento_id: Optional[int] = None
    estado: Optional[str] = "REGISTRADO"


class AsientoContableCreate(AsientoContableBase):
    detalles: List[DetalleAsientoCreate]


class AsientoContableOut(AsientoContableBase):
    id: int
    numero: str
    creado_por: int
    creado_en: datetime

    class Config:
        from_attributes = True


class AsientoContableDetail(AsientoContableOut):
    detalles: List[DetalleAsientoDetail] = []
    nombre_sucursal: Optional[str] = None
    nombre_creador: Optional[str] = None

    class Config:
        from_attributes = True
