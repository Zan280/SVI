from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.crud.user import get_usuario_by_email, verify_password
from app.models.user import Usuario

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Genera un token JWT con los datos proporcionados."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def authenticate_user(db: Session, email: str, password: str):
    """Verifica credenciales y retorna el usuario si son válidas."""
    user = get_usuario_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dependency que extrae y valida el usuario actual del token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_usuario_by_email(db, email)
    if user is None:
        raise credentials_exception
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Usuario = Depends(get_current_user)) -> Usuario:
        # Se asume que el usuario tiene la relación 'role' cargada
        rol_nombre = current_user.role.nombre
        if rol_nombre not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado. Se requiere uno de los siguientes roles: {', '.join(self.allowed_roles)}"
            )
        return current_user


def check_branch_access(current_user: Usuario, sucursal_id: Optional[int]) -> int:
    """
    Verifica el acceso de un usuario a una sucursal.
    - Si es Admin o Contador: acceso libre. Si sucursal_id es None, retorna None (todos).
    - Si es Encargado de Sucursal: sólo puede ver su sucursal. Si sucursal_id es None, se asigna su sucursal_id.
      Si se especifica otro sucursal_id, arroja 403.
    """
    rol_nombre = current_user.role.nombre

    if rol_nombre in ["Administrador Global", "Contador"]:
        return sucursal_id

    # Para Encargado de Sucursal
    user_branch_id = current_user.sucursal_id
    if not user_branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El encargado no tiene asignada ninguna sucursal activa."
        )

    if sucursal_id is None:
        return user_branch_id

    if sucursal_id != user_branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a información de otras sucursales."
        )

    return user_branch_id

