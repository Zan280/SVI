from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from app.models.transfer import Traslado


def get_traslados(db: Session, sucursal_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(Traslado)
    if sucursal_id is not None:
        query = query.filter(
            or_(
                Traslado.sucursal_origen_id == sucursal_id,
                Traslado.sucursal_destino_id == sucursal_id
            )
        )
    return query.order_by(desc(Traslado.creado_en)).offset(skip).limit(limit).all()


def get_traslado(db: Session, traslado_id: int):
    return db.query(Traslado).filter(Traslado.id == traslado_id).first()
