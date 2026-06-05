from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import RoleChecker
from app.schemas.kardex import KardexDetail
from app.crud.kardex import get_kardex_entries

router = APIRouter()

# Restringido a Admin o Contador
require_financial_access = RoleChecker(["Administrador Global", "Contador"])


@router.get("/", response_model=List[KardexDetail])
def read_kardex(
    producto_id: Optional[int] = None,
    sucursal_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """
    Obtiene los registros del Kardex Valorado.
    - Requiere rol: Administrador Global o Contador.
    - Puede filtrarse opcionalmente por producto y sucursal.
    """
    entries = get_kardex_entries(db, producto_id=producto_id, sucursal_id=sucursal_id, skip=skip, limit=limit)
    return entries
