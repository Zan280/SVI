from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from app.models.branch_stock import InventarioSucursal
from app.models.inventory import InventarioBase
from app.models.category import Categoria
from app.models.branch import Sucursal
from app.models.movement import MovimientoInventario
from app.models.transfer import Traslado
from app.models.journal import AsientoContable, DetalleAsiento
from app.models.account import PlanCuentas


class ReportService:
    @staticmethod
    def get_dashboard_stats(db: Session, sucursal_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Retorna las estadísticas clave para el Dashboard global o filtrado por sucursal.
        """
        # Filtro de sucursal
        bs_filter = []
        mov_filter = []
        trans_filter = []
        if sucursal_id:
            bs_filter.append(InventarioSucursal.sucursal_id == sucursal_id)
            mov_filter.append(MovimientoInventario.sucursal_id == sucursal_id)
            trans_filter.append(or_(
                Traslado.sucursal_origen_id == sucursal_id,
                Traslado.sucursal_destino_id == sucursal_id
            ))

        # Valoración de Stock
        valoracion_query = db.query(
            func.sum(InventarioSucursal.stock * InventarioSucursal.costo_medio)
        ).filter(*bs_filter).scalar()
        valoracion_total = Decimal(str(valoracion_query or 0.00)).quantize(Decimal("0.00"))

        # Total de productos con stock registrado
        total_productos = db.query(InventarioBase).count()

        # Total sucursales
        total_sucursales = db.query(Sucursal).filter(Sucursal.activa == True).count()

        # Transferencias pendientes de recibir (pueden ser PENDIENTE o AUTORIZADO)
        if sucursal_id:
            # Si se filtra por sucursal, nos interesan las que entran o salen de esta sucursal y están pendientes/autorizadas
            trans_pendientes = db.query(Traslado).filter(
                or_(Traslado.estado == "PENDIENTE", Traslado.estado == "AUTORIZADO"),
                *trans_filter
            ).count()
        else:
            trans_pendientes = db.query(Traslado).filter(
                or_(Traslado.estado == "PENDIENTE", Traslado.estado == "AUTORIZADO")
            ).count()

        # Movimientos del mes en curso
        primer_dia_mes = date.today().replace(day=1)
        movimientos_mes = db.query(MovimientoInventario).filter(
            MovimientoInventario.creado_en >= primer_dia_mes,
            *mov_filter
        ).count()

        return {
            "valoracion_total": valoracion_total,
            "total_productos": total_productos,
            "total_sucursales": total_sucursales,
            "transferencias_pendientes": trans_pendientes,
            "movimientos_mes": movimientos_mes
        }

    @staticmethod
    def get_stock_valuation(db: Session, sucursal_id: Optional[int] = None, categoria_id: Optional[int] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retorna la lista de productos con su stock, costo promedio y valorización total en las sucursales.
        """
        q = db.query(
            InventarioBase.id.label("producto_id"),
            InventarioBase.codigo_barras,
            InventarioBase.nombre,
            Categoria.nombre.label("categoria"),
            InventarioBase.unidad_medida,
            func.coalesce(func.sum(InventarioSucursal.stock), 0).label("stock"),
            func.coalesce(func.max(InventarioSucursal.costo_medio), InventarioBase.precio_compra).label("costo_medio"),
            func.coalesce(func.sum(InventarioSucursal.stock_minimo), 0).label("stock_minimo")
        ).outerjoin(
            InventarioSucursal, InventarioBase.id == InventarioSucursal.producto_id
        ).outerjoin(
            Categoria, InventarioBase.categoria_id == Categoria.id
        )

        # Aplicar filtros
        filters = []
        if sucursal_id:
            filters.append(InventarioSucursal.sucursal_id == sucursal_id)
        if categoria_id:
            filters.append(InventarioBase.categoria_id == categoria_id)
        if query:
            filters.append(or_(
                InventarioBase.nombre.ilike(f"%{query}%"),
                InventarioBase.codigo_barras.ilike(f"%{query}%")
            ))

        if filters:
            q = q.filter(*filters)

        q = q.group_by(
            InventarioBase.id,
            InventarioBase.codigo_barras,
            InventarioBase.nombre,
            Categoria.nombre,
            InventarioBase.unidad_medida,
            InventarioBase.precio_compra
        ).order_by(InventarioBase.nombre)

        results = []
        for row in q.all():
            stock = Decimal(str(row.stock))
            costo_medio = Decimal(str(row.costo_medio or 0.00))
            valoracion = (stock * costo_medio).quantize(Decimal("0.00"))
            stock_minimo = Decimal(str(row.stock_minimo))
            alerta_stock = stock < stock_minimo

            results.append({
                "producto_id": row.producto_id,
                "codigo_barras": row.codigo_barras,
                "nombre": row.nombre,
                "categoria": row.categoria or "Sin Categoría",
                "unidad_medida": row.unidad_medida,
                "stock": stock,
                "costo_medio": costo_medio.quantize(Decimal("0.00")),
                "valoracion": valoracion,
                "stock_minimo": stock_minimo,
                "alerta_stock": alerta_stock
            })

        return results

    @staticmethod
    def get_category_distribution(db: Session, sucursal_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retorna la valoración y cantidad de stock agrupados por categoría.
        """
        q = db.query(
            Categoria.nombre.label("categoria"),
            func.coalesce(func.sum(InventarioSucursal.stock * InventarioSucursal.costo_medio), 0).label("valoracion"),
            func.coalesce(func.sum(InventarioSucursal.stock), 0).label("cantidad")
        ).select_from(InventarioSucursal).join(
            InventarioBase, InventarioSucursal.producto_id == InventarioBase.id
        ).join(
            Categoria, InventarioBase.categoria_id == Categoria.id
        )

        if sucursal_id:
            q = q.filter(InventarioSucursal.sucursal_id == sucursal_id)

        q = q.group_by(Categoria.nombre).order_by(func.sum(InventarioSucursal.stock * InventarioSucursal.costo_medio).desc())

        results = []
        for row in q.all():
            results.append({
                "categoria": row.categoria,
                "valoracion": Decimal(str(row.valoracion)).quantize(Decimal("0.00")),
                "cantidad": Decimal(str(row.cantidad)).quantize(Decimal("0.00"))
            })
        return results

    @staticmethod
    def get_monthly_movements_trend(db: Session, sucursal_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retorna la tendencia mensual de movimientos de inventario agrupando ingresos y egresos de los últimos 6 meses.
        """
        # Obtener los últimos 6 meses
        filtro = []
        if sucursal_id:
            filtro.append(MovimientoInventario.sucursal_id == sucursal_id)

        # En PostgreSQL, usamos TO_CHAR para agrupar por mes
        q = db.query(
            func.to_char(MovimientoInventario.creado_en, 'YYYY-MM').label("mes"),
            func.sum(case(
                (MovimientoInventario.tipo.in_(["INGRESO_COMPRA", "TRASLADO_INGRESO", "AJUSTE_INGRESO"]), MovimientoInventario.costo_total),
                else_=0
            )).label("ingresos"),
            func.sum(case(
                (MovimientoInventario.tipo.in_(["SALIDA_VENTA", "TRASLADO_SALIDA", "AJUSTE_SALIDA"]), MovimientoInventario.costo_total),
                else_=0
            )).label("egresos")
        ).filter(*filtro).group_by(
            func.to_char(MovimientoInventario.creado_en, 'YYYY-MM')
        ).order_by(
            func.to_char(MovimientoInventario.creado_en, 'YYYY-MM')
        ).limit(6)

        results = []
        for row in q.all():
            results.append({
                "mes": row.mes,
                "ingresos": Decimal(str(row.ingresos or 0.00)).quantize(Decimal("0.00")),
                "egresos": Decimal(str(row.egresos or 0.00)).quantize(Decimal("0.00"))
            })
        return results

    @staticmethod
    def get_account_balances(db: Session) -> List[Dict[str, Any]]:
        """
        Retorna el Balance de Comprobación. Sumariza débitos y créditos del libro diario
        y los consolida en el Plan de Cuentas (respetando la jerarquía).
        """
        # 1. Obtener todas las cuentas del catálogo ordenadas por código
        todas_cuentas = db.query(PlanCuentas).order_by(PlanCuentas.codigo).all()
        
        # 2. Obtener sumas de Debe y Haber de las cuentas de detalle (donde hay asientos)
        detalles_query = db.query(
            DetalleAsiento.cuenta_id,
            func.sum(DetalleAsiento.debe).label("debe"),
            func.sum(DetalleAsiento.haber).label("haber")
        ).group_by(DetalleAsiento.cuenta_id).all()

        detalles_dict = {row.cuenta_id: {"debe": Decimal(str(row.debe)), "haber": Decimal(str(row.haber))} for row in detalles_query}

        # 3. Mapear id -> objeto cuenta y inicializar sumas
        cuentas_map = {}
        for c in todas_cuentas:
            cuentas_map[c.id] = {
                "id": c.id,
                "codigo": c.codigo,
                "nombre": c.nombre,
                "tipo": c.tipo,
                "naturaleza": c.naturaleza,
                "cuenta_padre_id": c.cuenta_padre_id,
                "es_detalle": c.es_detalle,
                "debe": Decimal("0.00"),
                "haber": Decimal("0.00"),
                "saldo": Decimal("0.00")
            }

        # 4. Asignar los montos de los asientos a las cuentas correspondientes
        for cuenta_id, valores in detalles_dict.items():
            if cuenta_id in cuentas_map:
                cuentas_map[cuenta_id]["debe"] = valores["debe"]
                cuentas_map[cuenta_id]["haber"] = valores["haber"]

        # 5. Bottom-up aggregation (de la cuenta más específica a los niveles superiores)
        # Clasificamos las cuentas por longitud de su código de mayor a menor
        cuentas_ordenadas = sorted(todas_cuentas, key=lambda c: len(c.codigo), reverse=True)
        
        for c in cuentas_ordenadas:
            if c.cuenta_padre_id:
                # Sumar los valores al padre
                padre_id = c.cuenta_padre_id
                cuentas_map[padre_id]["debe"] += cuentas_map[c.id]["debe"]
                cuentas_map[padre_id]["haber"] += cuentas_map[c.id]["haber"]

        # 6. Calcular los saldos finales según la naturaleza de cada cuenta
        results = []
        for c in todas_cuentas:
            cuenta_data = cuentas_map[c.id]
            debe = cuenta_data["debe"]
            haber = cuenta_data["haber"]
            naturaleza = cuenta_data["naturaleza"]

            # Si es Deudora: saldo = debe - haber. Si es Acreedora: saldo = haber - debe
            if naturaleza == "DEUDORA":
                saldo = debe - haber
            else:
                saldo = haber - debe

            cuenta_data["debe"] = debe.quantize(Decimal("0.00"))
            cuenta_data["haber"] = haber.quantize(Decimal("0.00"))
            cuenta_data["saldo"] = saldo.quantize(Decimal("0.00"))
            
            results.append(cuenta_data)

        return results
