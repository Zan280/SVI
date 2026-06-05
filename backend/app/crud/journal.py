from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.models.journal import AsientoContable


def get_asientos(db: Session, sucursal_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(AsientoContable)
    if sucursal_id is not None:
        query = query.filter(AsientoContable.sucursal_id == sucursal_id)
    return query.order_by(desc(AsientoContable.fecha), desc(AsientoContable.creado_en)).offset(skip).limit(limit).all()


def get_asiento(db: Session, asiento_id: int):
    return db.query(AsientoContable).filter(AsientoContable.id == asiento_id).first()
