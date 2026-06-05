from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    role_id: int
    sucursal_id: Optional[int] = None
    activo: Optional[bool] = True


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    sucursal_id: Optional[int] = None
    activo: Optional[bool] = None
    password: Optional[str] = None


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    role_id: int
    sucursal_id: Optional[int] = None
    activo: bool
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True

