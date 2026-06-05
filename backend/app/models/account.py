from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PlanCuentas(Base):
    __tablename__ = "plan_cuentas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    tipo = Column(String(20), nullable=False)       # ACTIVO, PASIVO, PATRIMONIO, INGRESO, COSTO, GASTO
    naturaleza = Column(String(10), nullable=False)  # DEUDORA, ACREEDORA
    cuenta_padre_id = Column(Integer, ForeignKey("plan_cuentas.id"))
    es_detalle = Column(Boolean, default=False)
    creado_en = Column(DateTime, server_default=func.now())

    # Relaciones
    cuenta_padre = relationship("PlanCuentas", remote_side=[id], backref="subcuentas")
    detalles_asiento = relationship("DetalleAsiento", back_populates="cuenta")
