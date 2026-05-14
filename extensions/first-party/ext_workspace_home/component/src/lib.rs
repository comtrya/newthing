// ext_workspace_home — layout-only WASM Component-Model implementation.

#[allow(warnings)]
mod bindings;

use bindings::comtrya::platform::types::{Error, Event};
use bindings::exports::comtrya::ext_workspace_home::home::Guest as HomeGuest;
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

struct Component;

impl HomeGuest for Component {
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
