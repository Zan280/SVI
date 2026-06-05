from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.auth import get_current_user, check_branch_access
from app.models.user import Usuario
from app.services.report_service import ReportService
from app.schemas.report import DashboardStats, CategoryDistribution, MonthlyMovementsTrend

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_summary(
    sucursal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene las estadísticas del dashboard.
    - Encargado: Limitado a su sucursal de manera obligatoria.
    - Admin/Contador: Global o filtrable por sucursal.
    """
    sucursal_id_filtrada = check_branch_access(current_user, sucursal_id)
    return ReportService.get_dashboard_stats(db, sucursal_id=sucursal_id_filtrada)


@router.get("/categories", response_model=List[CategoryDistribution])
def get_dashboard_category_distribution(
    sucursal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene la distribución de inventario por categoría.
    - Encargado: Limitado a su sucursal.
    """
    sucursal_id_filtrada = check_branch_access(current_user, sucursal_id)
    return ReportService.get_category_distribution(db, sucursal_id=sucursal_id_filtrada)


@router.get("/trends", response_model=List[MonthlyMovementsTrend])
def get_dashboard_movements_trend(
    sucursal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene la tendencia de movimientos del dashboard.
    - Encargado: Limitado a su sucursal.
    """
    sucursal_id_filtrada = check_branch_access(current_user, sucursal_id)
    return ReportService.get_monthly_movements_trend(db, sucursal_id=sucursal_id_filtrada)
