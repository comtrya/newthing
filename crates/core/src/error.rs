use std::fmt::{Display, Formatter};

pub type CoreResult<T> = Result<T, CoreError>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ErrorCode {
    BadUserInput,
    Unauthenticated,
    Forbidden,
    NotFound,
    Conflict,
    ConfigInvalid,
    ExtensionDisabled,
    ExtensionActivationFailed,
    StorageUnavailable,
    RateLimited,
    Unsupported,
    InternalServerError,
    SchemaChanged,
}

impl ErrorCode {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::BadUserInput => "BAD_USER_INPUT",
            Self::Unauthenticated => "UNAUTHENTICATED",
            Self::Forbidden => "FORBIDDEN",
            Self::NotFound => "NOT_FOUND",
            Self::Conflict => "CONFLICT",
            Self::ConfigInvalid => "CONFIG_INVALID",
            Self::ExtensionDisabled => "EXTENSION_DISABLED",
            Self::ExtensionActivationFailed => "EXTENSION_ACTIVATION_FAILED",
            Self::StorageUnavailable => "STORAGE_UNAVAILABLE",
            Self::RateLimited => "RATE_LIMITED",
            Self::Unsupported => "UNSUPPORTED",
            Self::InternalServerError => "INTERNAL_SERVER_ERROR",
            Self::SchemaChanged => "SCHEMA_CHANGED",
        }
    }
}

impl Display for ErrorCode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CoreError {
    pub code: ErrorCode,
    pub message: String,
    pub resource: Option<String>,
    pub permission: Option<String>,
}

impl CoreError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            resource: None,
            permission: None,
        }
    }

    pub fn bad_user_input(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::BadUserInput, message)
    }

    pub fn config_invalid(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::ConfigInvalid, message)
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::Conflict, message)
    }

    pub fn forbidden(
        message: impl Into<String>,
        resource: impl Into<String>,
        permission: impl Into<String>,
    ) -> Self {
        Self {
            code: ErrorCode::Forbidden,
            message: message.into(),
            resource: Some(resource.into()),
            permission: Some(permission.into()),
        }
    }

    pub fn storage_unavailable(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::StorageUnavailable, message)
    }

    pub fn extension_activation_failed(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::ExtensionActivationFailed, message)
    }

    pub fn rate_limited(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::RateLimited, message)
    }
}

impl Display for CoreError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for CoreError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn graphql_error_codes_match_spec_spellings() {
        let required = [
            (ErrorCode::BadUserInput, "BAD_USER_INPUT"),
            (ErrorCode::Unauthenticated, "UNAUTHENTICATED"),
            (ErrorCode::Forbidden, "FORBIDDEN"),
            (ErrorCode::NotFound, "NOT_FOUND"),
            (ErrorCode::Conflict, "CONFLICT"),
            (ErrorCode::ConfigInvalid, "CONFIG_INVALID"),
            (ErrorCode::ExtensionDisabled, "EXTENSION_DISABLED"),
            (
                ErrorCode::ExtensionActivationFailed,
                "EXTENSION_ACTIVATION_FAILED",
            ),
            (ErrorCode::StorageUnavailable, "STORAGE_UNAVAILABLE"),
            (ErrorCode::RateLimited, "RATE_LIMITED"),
            (ErrorCode::Unsupported, "UNSUPPORTED"),
            (ErrorCode::InternalServerError, "INTERNAL_SERVER_ERROR"),
            (ErrorCode::SchemaChanged, "SCHEMA_CHANGED"),
        ];

        for (code, expected) in required {
            assert_eq!(code.as_str(), expected);
        }
    }

    #[test]
    fn forbidden_errors_carry_resource_and_permission_extensions() {
        let err = CoreError::forbidden(
            "cannot read repository",
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "git:read",
        );

        assert_eq!(err.code, ErrorCode::Forbidden);
        assert_eq!(
            err.resource.as_deref(),
            Some("comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3")
        );
        assert_eq!(err.permission.as_deref(), Some("git:read"));
    }
}
