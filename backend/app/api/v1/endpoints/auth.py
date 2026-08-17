from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import authenticate_user, create_access_token, get_current_user
from app.crud.user import get_usuario_by_email
from app.models.user import Usuario

router = APIRouter()


class GoogleLoginRequest(BaseModel):
    email: EmailStr


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Autenticación de usuario. Retorna un token JWT."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "email": user.email,
            "role_id": user.role_id,
            "role_nombre": user.role.nombre,
            "sucursal_id": user.sucursal_id,
        }
    }


@router.post("/google-login")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Autenticación vía Google OAuth.
    Verifica si el email existe en la DB local (usuarios) y si está activo.
    """
    user = get_usuario_by_email(db, payload.email)
    if not user or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Tu cuenta no está registrada en el sistema ERP. Contacta al administrador."
        )
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "email": user.email,
            "role_id": user.role_id,
            "role_nombre": user.role.nombre,
            "sucursal_id": user.sucursal_id,
        }
    }


@router.get("/me")
def get_me(current_user: Usuario = Depends(get_current_user)):
    """Retorna los datos del usuario autenticado."""
    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "role_nombre": current_user.role.nombre,
        "sucursal_id": current_user.sucursal_id,
    }


