from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class InventarioSucursal(Base):
    __tablename__ = "inventario_sucursal"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("inventario_base.id", ondelete="CASCADE"), nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id", ondelete="CASCADE"), nullable=False)
    stock = Column("stock_actual", Numeric(12, 2), default=0.00)
    stock_minimo = Column(Numeric(12, 2), default=0.00)
    costo_medio = Column("costo_promedio", Numeric(12, 4), default=0.0000)
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint("producto_id", "sucursal_id", name="uq_producto_sucursal"),)

    # Relaciones
    producto = relationship("InventarioBase", back_populates="stocks_sucursal")
    sucursal = relationship("Sucursal", back_populates="stocks")
