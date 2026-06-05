import random
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.journal import AsientoContable, DetalleAsiento
from app.models.account import PlanCuentas
from app.models.movement import MovimientoInventario


class AccountingService:
    @staticmethod
    def generar_numero_asiento(db: Session) -> str:
        """
        Genera un número correlativo único para el asiento contable.
        Formato: AS-YYYYMMDD-XXXX (donde XXXX es un correlativo o aleatorio)
        """
        fecha_str = date.today().strftime("%Y%m%d")
        # Generar un sufijo aleatorio simple para evitar colisiones
        sufijo = f"{random.randint(1000, 9999)}"
        numero = f"AS-{fecha_str}-{sufijo}"
        
        # Verificar unicidad
        while db.query(AsientoContable).filter(AsientoContable.numero == numero).first():
            sufijo = f"{random.randint(1000, 9999)}"
            numero = f"AS-{fecha_str}-{sufijo}"
            
        return numero

    @staticmethod
    def crear_asiento_automatico(db: Session, movimiento: MovimientoInventario, usuario_id: int) -> AsientoContable:
        """
        Genera el asiento contable automático basado en el tipo de movimiento de inventario.
        """
        # Solo ciertos movimientos de inventario generan asiento contable.
        # Los traslados entre sucursales de la misma empresa no alteran el patrimonio global
        # por lo que no se asientan contablemente en el libro diario de forma automática,
        # a menos que representen cuentas de inventario por sucursal diferenciadas.
        if movimiento.tipo in ["TRASLADO_SALIDA", "TRASLADO_INGRESO"]:
            return None

        # Cuentas clave por código según init_db.sql
        CODIGO_INVENTARIO = "1.1.3"  # Inventario de Mercaderías (ACTIVO, DEUDORA)
        CODIGO_PROVEEDORES = "2.1.1" # Cuentas por Pagar (PASIVO, ACREEDORA)
        CODIGO_COSTO_VENTAS = "5.1.1" # Costo de Mercadería Vendida (COSTO, DEUDORA)
        CODIGO_MERMAS = "6.2.1"      # Mermas y Faltantes (GASTO, DEUDORA)
        CODIGO_VENTAS_FALLBACK = "4.1.1" # Ventas de Mercadería (INGRESO, ACREEDORA)

        # Buscar cuentas en la base de datos
        cuenta_inventario = db.query(PlanCuentas).filter(PlanCuentas.codigo == CODIGO_INVENTARIO).first()
        cuenta_proveedores = db.query(PlanCuentas).filter(PlanCuentas.codigo == CODIGO_PROVEEDORES).first()
        cuenta_costo_ventas = db.query(PlanCuentas).filter(PlanCuentas.codigo == CODIGO_COSTO_VENTAS).first()
        cuenta_mermas = db.query(PlanCuentas).filter(PlanCuentas.codigo == CODIGO_MERMAS).first()
        cuenta_ventas_fallback = db.query(PlanCuentas).filter(PlanCuentas.codigo == CODIGO_VENTAS_FALLBACK).first()

        if not cuenta_inventario:
            raise HTTPException(status_code=500, detail="Error de configuración: Cuenta de inventario (1.1.3) no encontrada.")

        monto = movimiento.costo_total
        if monto <= 0:
            return None # No generar asiento si el monto es cero

        detalles_propuestos = []

        if movimiento.tipo == "INGRESO_COMPRA":
            if not cuenta_proveedores:
                raise HTTPException(status_code=500, detail="Error de configuración: Cuenta de proveedores (2.1.1) no encontrada.")
            # Cargo (Debe) a Inventarios
            detalles_propuestos.append({
                "cuenta_id": cuenta_inventario.id,
                "debe": monto,
                "haber": Decimal("0.00"),
                "glosa": f"Cargo a Inventario por Compra - Ref {movimiento.referencia or ''}"
            })
            # Abono (Haber) a Cuentas por Pagar
            detalles_propuestos.append({
                "cuenta_id": cuenta_proveedores.id,
                "debe": Decimal("0.00"),
                "haber": monto,
                "glosa": f"Abono a CxP Proveedores por Compra - Ref {movimiento.referencia or ''}"
            })
            descripcion = f"Asiento automático: Compra de mercadería. Ref: {movimiento.referencia or 'N/A'}"

        elif movimiento.tipo == "SALIDA_VENTA":
            if not cuenta_costo_ventas:
                raise HTTPException(status_code=500, detail="Error de configuración: Cuenta de costo de ventas (5.1.1) no encontrada.")
            # Cargo (Debe) al Costo de Ventas
            detalles_propuestos.append({
                "cuenta_id": cuenta_costo_ventas.id,
                "debe": monto,
                "haber": Decimal("0.00"),
                "glosa": f"Costo de venta por Salida - Ref {movimiento.referencia or ''}"
            })
            # Abono (Haber) a Inventarios
            detalles_propuestos.append({
                "cuenta_id": cuenta_inventario.id,
                "debe": Decimal("0.00"),
                "haber": monto,
                "glosa": f"Salida de Inventario por Venta - Ref {movimiento.referencia or ''}"
            })
            descripcion = f"Asiento automático: Costo de ventas registrado. Ref: {movimiento.referencia or 'N/A'}"

        elif movimiento.tipo == "AJUSTE_INGRESO":
            if not cuenta_ventas_fallback:
                raise HTTPException(status_code=500, detail="Error de configuración: Cuenta de ingresos fallback (4.1.1) no encontrada.")
            # Cargo (Debe) a Inventarios
            detalles_propuestos.append({
                "cuenta_id": cuenta_inventario.id,
                "debe": monto,
                "haber": Decimal("0.00"),
                "glosa": f"Ingreso a Inventario por Ajuste - Ref {movimiento.referencia or ''}"
            })
            # Abono (Haber) a Ingresos
            detalles_propuestos.append({
                "cuenta_id": cuenta_ventas_fallback.id,
                "debe": Decimal("0.00"),
                "haber": monto,
                "glosa": f"Abono a Ingresos por Ajuste - Ref {movimiento.referencia or ''}"
            })
            descripcion = f"Asiento automático: Ajuste de ingreso (sobrante) de inventario. Ref: {movimiento.referencia or 'N/A'}"

        elif movimiento.tipo == "AJUSTE_SALIDA":
            if not cuenta_mermas:
                raise HTTPException(status_code=500, detail="Error de configuración: Cuenta de mermas (6.2.1) no encontrada.")
            # Cargo (Debe) a Mermas y Faltantes (Gasto)
            detalles_propuestos.append({
                "cuenta_id": cuenta_mermas.id,
                "debe": monto,
                "haber": Decimal("0.00"),
                "glosa": f"Gasto por Merma/Faltante - Ref {movimiento.referencia or ''}"
            })
            # Abono (Haber) a Inventarios
            detalles_propuestos.append({
                "cuenta_id": cuenta_inventario.id,
                "debe": Decimal("0.00"),
                "haber": monto,
                "glosa": f"Salida de Inventario por Ajuste - Ref {movimiento.referencia or ''}"
            })
            descripcion = f"Asiento automático: Ajuste de salida (merma/faltante) de inventario. Ref: {movimiento.referencia or 'N/A'}"
        else:
            return None

        # Crear cabecera de Asiento Contable
        numero_asiento = AccountingService.generar_numero_asiento(db)
        asiento = AsientoContable(
            numero=numero_asiento,
            fecha=date.today(),
            descripcion=descripcion,
            sucursal_id=movimiento.sucursal_id,
            movimiento_id=movimiento.id,
            estado="REGISTRADO",
            creado_por=usuario_id
        )
        db.add(asiento)
        db.flush()

        # Crear detalles
        for det in detalles_propuestos:
            detalle = DetalleAsiento(
                asiento_id=asiento.id,
                cuenta_id=det["cuenta_id"],
                debe=det["debe"],
                haber=det["haber"],
                glosa=det["glosa"]
            )
            db.add(detalle)
        
        db.flush()
        return asiento
