from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import RoleChecker
from app.schemas.account import PlanCuentasOut
from app.schemas.journal import AsientoContableDetail
from app.crud.account import get_cuentas, get_cuenta
from app.crud.journal import get_asientos, get_asiento

router = APIRouter()

# Restringido a Admin o Contador
require_financial_access = RoleChecker(["Administrador Global", "Contador"])


@router.get("/accounts", response_model=List[PlanCuentasOut])
def read_accounts_catalog(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """
    Obtiene la lista plana del catálogo contable (Plan de Cuentas).
    - Requiere rol: Administrador Global o Contador.
    """
    return get_cuentas(db, skip=skip, limit=limit)


@router.get("/entries", response_model=List[AsientoContableDetail])
def read_journal_entries(
    sucursal_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """
    Obtiene la lista de asientos contables registrados.
    - Requiere rol: Administrador Global o Contador.
    """
    entries = get_asientos(db, sucursal_id=sucursal_id, skip=skip, limit=limit)
    
    # Enriquecer salida
    result = []
    for ent in entries:
        result.append(
            AsientoContableDetail(
                id=ent.id,
                numero=ent.numero,
                fecha=ent.fecha,
                descripcion=ent.descripcion,
                sucursal_id=ent.sucursal_id,
                movimiento_id=ent.movimiento_id,
                estado=ent.estado,
                creado_por=ent.creado_por,
                creado_en=ent.creado_en,
                detalles=ent.detalles,
                nombre_sucursal=ent.sucursal.nombre if ent.sucursal else "Consolidado",
                nombre_creador=ent.creador.nombre
            )
        )
    return result


@router.get("/entries/{asiento_id}", response_model=AsientoContableDetail)
def read_single_journal_entry(
    asiento_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """
    Obtiene el detalle de un asiento contable específico.
    - Requiere rol: Administrador Global o Contador.
    """
    ent = get_asiento(db, asiento_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Asiento contable no encontrado")
        
    return AsientoContableDetail(
        id=ent.id,
        numero=ent.numero,
        fecha=ent.fecha,
        descripcion=ent.descripcion,
        sucursal_id=ent.sucursal_id,
        movimiento_id=ent.movimiento_id,
        estado=ent.estado,
        creado_por=ent.creado_por,
        creado_en=ent.creado_en,
        detalles=ent.detalles,
        nombre_sucursal=ent.sucursal.nombre if ent.sucursal else "Consolidado",
        nombre_creador=ent.creador.nombre
    )
