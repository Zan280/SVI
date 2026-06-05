from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from app.database import get_db
from app.auth import RoleChecker, get_current_user
from app.models.factura import FacturaVenta, LineaFactura
from app.models.inventory import InventarioBase
from app.schemas.report import StockValuationRow, AccountBalanceRow
from app.services.report_service import ReportService
from app.services.export_service import ExportService
from app.crud.inventory import get_inventario
from app.crud.branch import get_sucursal

router = APIRouter()

# Restringido a Admin o Contador
require_financial_access = RoleChecker(["Administrador Global", "Contador"])


@router.get("/valuation", response_model=List[StockValuationRow])
def get_stock_valuation_report(
    sucursal_id: Optional[int] = None,
    categoria_id: Optional[int] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    return ReportService.get_stock_valuation(db, sucursal_id=sucursal_id, categoria_id=categoria_id, query=query)


@router.get("/balances", response_model=List[AccountBalanceRow])
def get_accounting_trial_balance(
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    return ReportService.get_account_balances(db)


@router.get("/kardex/pdf")
def export_kardex_report_pdf(
    producto_id: int,
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    producto = get_inventario(db, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    sucursal = get_sucursal(db, sucursal_id)
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    from app.crud.kardex import get_kardex_entries
    entries = get_kardex_entries(db, producto_id=producto_id, sucursal_id=sucursal_id, limit=1000)

    if not entries:
        raise HTTPException(status_code=400, detail="El producto no registra movimientos en esta sucursal.")

    kardex_data = []
    for entry in entries:
        kardex_data.append({
            "creado_en": entry.creado_en,
            "tipo_movimiento": entry.tipo_movimiento,
            "cantidad_entrada": entry.cantidad_entrada,
            "costo_entrada": entry.costo_entrada,
            "cantidad_salida": entry.cantidad_salida,
            "costo_salida": entry.costo_salida,
            "cantidad_saldo": entry.cantidad_saldo,
            "costo_unitario_saldo": entry.costo_unitario_saldo,
            "costo_total_saldo": entry.costo_total_saldo,
            "referencia": entry.movimiento.referencia if entry.movimiento else None,
        })

    pdf_bytes = ExportService.export_kardex_pdf(
        kardex_entries=kardex_data,
        producto_nombre=producto.nombre,
        codigo_barras=producto.codigo_barras,
        sucursal_nombre=sucursal.nombre
    )

    filename = f"kardex_{sucursal.codigo}_{producto.codigo_barras}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/balances/pdf")
def export_accounting_balances_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    balances = ReportService.get_account_balances(db)
    pdf_bytes = ExportService.export_accounting_pdf(balances)
    filename = f"balance_comprobacion_{datetime.now().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─── REPORTE DE VENTAS ───────────────────────────────────────────────────────

def _build_ventas_query(db: Session, codigo: Optional[str], fecha_inicio: Optional[date], fecha_fin: Optional[date]):
    """Helper para construir la query del reporte de ventas con filtros."""
    q = db.query(
        FacturaVenta.numero_factura,
        FacturaVenta.creado_en,
        FacturaVenta.cliente_nombre,
        InventarioBase.codigo_barras,
        InventarioBase.nombre.label("nombre_producto"),
        LineaFactura.tipo_item,
        LineaFactura.cantidad,
        LineaFactura.precio_venta,
        LineaFactura.costo_cpp,
        LineaFactura.subtotal,
    ).join(LineaFactura, FacturaVenta.id == LineaFactura.factura_id
    ).join(InventarioBase, LineaFactura.producto_id == InventarioBase.id)

    filters = []
    if codigo:
        filters.append(InventarioBase.codigo_barras.ilike(f"%{codigo}%"))
    if fecha_inicio:
        filters.append(FacturaVenta.creado_en >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        filters.append(FacturaVenta.creado_en <= datetime.combine(fecha_fin, datetime.max.time()))

    if filters:
        q = q.filter(and_(*filters))

    return q.order_by(FacturaVenta.creado_en.desc())


@router.get("/ventas")
def get_ventas_report(
    codigo: Optional[str] = Query(None, description="Filtrar por código de producto"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha de inicio del período"),
    fecha_fin: Optional[date] = Query(None, description="Fecha de fin del período"),
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """Reporte de ventas (Productos y Servicios) con filtros por código y período."""
    q = _build_ventas_query(db, codigo, fecha_inicio, fecha_fin)
    rows = q.limit(500).all()

    result = []
    total_general = Decimal("0.00")
    for row in rows:
        subtotal = Decimal(str(row.subtotal))
        total_general += subtotal
        result.append({
            "numero_factura": row.numero_factura,
            "fecha": row.creado_en.isoformat() if row.creado_en else None,
            "cliente": row.cliente_nombre or "Cliente General",
            "codigo_barras": row.codigo_barras,
            "nombre_producto": row.nombre_producto,
            "tipo_item": row.tipo_item,
            "cantidad": float(row.cantidad),
            "precio_venta": float(row.precio_venta),
            "costo_cpp": float(row.costo_cpp),
            "subtotal": float(subtotal),
        })

    return {"filas": result, "total_general": float(total_general)}


@router.get("/ventas/pdf")
def export_ventas_pdf(
    codigo: Optional[str] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """Exporta el reporte de ventas en PDF."""
    q = _build_ventas_query(db, codigo, fecha_inicio, fecha_fin)
    rows = q.limit(500).all()

    ventas_data = []
    for row in rows:
        ventas_data.append({
            "numero_factura": row.numero_factura,
            "fecha": row.creado_en,
            "cliente": row.cliente_nombre or "Cliente General",
            "codigo_barras": row.codigo_barras,
            "nombre_producto": row.nombre_producto,
            "tipo_item": row.tipo_item,
            "cantidad": Decimal(str(row.cantidad)),
            "precio_venta": Decimal(str(row.precio_venta)),
            "subtotal": Decimal(str(row.subtotal)),
        })

    periodo_str = ""
    if fecha_inicio and fecha_fin:
        periodo_str = f"{fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}"
    elif fecha_inicio:
        periodo_str = f"Desde {fecha_inicio.strftime('%d/%m/%Y')}"
    elif fecha_fin:
        periodo_str = f"Hasta {fecha_fin.strftime('%d/%m/%Y')}"

    pdf_bytes = ExportService.export_ventas_pdf(ventas_data, periodo_str=periodo_str)
    filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/ventas/excel")
def export_ventas_excel(
    codigo: Optional[str] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_financial_access)
):
    """Exporta el reporte de ventas en Excel (.xlsx)."""
    q = _build_ventas_query(db, codigo, fecha_inicio, fecha_fin)
    rows = q.limit(500).all()

    ventas_data = []
    for row in rows:
        ventas_data.append({
            "numero_factura": row.numero_factura,
            "fecha": row.creado_en,
            "cliente": row.cliente_nombre or "Cliente General",
            "codigo_barras": row.codigo_barras,
            "nombre_producto": row.nombre_producto,
            "tipo_item": row.tipo_item,
            "cantidad": Decimal(str(row.cantidad)),
            "precio_venta": Decimal(str(row.precio_venta)),
            "subtotal": Decimal(str(row.subtotal)),
        })

    excel_bytes = ExportService.export_ventas_excel(ventas_data)
    filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
