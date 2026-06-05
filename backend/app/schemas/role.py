from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RoleBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    permisos: Optional[dict] = {}


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    permisos: Optional[dict] = None


class RoleOut(RoleBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True
