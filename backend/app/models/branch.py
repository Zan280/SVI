from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Sucursal(Base):
    __tablename__ = "sucursales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    direccion = Column(Text)
    telefono = Column(String(20))
    activa = Column(Boolean, default=True)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relaciones inversas
    usuarios = relationship("Usuario", back_populates="sucursal")
    stocks = relationship("InventarioSucursal", back_populates="sucursal")
    movimientos = relationship("MovimientoInventario", back_populates="sucursal")
