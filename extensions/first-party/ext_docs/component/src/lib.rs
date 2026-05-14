// ext_docs — repo-resident docs WASM extension.
//
// Backend is intentionally minimal in 0.1.0: the data path is kernel-owned
// (CUE evaluation + repo file tree exposed on `repository.comtryaConfig`
// and `repository.files`), and the UI bundle owns rendering. We export
// a `ping` op only because every first-party extension must ship a real
// component with at least one interface op. 0.2.0 moves MDX front-matter
// extraction here once we want server-side validation against the
// `properties` declared in each Project's doc-type CUE.

#[allow(warnings)]
mod bindings;

use bindings::comtrya::platform::types::{Error, Event};
use bindings::exports::comtrya::ext_docs::docs::Guest as DocsGuest;
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

struct Component;

impl DocsGuest for Component {
    fn ping() -> Result<String, Error> {
        Ok("ok".to_string())
    }
}

impl ReactorGuest for Component {
    fn subscribed_event_types() -> Result<Vec<String>, Error> {
        Ok(Vec::new())
    }

    fn on_event(_triggering_event: Event) -> Result<Vec<Reaction>, Error> {
        Ok(Vec::new())
    }
}

bindings::export!(Component with_types_in bindings);
