from sqlalchemy.orm import Session
from app.models.factura import FacturaVenta, LineaFactura


def get_facturas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(FacturaVenta).order_by(FacturaVenta.creado_en.desc()).offset(skip).limit(limit).all()


def get_factura(db: Session, factura_id: int):
    return db.query(FacturaVenta).filter(FacturaVenta.id == factura_id).first()


def get_ultimo_numero_factura(db: Session) -> str:
    """Genera el siguiente número de factura correlativo: FAC-000001."""
    ultima = db.query(FacturaVenta).order_by(FacturaVenta.id.desc()).first()
    if not ultima:
        return "FAC-000001"
    # Extraer el número y sumar 1
    try:
        num = int(ultima.numero_factura.split("-")[1]) + 1
    except (IndexError, ValueError):
        num = 1
    return f"FAC-{num:06d}"
