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

function drawScaled(ctx, img, maxW, maxH) {
  const scale = Math.min(
    maxW / img.width,
    maxH / img.height,
    1
  );

  const w = img.width * scale;
  const h = img.height * scale;

  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
}

function openModal(pkg) {
  const modal = document.getElementById("modal");
  const canvas = document.getElementById("modal-canvas");
  const ctx = canvas.getContext("2d");

  modal.classList.remove("hidden");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!pkg.sprite) {
    const img = new Image();
    img.onload = () => {
      drawScaled(
        ctx,
        img,
        window.innerWidth * 0.9,
        window.innerHeight * 0.9
      );
    };


    img.src = pkg.image;
    img.className = "sprite";
    return;
  }

  const frame = ATLAS.frames[pkg.sprite].frame;
  const atlasImg = new Image();

  atlasImg.onload = () => {
    const temp = document.createElement("canvas");
    temp.width = frame.w;
    temp.height = frame.h;

    const tctx = temp.getContext("2d");
    tctx.drawImage(
      atlasImg,
      frame.x, frame.y, frame.w, frame.h,
      0, 0, frame.w, frame.h
    );

    drawScaled(
      ctx,
      temp,
      window.innerWidth * 0.9,
      window.innerHeight * 0.9
    );
  };


  atlasImg.src = ATLAS.meta.image;
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
      visual.onclick = () => openModal(pkg);
    }


    else if (pkg.image) {
      visual = document.createElement("img");
      visual.src = pkg.image;
      visual.alt = pkg.productName;
      visual.className = "image";
      visual.onclick = () => openModal(pkg);
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
  document.getElementById("modal").onclick = e => {
  if (e.target.id === "modal") {
    e.target.classList.add("hidden");
  }
  };
}
