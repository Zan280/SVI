from app.schemas.role import RoleCreate, RoleUpdate, RoleOut
from app.schemas.user import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.schemas.client import ClienteCreate, ClienteUpdate, ClienteOut
from app.schemas.supplier import ProveedorCreate, ProveedorUpdate, ProveedorOut
from app.schemas.inventory import InventarioCreate, InventarioUpdate, InventarioOut
from app.schemas.branch import SucursalCreate, SucursalUpdate, SucursalOut
from app.schemas.category import CategoriaCreate, CategoriaUpdate, CategoriaOut
from app.schemas.branch_stock import InventarioSucursalCreate, InventarioSucursalUpdate, InventarioSucursalOut, InventarioSucursalDetail
from app.schemas.movement import MovimientoInventarioCreate, MovimientoInventarioOut, MovimientoInventarioDetail
from app.schemas.transfer import TrasladoCreate, TrasladoUpdate, TrasladoOut, TrasladoDetail
from app.schemas.kardex import KardexCreate, KardexOut, KardexDetail
from app.schemas.account import PlanCuentasCreate, PlanCuentasUpdate, PlanCuentasOut, PlanCuentasNode
from app.schemas.journal import DetalleAsientoCreate, DetalleAsientoOut, DetalleAsientoDetail, AsientoContableCreate, AsientoContableOut, AsientoContableDetail
from app.schemas.report import StockValuationRow, DashboardStats, CategoryDistribution, MonthlyMovementsTrend, AccountBalanceRow

