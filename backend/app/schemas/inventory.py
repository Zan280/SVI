from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class InventarioBase(BaseModel):
    codigo_barras: str
    nombre: str
    descripcion: Optional[str] = None
    tipo_item: Optional[str] = "PRODUCTO"          # "PRODUCTO" | "SERVICIO"
    departamento: Optional[str] = None
    categoria_id: Optional[int] = None
    precio_compra: Optional[Decimal] = Decimal("0.00")
    precio_venta: Optional[Decimal] = Decimal("0.00")
    unidad_medida: Optional[str] = "PZA"
    proveedor_id: Optional[int] = None
    imagen_base64: Optional[str] = None


class InventarioCreate(InventarioBase):
    pass


class InventarioUpdate(BaseModel):
    codigo_barras: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo_item: Optional[str] = None
    departamento: Optional[str] = None
    categoria_id: Optional[int] = None
    precio_compra: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    unidad_medida: Optional[str] = None
    proveedor_id: Optional[int] = None
    imagen_base64: Optional[str] = None


class InventarioOut(InventarioBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True
