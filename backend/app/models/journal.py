from sqlalchemy import Column, Integer, String, Numeric, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AsientoContable(Base):
    __tablename__ = "asientos_contables"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(30), unique=True, nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion = Column(Text, nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursales.id"))
    movimiento_id = Column(Integer, ForeignKey("movimientos_inventario.id"))
    estado = Column(String(15), default="REGISTRADO")
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    creado_en = Column(DateTime, server_default=func.now())

    # Relaciones
    sucursal = relationship("Sucursal")
    movimiento = relationship("MovimientoInventario", back_populates="asientos")
    creador = relationship("Usuario")
    detalles = relationship("DetalleAsiento", back_populates="asiento", cascade="all, delete-orphan")


class DetalleAsiento(Base):
    __tablename__ = "detalle_asientos"

    id = Column(Integer, primary_key=True, index=True)
    asiento_id = Column(Integer, ForeignKey("asientos_contables.id", ondelete="CASCADE"), nullable=False)
    cuenta_id = Column(Integer, ForeignKey("plan_cuentas.id"), nullable=False)
    debe = Column(Numeric(14, 2), default=0.00)
    haber = Column(Numeric(14, 2), default=0.00)
    glosa = Column(String(255))

    # Relaciones
    asiento = relationship("AsientoContable", back_populates="detalles")
    cuenta = relationship("PlanCuentas", back_populates="detalles_asiento")
