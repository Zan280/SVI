from sqlalchemy.orm import Session
from app.models.supplier import Proveedor
from app.schemas.supplier import ProveedorCreate, ProveedorUpdate


def get_proveedores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Proveedor).offset(skip).limit(limit).all()


def get_proveedor(db: Session, proveedor_id: int):
    return db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()


def create_proveedor(db: Session, proveedor: ProveedorCreate):
    db_proveedor = Proveedor(**proveedor.model_dump())
    db.add(db_proveedor)
    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor


def update_proveedor(db: Session, proveedor_id: int, proveedor: ProveedorUpdate):
    db_proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not db_proveedor:
        return None
    update_data = proveedor.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_proveedor, key, value)
    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor


def delete_proveedor(db: Session, proveedor_id: int):
    db_proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not db_proveedor:
        return None
    db.delete(db_proveedor)
    db.commit()
    return db_proveedor
