from sqlalchemy.orm import Session
from app.models.inventory import InventarioBase
from app.schemas.inventory import InventarioCreate, InventarioUpdate


def get_inventarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(InventarioBase).offset(skip).limit(limit).all()


def get_inventario(db: Session, inventario_id: int):
    return db.query(InventarioBase).filter(InventarioBase.id == inventario_id).first()


def get_inventario_by_codigo(db: Session, codigo_barras: str):
    return db.query(InventarioBase).filter(InventarioBase.codigo_barras == codigo_barras).first()


def create_inventario(db: Session, inventario: InventarioCreate):
    db_inventario = InventarioBase(**inventario.model_dump())
    db.add(db_inventario)
    db.commit()
    db.refresh(db_inventario)
    return db_inventario


def update_inventario(db: Session, inventario_id: int, inventario: InventarioUpdate):
    db_inventario = db.query(InventarioBase).filter(InventarioBase.id == inventario_id).first()
    if not db_inventario:
        return None
    update_data = inventario.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inventario, key, value)
    db.commit()
    db.refresh(db_inventario)
    return db_inventario


def delete_inventario(db: Session, inventario_id: int):
    db_inventario = db.query(InventarioBase).filter(InventarioBase.id == inventario_id).first()
    if not db_inventario:
        return None
    db.delete(db_inventario)
    db.commit()
    return db_inventario
