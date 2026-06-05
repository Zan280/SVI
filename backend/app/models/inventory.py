from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class InventarioBase(Base):
    __tablename__ = "inventario_base"

    id = Column(Integer, primary_key=True, index=True)
    codigo_barras = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    # Tipo de ítem: "PRODUCTO" (con control de stock) o "SERVICIO" (sin stock)
    tipo_item = Column(String(20), nullable=False, default="PRODUCTO")
    # Departamento/Categoría libre (sin FK, para flexibilidad)
    departamento = Column(String(100), nullable=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True)
    precio_compra = Column(Numeric(12, 2), default=0.00)
    precio_venta = Column(Numeric(12, 2), default=0.00)
    unidad_medida = Column(String(20), default="PZA")
    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="SET NULL"))
    # Imagen en Base64 (para foto del ítem)
    imagen_base64 = Column(Text, nullable=True)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relaciones
    categoria = relationship("Categoria", back_populates="productos")
    proveedor = relationship("Proveedor", back_populates="productos")
    stocks_sucursal = relationship("InventarioSucursal", back_populates="producto")
    lineas_factura = relationship("LineaFactura", back_populates="producto")
