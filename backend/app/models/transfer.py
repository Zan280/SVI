from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Traslado(Base):
    __tablename__ = "traslados"

    id = Column(Integer, primary_key=True, index=True)
    sucursal_origen_id = Column(Integer, ForeignKey("sucursales.id"), nullable=False)
    sucursal_destino_id = Column(Integer, ForeignKey("sucursales.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("inventario_base.id"), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False)
    estado = Column(String(20), nullable=False, default="PENDIENTE")
    # PENDIENTE → AUTORIZADO (origen aprueba salida) → APROBADO (destino confirma recepción) → COMPLETADO
    solicitado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    autorizado_por = Column(Integer, ForeignKey("usuarios.id"))
    aprobado_por = Column(Integer, ForeignKey("usuarios.id"))
    notas = Column(Text)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relaciones
    sucursal_origen = relationship("Sucursal", foreign_keys=[sucursal_origen_id])
    sucursal_destino = relationship("Sucursal", foreign_keys=[sucursal_destino_id])
    producto = relationship("InventarioBase")
    solicitante = relationship("Usuario", foreign_keys=[solicitado_por])
    autorizador = relationship("Usuario", foreign_keys=[autorizado_por])
    aprobador = relationship("Usuario", foreign_keys=[aprobado_por])
    movimientos = relationship("MovimientoInventario", back_populates="traslado")
