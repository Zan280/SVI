from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ProveedorBase(BaseModel):
    nombre: str
    rfc_nit: Optional[str] = None
    contacto_nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    rfc_nit: Optional[str] = None
    contacto_nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None


class ProveedorOut(ProveedorBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True
