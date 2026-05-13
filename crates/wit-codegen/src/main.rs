use std::env;
use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use comtrya_wit_codegen::{parse_extension_wit, render_rust_handlers, render_ts_client};

fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("usage: wit-codegen <ext_id> <wit_dir> <out_dir> [dep_wit_dir ...]");
        eprintln!("  emits {{out_dir}}/<ext_id>.handlers.rs and {{out_dir}}/<ext_id>.client.ts");
        eprintln!("  dep_wit_dir: additional WIT package directories the per-extension WIT");
        eprintln!("    depends on via `use`/`include` (typically the platform WIT root).");
        std::process::exit(1);
    }
    let extension_id = &args[1];
    let wit_dir = PathBuf::from(&args[2]);
    let out_dir = PathBuf::from(&args[3]);
    let dep_paths: Vec<PathBuf> = args[4..].iter().map(PathBuf::from).collect();

    fs::create_dir_all(&out_dir).with_context(|| format!("creating {}", out_dir.display()))?;
    let dep_refs: Vec<&std::path::Path> = dep_paths.iter().map(PathBuf::as_path).collect();
    let ops = parse_extension_wit(&wit_dir, extension_id, &dep_refs)?;
    let rs_path = out_dir.join(format!("{}.handlers.rs", extension_id));
    let ts_path = out_dir.join(format!("{}.client.ts", extension_id));
    fs::write(&rs_path, render_rust_handlers(&ops))
        .with_context(|| format!("writing {}", rs_path.display()))?;
    fs::write(&ts_path, render_ts_client(&ops))
        .with_context(|| format!("writing {}", ts_path.display()))?;
    eprintln!(
        "wrote {} ops → {} + {}",
        ops.len(),
        rs_path.display(),
        ts_path.display()
    );
    Ok(())
}
