from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user
from app.models.user import Usuario
from app.schemas.factura import FacturaVentaCreate, FacturaVentaOut
from app.services.factura_service import FacturaService
from app.crud.factura import get_facturas, get_factura

router = APIRouter()

# Sucursal predeterminada para el escenario de un solo admin
DEFAULT_SUCURSAL_ID = 1


@router.post("/", response_model=FacturaVentaOut, status_code=status.HTTP_201_CREATED)
def crear_factura(
    factura: FacturaVentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea una nueva factura de venta.
    - Líneas de Producto: descuenta stock del kardex al costo CPP (nunca al precio de venta).
    - Líneas de Servicio: registra la venta sin movimiento de kardex.
    - Genera número correlativo automático (FAC-000001, FAC-000002, ...).
    """
    try:
        factura_db = FacturaService.crear_factura(
            db=db,
            sucursal_id=DEFAULT_SUCURSAL_ID,
            usuario_id=current_user.id,
            cliente_nombre=factura.cliente_nombre,
            notas=factura.notas,
            lineas_data=factura.lineas
        )
        db.commit()
        db.refresh(factura_db)
        return factura_db
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la factura: {str(e)}"
        )


@router.get("/", response_model=List[FacturaVentaOut])
def listar_facturas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todas las facturas de venta, ordenadas de más reciente a más antigua."""
    return get_facturas(db, skip=skip, limit=limit)


@router.get("/{factura_id}", response_model=FacturaVentaOut)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene el detalle de una factura específica con todas sus líneas."""
    factura = get_factura(db, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")
    return factura
