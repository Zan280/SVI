from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user, check_branch_access
from app.models.user import Usuario
from app.schemas.transfer import TrasladoCreate, TrasladoDetail
from app.crud.transfer import get_traslados, get_traslado
from app.services.transfer_service import TransferService

router = APIRouter()


@router.get("/", response_model=List[TrasladoDetail])
def list_transfers(
    sucursal_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene la lista de traslados.
    - Encargados: Ven los de su sucursal (origen o destino).
    - Admin/Contador: Ven todos.
    """
    sucursal_id_filtrada = check_branch_access(current_user, sucursal_id)
    
    transfers = get_traslados(db, sucursal_id=sucursal_id_filtrada, skip=skip, limit=limit)
    
    result = []
    for t in transfers:
        result.append(
            TrasladoDetail(
                id=t.id,
                sucursal_origen_id=t.sucursal_origen_id,
                sucursal_destino_id=t.sucursal_destino_id,
                producto_id=t.producto_id,
                cantidad=t.cantidad,
                estado=t.estado,
                usuario_envia_id=t.usuario_envia_id,
                usuario_recibe_id=t.usuario_recibe_id,
                creado_en=t.creado_en,
                autorizado_en=t.autorizado_en,
                recibido_en=t.recibido_en,
                producto=t.producto,
                sucursal_origen=t.sucursal_origen,
                sucursal_destino=t.sucursal_destino,
                nombre_usuario_envia=t.usuario_envia.nombre if t.usuario_envia else None,
                nombre_usuario_recibe=t.usuario_recibe.nombre if t.usuario_recibe else None
            )
        )
    return result


@router.post("/", response_model=TrasladoDetail, status_code=status.HTTP_201_CREATED)
def create_transfer_request(
    transfer: TrasladoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea una solicitud de traslado (PENDIENTE).
    - Encargados: Solo pueden iniciar traslados desde su propia sucursal.
    """
    # Verificar que el usuario tiene acceso a la sucursal de origen
    check_branch_access(current_user, transfer.sucursal_origen_id)

    db_transfer = TransferService.crear_traslado(
        db=db,
        sucursal_origen_id=transfer.sucursal_origen_id,
        sucursal_destino_id=transfer.sucursal_destino_id,
        producto_id=transfer.producto_id,
        cantidad=transfer.cantidad,
        usuario_id=current_user.id
    )
    db.commit()
    db.refresh(db_transfer)
    
    return TrasladoDetail(
        id=db_transfer.id,
        sucursal_origen_id=db_transfer.sucursal_origen_id,
        sucursal_destino_id=db_transfer.sucursal_destino_id,
        producto_id=db_transfer.producto_id,
        cantidad=db_transfer.cantidad,
        estado=db_transfer.estado,
        usuario_envia_id=db_transfer.usuario_envia_id,
        usuario_recibe_id=db_transfer.usuario_recibe_id,
        creado_en=db_transfer.creado_en,
        producto=db_transfer.producto,
        sucursal_origen=db_transfer.sucursal_origen,
        sucursal_destino=db_transfer.sucursal_destino,
        nombre_usuario_envia=db_transfer.usuario_envia.nombre if db_transfer.usuario_envia else None
    )


@router.put("/{transfer_id}/autorizar", response_model=TrasladoDetail)
def authorize_transfer_departure(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Autoriza la salida física del stock desde la sucursal de origen (Paso 1).
    - Encargados: Solo si pertenecen a la sucursal origen.
    """
    t = get_traslado(db, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")

    # Verificar acceso a la sucursal origen
    check_branch_access(current_user, t.sucursal_origen_id)

    try:
        updated_t = TransferService.autorizar_salida(db, traslado_id=transfer_id, usuario_id=current_user.id)
        db.commit()
        db.refresh(updated_t)
        return updated_t
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{transfer_id}/aprobar", response_model=TrasladoDetail)
def approve_transfer_reception(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Aprueba la recepción física del stock en la sucursal de destino (Paso 2).
    - Encargados: Solo si pertenecen a la sucursal destino.
    """
    t = get_traslado(db, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")

    # Verificar acceso a la sucursal destino
    check_branch_access(current_user, t.sucursal_destino_id)

    try:
        updated_t = TransferService.aprobar_recepcion(db, traslado_id=transfer_id, usuario_id=current_user.id)
        db.commit()
        db.refresh(updated_t)
        return updated_t
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{transfer_id}/rechazar", response_model=TrasladoDetail)
def reject_transfer_request(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Rechaza el traslado.
    - Si está PENDIENTE: Puede rechazar el origen o destino.
    - Si está AUTORIZADO: Solo el destino puede rechazar (se devuelve el stock al origen).
    """
    t = get_traslado(db, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Traslado no encontrado")

    # Verificar acceso a alguna de las sucursales involucradas según el estado
    if t.estado == "PENDIENTE":
        # Permite rechazar si tiene acceso a origen o destino
        try:
            check_branch_access(current_user, t.sucursal_origen_id)
        except HTTPException:
            check_branch_access(current_user, t.sucursal_destino_id)
    else:
        # AUTORIZADO: El stock ya salió de origen. Solo el destino puede rechazar tras revisar física.
        check_branch_access(current_user, t.sucursal_destino_id)

    try:
        updated_t = TransferService.rechazar_traslado(db, traslado_id=transfer_id, usuario_id=current_user.id)
        db.commit()
        db.refresh(updated_t)
        return updated_t
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
