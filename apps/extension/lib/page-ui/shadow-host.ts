/** Mounts an isolated shadow root on top of the page (max z-index, no CSS leakage). */
export function createShadowHost(id: string, css: string): { host: HTMLElement; root: ShadowRoot } {
  document.getElementById(id)?.remove();
  const host = document.createElement("div");
  host.id = id;
  host.style.cssText =
    "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;";
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);
  document.documentElement.append(host);
  return { host, root };
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Pick<HTMLElement, "className" | "textContent" | "title">> & {
    attrs?: Record<string, string>;
  } = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.textContent) node.textContent = props.textContent;
  if (props.title) node.title = props.title;
  for (const [key, value] of Object.entries(props.attrs ?? {})) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

export const BASE_CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  button { font: inherit; cursor: pointer; border: 0; }
  button:focus-visible { outline: 3px solid #a5b4fc; outline-offset: 2px; }
`;
