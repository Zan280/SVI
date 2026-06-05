from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.models.kardex import KardexEntry


def get_kardex_entries(db: Session, producto_id: Optional[int] = None, sucursal_id: Optional[int] = None, skip: int = 0, limit: int = 200):
    query = db.query(KardexEntry)
    if producto_id is not None:
        query = query.filter(KardexEntry.producto_id == producto_id)
    if sucursal_id is not None:
        query = query.filter(KardexEntry.sucursal_id == sucursal_id)
    return query.order_by(KardexEntry.creado_en).offset(skip).limit(limit).all()
