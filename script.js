// Show a styled placeholder for any image that hasn't been added yet
function watchImages(root = document) {
  root.querySelectorAll(".photo img").forEach((img) => {
    const mark = () => img.closest(".photo").classList.add("missing");
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener("error", mark, { once: true });
  });
}

const labels = { avocado: "Avocado", rice: "Rice", "gluten-free": "Gluten-Free", bread: "Bread", sweet: "Sweet" };
const tagHTML = (tags) => tags.map((t) => `<span class="tag ${t}">${labels[t] || t}</span>`).join("");

const grid = document.getElementById("recipe-grid");

function render(filter = "all") {
  const list = filter === "all" ? RECIPES : RECIPES.filter((r) => r.tags.includes(filter));
  grid.innerHTML = list.map((r) => `
    <article class="card" data-id="${r.id}" tabindex="0">
      <figure class="photo" data-label="${r.title}">
        <img src="images/${r.id}.jpg" alt="${r.title}" loading="lazy">
      </figure>
      <div class="card-body">
        <h3>${r.title}</h3>
        <p>${r.blurb}</p>
        <div class="tags">${tagHTML(r.tags)}</div>
        <div class="meta"><span>⏱ ${r.time}</span><span>🍽 ${r.serves}</span></div>
      </div>
    </article>`).join("");
  watchImages(grid);
}

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    render(chip.dataset.filter);
  })
);

// Modal
const modal = document.getElementById("recipe-modal");
const body = document.getElementById("modal-body");

function openRecipe(id) {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) return;
  const n = r.nutrition;
  body.innerHTML = `
    <figure class="photo modal-hero" data-label="${r.title}"><img src="images/${r.id}.jpg" alt="${r.title}"></figure>
    <div class="modal-content">
      <div class="tags">${tagHTML(r.tags)}</div>
      <h2>${r.title}</h2>
      <p class="meta"><span>⏱ ${r.time}</span><span>🍽 ${r.serves}</span></p>
      <div class="nutrition">
        <div><strong>${n.kcal}</strong>kcal</div>
        <div><strong>${n.protein}</strong>protein</div>
        <div><strong>${n.fiber}</strong>fiber</div>
        <div><strong>${n.sugar}</strong>sugar</div>
      </div>
      <h4>Ingredients</h4>
      <ul>${r.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
      <h4>Method</h4>
      <ol>${r.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      <div class="tip"><strong>Baker's tip:</strong> ${r.tip}</div>
      <p class="meta" style="margin-top:18px">Nutrition is an estimate per serving.</p>
    </div>`;
  watchImages(body);
  modal.showModal();
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openRecipe(card.dataset.id);
});
grid.addEventListener("keydown", (e) => {
  const card = e.target.closest(".card");
  if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openRecipe(card.dataset.id); }
});
modal.querySelector(".close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

render();
watchImages();
