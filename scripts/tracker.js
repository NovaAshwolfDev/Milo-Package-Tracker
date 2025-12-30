Promise.all([
  fetch("packages.json").then(r => r.json()),
  fetch("./images/atlas.json").then(r => r.json())
]).then(([packages, atlas]) => {
  window.ATLAS = atlas;
  renderPackages(packages);
});


function weeksSince(dateString) {
  const added = new Date(dateString);
  const now = new Date();
  const diffMs = now - added;
  const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
  return Math.floor(weeks);
}

function renderPackages(packages) {
  const container = document.getElementById("package-list");
  container.innerHTML = "";

  packages.forEach(pkg => {
    const div = document.createElement("div");
    div.className = "package";
    if (pkg.color) {
      div.style.setProperty("--accent", pkg.color);
    }
    let visual;

    if (pkg.sprite && window.ATLAS) {
      const frame = ATLAS.frames[pkg.sprite].frame;

      const MAX_SIZE = 150;

      const scale = Math.min(
        MAX_SIZE / frame.w,
        MAX_SIZE / frame.h,
        1
      );

      visual = document.createElement("div");
      visual.className = "sprite";
      visual.style.width = `${frame.w * scale}px`;
      visual.style.height = `${frame.h * scale}px`;

      visual.style.backgroundImage = `url(${ATLAS.meta.image})`;
      visual.style.backgroundRepeat = "no-repeat";

      visual.style.backgroundSize =
        `${ATLAS.meta.size.w * scale}px ${ATLAS.meta.size.h * scale}px`;

      visual.style.backgroundPosition =
        `-${frame.x * scale}px -${frame.y * scale}px`;
    }


    else if (pkg.image) {
      visual = document.createElement("img");
      visual.src = pkg.image;
      visual.alt = pkg.productName;
      visual.className = "image";
    }

    else {
      visual = document.createElement("div");
      visual.textContent = "No image";
    }

    div.appendChild(visual);

    div.insertAdjacentHTML("beforeend", `
      <div class="package-info">
        <div class="title">${pkg.productName} - ${pkg.seller}</div>
        <div class="date">Date Added: ${pkg.dateAdded}</div>
        <div class="weeks">In tracker for ${weeksSince(pkg.dateAdded)} weeks</div>
      </div>
    `);

    container.appendChild(div);
  });
}
