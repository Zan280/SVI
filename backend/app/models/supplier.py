from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    rfc_nit = Column(String(20), unique=True)
    contacto_nombre = Column(String(100))
    email = Column(String(150))
    telefono = Column(String(20))
    direccion = Column(Text)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relación inversa
    productos = relationship("InventarioBase", back_populates="proveedor")
