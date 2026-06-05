from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class KardexEntry(Base):
    __tablename__ = "kardex"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("inventario_base.id"), nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"), nullable=False)
    movimiento_id = Column(Integer, ForeignKey("movimientos_inventario.id"), nullable=False)
    tipo_movimiento = Column(String(40), nullable=False)
    # Entradas
    cantidad_entrada = Column(Numeric(12, 2), default=0.00)
    costo_entrada = Column(Numeric(12, 4), default=0.0000)
    # Salidas
    cantidad_salida = Column(Numeric(12, 2), default=0.00)
    costo_salida = Column(Numeric(12, 4), default=0.0000)
    # Saldo resultante (CPP)
    cantidad_saldo = Column(Numeric(12, 2), nullable=False)
    costo_unitario_saldo = Column(Numeric(12, 4), nullable=False)
    costo_total_saldo = Column(Numeric(12, 4), nullable=False)
    creado_en = Column(DateTime, server_default=func.now())

    # Relaciones
    producto = relationship("InventarioBase")
    sucursal = relationship("Sucursal")
    movimiento = relationship("MovimientoInventario", back_populates="kardex_entries")
