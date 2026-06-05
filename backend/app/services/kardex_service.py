from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.movement import MovimientoInventario
from app.models.kardex import KardexEntry
from app.models.branch_stock import InventarioSucursal
from app.models.inventory import InventarioBase


class KardexService:
    @staticmethod
    def registrar_movimiento(db: Session, sucursal_id: int, producto_id: int, tipo: str, cantidad: Decimal, costo_unitario: Decimal, referencia: str, usuario_id: int) -> MovimientoInventario:
        """
        Registra un movimiento en la base de datos, actualiza el stock/costo medio de la sucursal y genera el registro en el Kardex.
        """
        if cantidad <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cantidad debe ser mayor que cero."
            )

        # 1. Obtener o crear el stock de la sucursal
        stock_sucursal = db.query(InventarioSucursal).filter(
            InventarioSucursal.sucursal_id == sucursal_id,
            InventarioSucursal.producto_id == producto_id
        ).first()

        if not stock_sucursal:
            # Si no existe, lo inicializamos en cero
            stock_sucursal = InventarioSucursal(
                sucursal_id=sucursal_id,
                producto_id=producto_id,
                stock=Decimal("0.00"),
                stock_minimo=Decimal("0.00"),
                costo_medio=Decimal("0.00")
            )
            db.add(stock_sucursal)
            db.flush()

        stock_anterior = stock_sucursal.stock
        costo_anterior = stock_sucursal.costo_medio

        es_ingreso = tipo in ["INGRESO_COMPRA", "TRASLADO_INGRESO", "AJUSTE_INGRESO"]

        # Determinar costos y cantidades finales
        if es_ingreso:
            cantidad_entrada = cantidad
            costo_entrada = costo_unitario
            cantidad_salida = Decimal("0.00")
            costo_salida = Decimal("0.00")

            stock_nuevo = stock_anterior + cantidad
            
            # Calcular Costo Promedio Ponderado
            if stock_nuevo > 0:
                costo_nuevo = ((stock_anterior * costo_anterior) + (cantidad * costo_unitario)) / stock_nuevo
            else:
                costo_nuevo = costo_unitario

            # Redondear a 4 decimales para mayor precisión en costo
            costo_nuevo = costo_nuevo.quantize(Decimal("0.0001"))
        else:
            # En salidas, el costo unitario de salida es el costo medio actual (CPP)
            costo_salida = costo_anterior
            cantidad_entrada = Decimal("0.00")
            costo_entrada = Decimal("0.00")
            cantidad_salida = cantidad

            if stock_anterior < cantidad:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente en la sucursal. Disponible: {stock_anterior} {tipo} solicitado: {cantidad}"
                )

            stock_nuevo = stock_anterior - cantidad
            costo_nuevo = costo_anterior  # El costo medio no cambia en salidas

        costo_total = (cantidad * (costo_entrada if es_ingreso else costo_salida)).quantize(Decimal("0.00"))

        # 2. Registrar el movimiento
        movimiento = MovimientoInventario(
            sucursal_id=sucursal_id,
            producto_id=producto_id,
            tipo=tipo,
            cantidad=cantidad,
            costo_unitario=costo_entrada if es_ingreso else costo_salida,
            costo_total=costo_total,
            referencia=referencia,
            usuario_id=usuario_id
        )
        db.add(movimiento)
        db.flush()

        # 3. Registrar en Kardex
        kardex_entry = KardexEntry(
            sucursal_id=sucursal_id,
            producto_id=producto_id,
            movimiento_id=movimiento.id,
            tipo_movimiento=tipo,
            cantidad_entrada=cantidad_entrada,
            costo_entrada=costo_entrada,
            cantidad_salida=cantidad_salida,
            costo_salida=costo_salida,
            cantidad_saldo=stock_nuevo,
            costo_unitario_saldo=costo_nuevo,
            costo_total_saldo=(stock_nuevo * costo_nuevo).quantize(Decimal("0.00"))
        )
        db.add(kardex_entry)

        # 4. Actualizar stock y costo en la sucursal
        stock_sucursal.stock = stock_nuevo
        stock_sucursal.costo_medio = costo_nuevo
        
        db.flush()
        return movimiento
