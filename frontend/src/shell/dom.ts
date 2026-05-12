type Child = Node | string | null | undefined;

interface ElProps {
  className?: string;
  textContent?: string;
  dataset?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
  attrs?: Record<string, string>;
  type?: string;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.textContent !== undefined) node.textContent = props.textContent;
  if (props.dataset) {
    for (const [k, v] of Object.entries(props.dataset)) node.dataset[k] = v;
  }
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) node.setAttribute(k, v);
  }
  if (props.type && "type" in node) (node as HTMLInputElement).type = props.type;
  if (props.onClick) node.addEventListener("click", props.onClick as EventListener);
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

export function text(value: string): Text {
  return document.createTextNode(value);
}
