import type { ColorVector, Need, Plant, SaleEvent } from "../state/GameState";
import type { PlantSuggestion } from "../systems/PlantManager";

function ensureStyles() {
  const id = "advice-panel-styles";
  if (document.getElementById(id)) {
    return;
  }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .advice-overlay {
      position: absolute;
      inset: 0;
      background: rgba(10, 15, 30, 0.78);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 20;
    }
    .advice-overlay.open {
      display: flex;
    }
    .advice-panel {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      width: min(680px, 92vw);
      max-height: 82vh;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.6);
      display: flex;
      flex-direction: column;
    }
    .advice-panel__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.9rem 1.4rem;
      background: rgba(15, 76, 129, 0.28);
      border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    }
    .advice-panel__body {
      padding: 1.15rem 1.4rem;
      overflow-y: auto;
      color: #e2e8f0;
      gap: 1rem;
      display: flex;
      flex-direction: column;
    }
    .advice-panel__need ul {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.35rem 1rem;
      font-size: 0.88rem;
    }
    .advice-panel__cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .advice-card {
      background: #111c31;
      border: 1px solid rgba(94, 234, 212, 0.22);
      border-radius: 8px;
      padding: 0.75rem 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .advice-card__header {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .advice-card__fit {
      font-size: 1.05rem;
      font-weight: 600;
      color: #5eead4;
    }
    .advice-card__details {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.3;
    }
    .advice-card button {
      background: #0ea5e9;
      border: none;
      border-radius: 6px;
      color: white;
      padding: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
    .advice-card button:disabled {
      background: #394b63;
      cursor: not-allowed;
      opacity: 0.65;
    }
    .advice-panel__status {
      font-size: 0.82rem;
      min-height: 1.2em;
      color: #f8fafc;
      opacity: 0.9;
      padding: 0.7rem 1.4rem 1rem;
    }
    .advice-panel__close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

const formatPercent = (value: number) => `${Math.round(clamp01(value) * 100)}%`;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const formatVector = (values: [number, number, number]) => values.map(formatPercent).join(" / ");

const formatColor = (color: ColorVector) => {
  const [r, g, b] = color.map(channel => Math.round(clamp01(channel) * 255));
  return `rgb(${r}, ${g}, ${b})`;
};

const resolveColor = (plant: Plant): ColorVector | undefined => plant.tags.bloom_color ?? plant.tags.fruit_color;

export type OfferResult = {
  event: SaleEvent;
  remainingStock: number;
};

export type OfferHandler = (plant: Plant, fitScore: number) => Promise<OfferResult> | OfferResult;

export default class AdvicePanel {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private readonly statusEl: HTMLDivElement;
  private offerHandler?: OfferHandler;
  private openState = false;
  private escHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.close();
    }
  };

  constructor() {
    ensureStyles();
    this.root = document.createElement("div");
    this.root.className = "advice-overlay";

    this.panel = document.createElement("div");
    this.panel.className = "advice-panel";

    const header = document.createElement("div");
    header.className = "advice-panel__head";
    header.innerHTML = `
      <h2 style="margin:0;font-size:1.05rem;">Match a Plant</h2>
      <button class="advice-panel__close" title="Close">×</button>
    `;

    this.body = document.createElement("div");
    this.body.className = "advice-panel__body";

    this.statusEl = document.createElement("div");
    this.statusEl.className = "advice-panel__status";
    this.statusEl.textContent = "";

    this.panel.appendChild(header);
    this.panel.appendChild(this.body);
    this.panel.appendChild(this.statusEl);
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);

    this.root.addEventListener("click", event => {
      if (event.target === this.root) {
        this.close();
      }
    });
    header.querySelector<HTMLButtonElement>(".advice-panel__close")?.addEventListener("click", () => this.close());
  }

  get isOpen(): boolean {
    return this.openState;
  }

  open(need: Need, suggestions: PlantSuggestion[], onOffer: OfferHandler) {
    this.offerHandler = onOffer;
    this.render(need, suggestions);
    this.statusEl.textContent = "";
    this.root.classList.add("open");
    this.openState = true;
    document.addEventListener("keydown", this.escHandler);
  }

  close() {
    this.root.classList.remove("open");
    this.openState = false;
    document.removeEventListener("keydown", this.escHandler);
  }

  private setOutcome({ event }: OfferResult) {
    const fitPercent = Math.round(event.fitScore * 100);
    this.statusEl.textContent = event.success
      ? `Success! Customer bought it (fit ${fitPercent}%).`
      : `No go. They passed on that offer (fit ${fitPercent}%).`;
  }

  private render(need: Need, suggestions: PlantSuggestion[]) {
    const summaryItems: string[] = [
      `Sun preference: ${formatPercent(need.light)}`,
      `Moisture: ${formatPercent(need.moisture)}`,
      `Soil (drain/pH/nutrients): ${formatVector(need.soil)}`,
      `Container needed: ${need.container ? "yes" : "no"}`,
      `Size target: ${need.size[0]} (${formatPercent(need.size[1])})`,
      `Hardiness target: ${formatPercent(need.hardiness)}`,
      need.wildlife_goal.length ? `Wildlife goal: ${need.wildlife_goal.join(", ")}` : "Wildlife goal: none"
    ];

    if (need.color) {
      summaryItems.push(`Preferred color: ${formatColor(need.color)}`);
    }

    const summaryHtml = `
      <section class="advice-panel__need">
        <h3 style="margin:0;font-size:0.95rem;">Customer need</h3>
        <ul>${summaryItems.map(item => `<li>${item}</li>`).join("")}</ul>
      </section>
    `;

    const cardsHtml = `
      <section>
        <h3 style="margin:0 0 0.5rem 0;font-size:0.95rem;">Suggestions</h3>
        <div class="advice-panel__cards">
          ${suggestions
            .map(suggestion => {
              const fitPercent = Math.round(suggestion.score * 100);
              const disabled = suggestion.stock <= 0 ? "disabled" : "";
              const stockLabel = suggestion.stock > 0 ? `${suggestion.stock} in stock` : "Out of stock";
              const color = resolveColor(suggestion.plant);
              const colorSwatch = color
                ? `<span style="display:inline-flex;align-items:center;gap:0.35rem;">Color
                    <span style="width:14px;height:14px;border-radius:50%;background:${formatColor(color)};"></span>
                  </span>`
                : "Color n/a";
              const [sizeClass, sizeValue] = suggestion.plant.tags.size;
              return `
                <article class="advice-card" data-plant="${suggestion.plant.id}">
                  <div class="advice-card__header">
                    <strong>${suggestion.plant.name}</strong>
                    <span class="advice-card__fit">Fit: ${fitPercent}%</span>
                  </div>
                  <div>MSRP: $${suggestion.plant.msrp.toFixed(2)}</div>
                  <div class="advice-card__details">
                    <div>Sun ${formatPercent(suggestion.plant.tags.sun)} · Moisture ${formatPercent(
                      suggestion.plant.tags.moisture
                    )}</div>
                    <div>Soil ${formatVector(suggestion.plant.tags.soil)}</div>
                    <div>${colorSwatch}</div>
                    <div>Size ${sizeClass} (${formatPercent(sizeValue)}) · Container ${
                suggestion.plant.tags.container ? "yes" : "no"
              }</div>
                    <div>${stockLabel}</div>
                  </div>
                  <button type="button" data-offer="${suggestion.plant.id}" ${disabled}>Offer</button>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;

    this.body.innerHTML = summaryHtml + cardsHtml;

    this.body.querySelectorAll<HTMLButtonElement>("button[data-offer]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!this.offerHandler) {
          return;
        }
        const id = button.dataset.offer as string;
        const suggestion = suggestions.find(entry => entry.plant.id === id);
        if (!suggestion) {
          return;
        }
        button.disabled = true;
        const result = await Promise.resolve(this.offerHandler(suggestion.plant, suggestion.score));
        this.setOutcome(result);
        suggestion.stock = result.remainingStock;
        const stockLabel = button.parentElement?.querySelector<HTMLElement>(".advice-card__details div:last-child");
        if (stockLabel) {
          stockLabel.textContent = suggestion.stock > 0 ? `${suggestion.stock} in stock` : "Out of stock";
        }
        if (!result.event.success && suggestion.stock > 0) {
          button.disabled = false;
        } else if (result.event.success) {
          button.textContent = "Sold";
        }
      });
    });
  }
}
