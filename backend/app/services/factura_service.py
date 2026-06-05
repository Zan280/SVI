from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.inventory import InventarioBase
from app.models.branch_stock import InventarioSucursal
from app.models.factura import FacturaVenta, LineaFactura
from app.crud.factura import get_ultimo_numero_factura
from app.services.kardex_service import KardexService


class FacturaService:
    @staticmethod
    def crear_factura(
        db: Session,
        sucursal_id: int,
        usuario_id: int,
        cliente_nombre: str,
        notas: str,
        lineas_data: list
    ) -> FacturaVenta:
        """
        Procesa una nueva factura de venta:
        - Para líneas de tipo PRODUCTO: descuenta stock vía KardexService (usando CPP como costo de salida).
        - Para líneas de tipo SERVICIO: solo registra la venta (sin movimiento de kardex).
        - Genera número de factura correlativo automático.
        """
        if not lineas_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La factura debe contener al menos una línea."
            )

        numero_factura = get_ultimo_numero_factura(db)
        total_factura = Decimal("0.00")
        lineas_db = []

        for linea in lineas_data:
            # 1. Obtener producto del catálogo
            producto = db.query(InventarioBase).filter(InventarioBase.id == linea.producto_id).first()
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto ID {linea.producto_id} no encontrado en el catálogo."
                )

            cantidad = Decimal(str(linea.cantidad))
            precio_venta = Decimal(str(producto.precio_venta))
            subtotal = (cantidad * precio_venta).quantize(Decimal("0.00"))
            tipo_item = producto.tipo_item
            costo_cpp = Decimal("0.00")

            if tipo_item == "PRODUCTO":
                # Para Productos: el costo de salida en Kardex DEBE ser el CPP actual (nunca el precio de venta)
                stock_suc = db.query(InventarioSucursal).filter(
                    InventarioSucursal.sucursal_id == sucursal_id,
                    InventarioSucursal.producto_id == producto.id
                ).first()

                if not stock_suc:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"El producto '{producto.nombre}' no tiene stock registrado en esta sucursal."
                    )

                costo_cpp = Decimal(str(stock_suc.costo_medio))

                # Registrar movimiento SALIDA_VENTA en Kardex con referencia al número de factura
                KardexService.registrar_movimiento(
                    db=db,
                    sucursal_id=sucursal_id,
                    producto_id=producto.id,
                    tipo="SALIDA_VENTA",
                    cantidad=cantidad,
                    costo_unitario=costo_cpp,  # REGLA ESTRICTA: usar CPP, nunca precio de venta
                    referencia=numero_factura,
                    usuario_id=usuario_id
                )

            elif tipo_item == "SERVICIO":
                # Para Servicios: solo registro de venta, sin movimiento de Kardex
                pass  # No hay acción de kardex
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tipo de ítem desconocido: {tipo_item}. Use 'PRODUCTO' o 'SERVICIO'."
                )

            # Crear línea
            linea_db = LineaFactura(
                producto_id=producto.id,
                tipo_item=tipo_item,
                cantidad=cantidad,
                precio_venta=precio_venta,
                costo_cpp=costo_cpp,
                subtotal=subtotal
            )
            lineas_db.append(linea_db)
            total_factura += subtotal

        # Crear cabecera de la factura
        factura = FacturaVenta(
            numero_factura=numero_factura,
            cliente_nombre=cliente_nombre or "Cliente General",
            sucursal_id=sucursal_id,
            usuario_id=usuario_id,
            total_venta=total_factura,
            notas=notas
        )
        db.add(factura)
        db.flush()  # Obtener el ID de la factura

        # Asociar líneas a la factura
        for linea_db in lineas_db:
            linea_db.factura_id = factura.id
            db.add(linea_db)

        db.flush()
        return factura
