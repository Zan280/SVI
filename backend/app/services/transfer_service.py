from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.transfer import Traslado
from app.models.branch_stock import InventarioSucursal
from app.services.kardex_service import KardexService


class TransferService:
    @staticmethod
    def crear_traslado(db: Session, sucursal_origen_id: int, sucursal_destino_id: int, producto_id: int, cantidad: Decimal, usuario_id: int) -> Traslado:
        """
        Crea una solicitud de traslado con estado 'PENDIENTE'.
        """
        if sucursal_origen_id == sucursal_destino_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La sucursal de origen y destino no pueden ser la misma."
            )

        if cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad a trasladar debe ser mayor que cero."
            )

        # Verificar stock en origen
        stock_origen = db.query(InventarioSucursal).filter(
            InventarioSucursal.sucursal_id == sucursal_origen_id,
            InventarioSucursal.producto_id == producto_id
        ).first()

        if not stock_origen or stock_origen.stock < cantidad:
            disponible = stock_origen.stock if stock_origen else 0
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente en la sucursal de origen. Disponible: {disponible}, Solicitado: {cantidad}"
            )

        traslado = Traslado(
            sucursal_origen_id=sucursal_origen_id,
            sucursal_destino_id=sucursal_destino_id,
            producto_id=producto_id,
            cantidad=cantidad,
            estado="PENDIENTE",
            usuario_envia_id=usuario_id
        )
        db.add(traslado)
        db.flush()
        return traslado

    @staticmethod
    def autorizar_salida(db: Session, traslado_id: int, usuario_id: int) -> Traslado:
        """
        Paso 1 del flujo de doble verificación: El origen autoriza el traslado.
        Deduce el stock de la sucursal origen y registra un movimiento de 'TRASLADO_SALIDA'.
        """
        traslado = db.query(Traslado).filter(Traslado.id == traslado_id).first()
        if not traslado:
            raise HTTPException(status_code=404, detail="Solicitud de traslado no encontrada.")

        if traslado.estado != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede autorizar un traslado en estado '{traslado.estado}'."
            )

        # Volver a verificar stock origen antes de descontar
        stock_origen = db.query(InventarioSucursal).filter(
            InventarioSucursal.sucursal_id == traslado.sucursal_origen_id,
            InventarioSucursal.producto_id == traslado.producto_id
        ).first()

        if not stock_origen or stock_origen.stock < traslado.cantidad:
            disponible = stock_origen.stock if stock_origen else 0
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente en origen para autorizar. Disponible: {disponible}, Solicitado: {traslado.cantidad}"
            )

        # Registrar el movimiento de salida física en origen
        # El costo unitario de salida es el costo medio de la sucursal de origen
        costo_medio_origen = stock_origen.costo_medio
        referencia = f"Traslado #{traslado.id} (Salida)"

        # Registrar movimiento y actualizar stock origen en KardexService
        KardexService.registrar_movimiento(
            db=db,
            sucursal_id=traslado.sucursal_origen_id,
            producto_id=traslado.producto_id,
            tipo="TRASLADO_SALIDA",
            cantidad=traslado.cantidad,
            costo_unitario=costo_medio_origen,
            referencia=referencia,
            usuario_id=usuario_id
        )

        traslado.estado = "AUTORIZADO"
        traslado.autorizado_en = datetime.now()
        db.flush()
        return traslado

    @staticmethod
    def aprobar_recepcion(db: Session, traslado_id: int, usuario_id: int) -> Traslado:
        """
        Paso 2 del flujo de doble verificación: El destino aprueba la recepción.
        Incrementa el stock de la sucursal de destino y registra 'TRASLADO_INGRESO'.
        """
        traslado = db.query(Traslado).filter(Traslado.id == traslado_id).first()
        if not traslado:
            raise HTTPException(status_code=404, detail="Solicitud de traslado no encontrada.")

        if traslado.estado != "AUTORIZADO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede aprobar la recepción de un traslado en estado '{traslado.estado}'."
            )

        # Necesitamos el costo original al que salió de la sucursal origen
        # Lo obtenemos del stock actual en origen (o del registro de movimiento de salida)
        stock_origen = db.query(InventarioSucursal).filter(
            InventarioSucursal.sucursal_id == traslado.sucursal_origen_id,
            InventarioSucursal.producto_id == traslado.producto_id
        ).first()
        
        costo_unitario_origen = stock_origen.costo_medio if stock_origen else Decimal("0.00")
        referencia = f"Traslado #{traslado.id} (Recepción)"

        # Registrar el movimiento de ingreso físico en destino
        KardexService.registrar_movimiento(
            db=db,
            sucursal_id=traslado.sucursal_destino_id,
            producto_id=traslado.producto_id,
            tipo="TRASLADO_INGRESO",
            cantidad=traslado.cantidad,
            costo_unitario=costo_unitario_origen,
            referencia=referencia,
            usuario_id=usuario_id
        )

        traslado.estado = "APROBADO"
        traslado.usuario_recibe_id = usuario_id
        traslado.recibido_en = datetime.now()
        db.flush()
        return traslado

    @staticmethod
    def rechazar_traslado(db: Session, traslado_id: int, usuario_id: int) -> Traslado:
        """
        Permite rechazar un traslado.
        - Si está PENDIENTE: Simplemente se cancela (RECHAZADO).
        - Si está AUTORIZADO (el stock ya salió de origen): Se devuelve el stock a la sucursal de origen.
        """
        traslado = db.query(Traslado).filter(Traslado.id == traslado_id).first()
        if not traslado:
            raise HTTPException(status_code=404, detail="Solicitud de traslado no encontrada.")

        if traslado.estado not in ["PENDIENTE", "AUTORIZADO"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede rechazar un traslado en estado '{traslado.estado}'."
            )

        if traslado.estado == "AUTORIZADO":
            # Devolver stock a la sucursal de origen
            # Registramos un ingreso de ajuste en origen para retornar la mercadería al costo original
            stock_origen = db.query(InventarioSucursal).filter(
                InventarioSucursal.sucursal_id == traslado.sucursal_origen_id,
                InventarioSucursal.producto_id == traslado.producto_id
            ).first()
            costo_unitario = stock_origen.costo_medio if stock_origen else Decimal("0.00")

            KardexService.registrar_movimiento(
                db=db,
                sucursal_id=traslado.sucursal_origen_id,
                producto_id=traslado.producto_id,
                tipo="AJUSTE_INGRESO",
                cantidad=traslado.cantidad,
                costo_unitario=costo_unitario,
                referencia=f"Devolución por Rechazo Traslado #{traslado.id}",
                usuario_id=usuario_id
            )

        traslado.estado = "RECHAZADO"
        traslado.usuario_recibe_id = usuario_id
        traslado.recibido_en = datetime.now()
        db.flush()
        return traslado
