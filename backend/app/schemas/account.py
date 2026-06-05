from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PlanCuentasBase(BaseModel):
    codigo: str
    nombre: str
    tipo: str  # ACTIVO, PASIVO, PATRIMONIO, INGRESO, COSTO, GASTO
    naturaleza: str  # DEUDORA, ACREEDORA
    cuenta_padre_id: Optional[int] = None
    es_detalle: Optional[bool] = False


class PlanCuentasCreate(PlanCuentasBase):
    pass


class PlanCuentasUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    naturaleza: Optional[str] = None
    cuenta_padre_id: Optional[int] = None
    es_detalle: Optional[bool] = None


class PlanCuentasOut(PlanCuentasBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True


# Para representar el árbol jerárquico del catálogo
class PlanCuentasNode(PlanCuentasOut):
    subcuentas: List['PlanCuentasNode'] = []

    class Config:
        from_attributes = True
