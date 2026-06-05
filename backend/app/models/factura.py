from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FacturaVenta(Base):
    """Cabecera de la factura de venta (agrupa líneas de venta)."""
    __tablename__ = "facturas_venta"

    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String(20), unique=True, nullable=False, index=True)
    cliente_nombre = Column(String(200), nullable=True, default="Cliente General")
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    total_venta = Column(Numeric(12, 2), default=0.00)
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime, server_default=func.now())

    # Relaciones
    sucursal = relationship("Sucursal")
    usuario = relationship("Usuario")
    lineas = relationship("LineaFactura", back_populates="factura", cascade="all, delete-orphan")


class LineaFactura(Base):
    """Línea de detalle de una factura de venta."""
    __tablename__ = "lineas_factura"

    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas_venta.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("inventario_base.id"), nullable=False)
    tipo_item = Column(String(20), nullable=False)          # snapshot: "PRODUCTO" o "SERVICIO"
    cantidad = Column(Numeric(12, 2), nullable=False)
    precio_venta = Column(Numeric(12, 2), nullable=False)   # precio al público en el momento de venta
    costo_cpp = Column(Numeric(12, 4), default=0.0000)      # CPP en el momento (solo Productos)
    subtotal = Column(Numeric(12, 2), nullable=False)

    # Relaciones
    factura = relationship("FacturaVenta", back_populates="lineas")
    producto = relationship("InventarioBase", back_populates="lineas_factura")
