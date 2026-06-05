from sqlalchemy.orm import Session
from app.models.account import PlanCuentas
from app.schemas.account import PlanCuentasCreate


def get_cuentas(db: Session, skip: int = 0, limit: int = 200):
    return db.query(PlanCuentas).order_by(PlanCuentas.codigo).offset(skip).limit(limit).all()


def get_cuenta(db: Session, cuenta_id: int):
    return db.query(PlanCuentas).filter(PlanCuentas.id == cuenta_id).first()


def get_cuenta_by_codigo(db: Session, codigo: str):
    return db.query(PlanCuentas).filter(PlanCuentas.codigo == codigo).first()


def create_cuenta(db: Session, cuenta: PlanCuentasCreate):
    db_cuenta = PlanCuentas(**cuenta.model_dump())
    db.add(db_cuenta)
    db.commit()
    db.refresh(db_cuenta)
    return db_cuenta
