(component
  (core module $m
    (func (export "resolve") (result i32)
      i32.const 600))
  (core instance $i (instantiate $m))
  (func (export "resolve") (result u32)
    (canon lift (core func $i "resolve"))))
