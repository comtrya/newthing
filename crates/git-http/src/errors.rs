use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

pub enum GitHttpError {
    NotFound,
    Forbidden,
    BadRequest(String),
    Internal(String),
}

impl IntoResponse for GitHttpError {
    fn into_response(self) -> Response {
        match self {
            GitHttpError::NotFound => (StatusCode::NOT_FOUND, "not found").into_response(),
            GitHttpError::Forbidden => (StatusCode::FORBIDDEN, "forbidden").into_response(),
            GitHttpError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg).into_response(),
            GitHttpError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response(),
        }
    }
}
