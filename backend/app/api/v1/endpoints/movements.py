from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.database import get_db
from app.auth import get_current_user, check_branch_access
from app.models.user import Usuario
from app.models.inventory import InventarioBase
from app.models.branch_stock import InventarioSucursal
from app.schemas.movement import MovimientoInventarioCreate, MovimientoInventarioDetail
from app.crud.movement import get_movimientos
from app.services.kardex_service import KardexService
from app.services.accounting_service import AccountingService

router = APIRouter()


@router.get("/", response_model=List[MovimientoInventarioDetail])
def list_inventory_movements(
    sucursal_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene la lista de movimientos de inventario.
    - Encargado de Sucursal: Limitado a su sucursal.
    - Admin/Contador: Acceso completo, filtrable por sucursal.
    """
    # Validar y restringir sucursal
    sucursal_id_filtrada = check_branch_access(current_user, sucursal_id)
    
    movements = get_movimientos(db, sucursal_id=sucursal_id_filtrada, skip=skip, limit=limit)
    
    # Enriquecer detalles para el output
    result = []
    for mov in movements:
        # Resolver nombres extras para simplificar visualización
        result.append(
            MovimientoInventarioDetail(
                id=mov.id,
                sucursal_id=mov.sucursal_id,
                producto_id=mov.producto_id,
                tipo=mov.tipo,
                cantidad=mov.cantidad,
                costo_unitario=mov.costo_unitario,
                costo_total=mov.costo_total,
                referencia=mov.referencia,
                usuario_id=mov.usuario_id,
                creado_en=mov.creado_en,
                producto=mov.producto,
                nombre_sucursal=mov.sucursal.nombre,
                nombre_usuario=mov.usuario.nombre
            )
        )
    return result


@router.post("/", response_model=MovimientoInventarioDetail, status_code=status.HTTP_201_CREATED)
def register_new_movement(
    movement: MovimientoInventarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Registra un nuevo movimiento de inventario, actualiza Kardex (CPP) y genera el asiento contable automático.
    - Encargados: Solo en su propia sucursal.
    - Tipo permitidos: INGRESO_COMPRA, SALIDA_VENTA, AJUSTE_INGRESO, AJUSTE_SALIDA.
    """
    # 1. Verificar tipo de movimiento permitido directamente
    if movement.tipo not in ["INGRESO_COMPRA", "SALIDA_VENTA", "AJUSTE_INGRESO", "AJUSTE_SALIDA"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operación no permitida mediante este endpoint. Use endpoints de traslados para movimientos intersucursales."
        )

    # Lógica de permisos de Rol
    rol_nombre = current_user.role.nombre
    if rol_nombre == "Vendedor":
        if movement.tipo != "SALIDA_VENTA":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El rol Vendedor sólo tiene permitido registrar ventas (SALIDA_VENTA)."
            )
    elif rol_nombre == "Inventario / Almacén":
        if movement.tipo == "SALIDA_VENTA":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El rol Inventario / Almacén no tiene permitido registrar ventas (SALIDA_VENTA)."
            )

    # 2. Verificar permisos de sucursal
    check_branch_access(current_user, movement.sucursal_id)

    # 3. Resolver costo unitario para ingresos
    costo_unitario = Decimal("0.00")
    if movement.tipo in ["INGRESO_COMPRA", "AJUSTE_INGRESO"]:
        if movement.costo_unitario is not None:
            costo_unitario = movement.costo_unitario
        else:
            # Fallback al costo base en InventarioBase
            producto = db.query(InventarioBase).filter(InventarioBase.id == movement.producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail="Producto no encontrado en catálogo base.")
            costo_unitario = producto.precio_compra or Decimal("0.00")
    else:
        # Para salidas, el costo se hereda del costo_medio actual de la sucursal.
        # KardexService lo resolverá, pero si se envía lo ignoramos para mantener la coherencia contable
        stock_suc = db.query(InventarioSucursal).filter(
            InventarioSucursal.sucursal_id == movement.sucursal_id,
            InventarioSucursal.producto_id == movement.producto_id
        ).first()
        costo_unitario = stock_suc.costo_medio if stock_suc else Decimal("0.00")

    # Iniciar transacción explícita
    try:
        # A) Registrar movimiento y Kardex
        mov_db = KardexService.registrar_movimiento(
            db=db,
            sucursal_id=movement.sucursal_id,
            producto_id=movement.producto_id,
            tipo=movement.tipo,
            cantidad=movement.cantidad,
            costo_unitario=costo_unitario,
            referencia=movement.referencia,
            usuario_id=current_user.id
        )
        
        # B) Generar Asiento Contable Automático
        AccountingService.crear_asiento_automatico(
            db=db,
            movimiento=mov_db,
            usuario_id=current_user.id
        )

        db.commit()
        db.refresh(mov_db)
        
        # Retornar detalle enriquecido
        return MovimientoInventarioDetail(
            id=mov_db.id,
            sucursal_id=mov_db.sucursal_id,
            producto_id=mov_db.producto_id,
            tipo=mov_db.tipo,
            cantidad=mov_db.cantidad,
            costo_unitario=mov_db.costo_unitario,
            costo_total=mov_db.costo_total,
            referencia=mov_db.referencia,
            usuario_id=mov_db.usuario_id,
            creado_en=mov_db.creado_en,
            producto=mov_db.producto,
            nombre_sucursal=mov_db.sucursal.nombre,
            nombre_usuario=mov_db.usuario.nombre
        )
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar movimiento: {str(e)}"
        )
