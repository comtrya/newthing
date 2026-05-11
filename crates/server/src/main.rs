use forgepoint_core::{
    CorsPolicy, InstanceCapabilities, InstanceConfig, allowed_methods_for_route,
};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};

fn main() {
    let config = InstanceConfig::minimal_dev();
    if let Err(error) = config.validate() {
        eprintln!("forgepoint-server refused to start: {error}");
        std::process::exit(1);
    }

    if std::env::args().any(|arg| arg == "--check") {
        let response = handle_request(
            "GET /healthz HTTP/1.1\r\nOrigin: http://localhost:4321\r\n\r\n",
            &config,
        );
        println!("forgepoint-server ready status={}", response.status);
        return;
    }

    let addr = std::env::var("FORGEPOINT_LISTEN").unwrap_or_else(|_| "127.0.0.1:8080".to_string());
    let listener = TcpListener::bind(&addr).unwrap_or_else(|error| {
        eprintln!("failed to bind {addr}: {error}");
        std::process::exit(1);
    });
    println!("forgepoint-server listening on http://{addr}");

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => handle_connection(stream, &config),
            Err(error) => eprintln!("connection failed: {error}"),
        }
    }
}

fn handle_connection(mut stream: TcpStream, config: &InstanceConfig) {
    let mut buffer = [0; 8192];
    let bytes = match stream.read(&mut buffer) {
        Ok(bytes) => bytes,
        Err(error) => {
            eprintln!("request read failed: {error}");
            return;
        }
    };
    let request = String::from_utf8_lossy(&buffer[..bytes]);
    let response = handle_request(&request, config);
    if let Err(error) = stream.write_all(response.to_http().as_bytes()) {
        eprintln!("response write failed: {error}");
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct HttpResponse {
    status: u16,
    content_type: String,
    headers: Vec<(String, String)>,
    body: String,
}

impl HttpResponse {
    fn ok(content_type: &str, body: impl Into<String>) -> Self {
        Self {
            status: 200,
            content_type: content_type.to_string(),
            headers: Vec::new(),
            body: body.into(),
        }
    }

    fn with_header(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.push((name.into(), value.into()));
        self
    }

    fn error(status: u16, body: impl Into<String>) -> Self {
        Self {
            status,
            content_type: "application/json".to_string(),
            headers: Vec::new(),
            body: body.into(),
        }
    }

    fn to_http(&self) -> String {
        let reason = match self.status {
            200 => "OK",
            204 => "No Content",
            401 => "Unauthorized",
            403 => "Forbidden",
            404 => "Not Found",
            _ => "Internal Server Error",
        };
        let mut response = format!(
            "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\n",
            self.status,
            reason,
            self.content_type,
            self.body.len()
        );
        for (name, value) in &self.headers {
            response.push_str(&format!("{name}: {value}\r\n"));
        }
        response.push_str("\r\n");
        response.push_str(&self.body);
        response
    }
}

fn handle_request(request: &str, config: &InstanceConfig) -> HttpResponse {
    let mut lines = request.lines();
    let request_line = lines.next().unwrap_or_default();
    let mut request_parts = request_line.split_whitespace();
    let method = request_parts.next().unwrap_or_default();
    let target = request_parts.next().unwrap_or("/");
    let path = target.split('?').next().unwrap_or(target);
    let origin = request
        .lines()
        .find_map(|line| line.strip_prefix("Origin: "))
        .unwrap_or("http://localhost:4321");

    let cors = CorsPolicy {
        allowed_origins: config.allowed_origins.clone(),
    };
    let cors_headers = match cors.check(origin, path) {
        Ok(headers) => headers,
        Err(_) => {
            return HttpResponse::error(
                403,
                "{\"errors\":[{\"extensions\":{\"code\":\"FORBIDDEN\"}}]}",
            );
        }
    };

    if method == "OPTIONS" {
        return cors_headers.into_iter().fold(
            HttpResponse::ok("text/plain", ""),
            |response, (name, value)| response.with_header(name, value),
        );
    }

    let response = match (method, path) {
        ("GET", "/healthz") => HttpResponse::ok("application/json", "{\"status\":\"ok\"}"),
        ("GET" | "POST", "/graphql") => {
            let capabilities = InstanceCapabilities::v1();
            HttpResponse::ok(
                "application/json",
                format!(
                    "{{\"data\":{{\"instance\":{{\"capabilities\":{{\"gitHTTPS\":{},\"gitLFS\":{},\"sse\":{},\"graphqlSubscriptions\":{},\"extensionRuntime\":{}}}}}}}}}",
                    capabilities.git_https,
                    capabilities.git_lfs,
                    capabilities.sse,
                    capabilities.graphql_subscriptions,
                    capabilities.extension_runtime
                ),
            )
        }
        ("GET", "/graphql/stream") | ("GET", "/events") => HttpResponse::ok(
            "text/event-stream",
            "event: dev.forgepoint.stream.ready\ndata: {\"ok\":true}\n\n",
        ),
        ("POST", "/events/session") | ("POST", "/_extensions/session") => HttpResponse::ok(
            "application/json",
            "{\"session\":\"development-session\",\"expiresIn\":300}",
        ),
        ("GET", path) if path == "/_extensions/ext_01hv/manifest.json" => HttpResponse::ok(
            "application/json",
            include_str!("../../../extensions/examples/pull-requests/ui/manifest.json"),
        ),
        ("GET", path) if path.starts_with("/_extensions/ext_01hv/assets/index") => {
            HttpResponse::ok(
                "text/javascript",
                include_str!("../../../extensions/examples/pull-requests/assets/index.js"),
            )
            .with_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'",
            )
            .with_header("ETag", "\"development\"")
        }
        ("GET" | "POST", path) if path.starts_with("/git/") => HttpResponse::error(
            401,
            "{\"errors\":[{\"extensions\":{\"code\":\"UNAUTHENTICATED\"}}]}",
        )
        .with_header("WWW-Authenticate", "Bearer realm=\"forgepoint\""),
        _ => HttpResponse::error(
            404,
            "{\"errors\":[{\"extensions\":{\"code\":\"NOT_FOUND\"}}]}",
        ),
    };

    let mut response = cors_headers
        .into_iter()
        .fold(response, |response, (name, value)| {
            response.with_header(name, value)
        });
    response = response.with_header(
        "Access-Control-Allow-Methods",
        allowed_methods_for_route(path).join(", "),
    );
    response
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config() -> InstanceConfig {
        InstanceConfig::minimal_dev()
    }

    #[test]
    fn health_route_returns_ok() {
        let response = handle_request(
            "GET /healthz HTTP/1.1\r\nOrigin: http://localhost:4321\r\n\r\n",
            &config(),
        );

        assert_eq!(response.status, 200);
        assert_eq!(response.body, "{\"status\":\"ok\"}");
    }

    #[test]
    fn graphql_route_exposes_v1_capabilities() {
        let response = handle_request(
            "POST /graphql HTTP/1.1\r\nOrigin: http://localhost:4321\r\n\r\n",
            &config(),
        );

        assert_eq!(response.status, 200);
        assert!(response.body.contains("\"gitLFS\":false"));
    }

    #[test]
    fn disallowed_origin_is_forbidden() {
        let response = handle_request(
            "POST /graphql HTTP/1.1\r\nOrigin: https://evil.example\r\n\r\n",
            &config(),
        );

        assert_eq!(response.status, 403);
    }

    #[test]
    fn git_route_requires_authentication() {
        let response = handle_request(
            "GET /git/default/example.git/info/refs?service=git-upload-pack HTTP/1.1\r\nOrigin: http://localhost:4321\r\n\r\n",
            &config(),
        );

        assert_eq!(response.status, 401);
        assert!(
            response
                .headers
                .iter()
                .any(|(name, _)| name == "WWW-Authenticate")
        );
    }
}
