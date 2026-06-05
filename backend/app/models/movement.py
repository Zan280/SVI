from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from app.database import Base


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("inventario_base.id"), nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=False)
    tipo = Column(String(20), nullable=False)  # INGRESO, SALIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO, TRASLADO_SALIDA, TRASLADO_INGRESO
    cantidad = Column(Numeric(12, 2), nullable=False)
    costo_unitario = Column(Numeric(12, 4), default=0.0000)
    costo_total = Column(Numeric(12, 4), default=0.0000)
    referencia = Column(String(100))
    notas = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    traslado_id = Column(Integer, ForeignKey("traslados.id"))
    
    # Mapear creado_en a la columna física "fecha" en la BD
    creado_en = Column("fecha", DateTime, server_default=func.now())
    fecha = synonym("creado_en")

    # Relaciones
    producto = relationship("InventarioBase")
    sucursal = relationship("Sucursal", back_populates="movimientos")
    usuario = relationship("Usuario")
    traslado = relationship("Traslado", back_populates="movimientos")
    kardex_entries = relationship("KardexEntry", back_populates="movimiento")
    asientos = relationship("AsientoContable", back_populates="movimiento")
