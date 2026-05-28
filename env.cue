package cuenv

import "github.com/cuenv/cuenv/schema"

// Local development environment for Comtrya. `cuenv exec -- ./start.sh`
// loads these before launching the kernel and frontend, replacing the
// legacy .envrc dotenv flow. COMTRYA_EXTENSION_DIR and the reset flag
// are left to start.sh's own defaults (`--reset` toggles a clean run).
schema.#Project & {
	name: "comtrya"

	env: {
		// Operator bootstrap code the server requires at startup. This
		// local default is rejected when COMTRYA_EXTERNAL_DEMO=1; supply
		// a real secret for shared demos.
		COMTRYA_OPERATOR_CODE: "comtrya-local-operator-code"

		// Listen addresses for the kernel API and the Vite frontend.
		COMTRYA_LISTEN:          "127.0.0.1:8080"
		COMTRYA_FRONTEND_LISTEN: "127.0.0.1:4321"
	}
}
