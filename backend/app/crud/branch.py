from sqlalchemy.orm import Session
from app.models.branch import Sucursal
from app.schemas.branch import SucursalCreate, SucursalUpdate


def get_sucursales(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Sucursal).offset(skip).limit(limit).all()


def get_sucursal(db: Session, sucursal_id: int):
    return db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()


def get_sucursal_by_codigo(db: Session, codigo: str):
    return db.query(Sucursal).filter(Sucursal.codigo == codigo).first()


def create_sucursal(db: Session, sucursal: SucursalCreate):
    db_sucursal = Sucursal(**sucursal.model_dump())
    db.add(db_sucursal)
    db.commit()
    db.refresh(db_sucursal)
    return db_sucursal


def update_sucursal(db: Session, sucursal_id: int, sucursal: SucursalUpdate):
    db_sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not db_sucursal:
        return None
    update_data = sucursal.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sucursal, key, value)
    db.commit()
    db.refresh(db_sucursal)
    return db_sucursal


def delete_sucursal(db: Session, sucursal_id: int):
    db_sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not db_sucursal:
        return None
    db.delete(db_sucursal)
    db.commit()
    return db_sucursal
