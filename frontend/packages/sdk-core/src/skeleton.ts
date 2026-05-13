/**
 * `<comtrya-skeleton>` — minimal accessible loading placeholder.
 *
 * Attributes:
 *   width  — CSS length (default `100%`)
 *   height — CSS length (default `1em`)
 *   rounded — present to apply a rounded shape
 *
 * Skeletons set `aria-busy="true"` and `role="status"` so screen
 * readers announce them.
 */

export function defineSkeletonElement(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get("comtrya-skeleton")) return;
  customElements.define(
    "comtrya-skeleton",
    class extends HTMLElement {
      static observedAttributes = ["width", "height", "rounded"];
      connectedCallback() {
        this.setAttribute("aria-busy", "true");
        this.setAttribute("role", "status");
        this.style.display = "inline-block";
        this.style.background = "linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)";
        this.style.backgroundSize = "200% 100%";
        this.style.animation = "comtrya-skeleton-shimmer 1.5s infinite";
        this.update();
        ensureKeyframes();
      }
      attributeChangedCallback() {
        this.update();
      }
      private update() {
        this.style.width = this.getAttribute("width") ?? "100%";
        this.style.height = this.getAttribute("height") ?? "1em";
        this.style.borderRadius = this.hasAttribute("rounded") ? "9999px" : "4px";
      }
    },
  );
}

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("comtrya-skeleton-keyframes")) return;
  const style = document.createElement("style");
  style.id = "comtrya-skeleton-keyframes";
  style.textContent = `@keyframes comtrya-skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
  document.head.appendChild(style);
}
