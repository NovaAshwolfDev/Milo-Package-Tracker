
async function loadPackages() {
  const res = await fetch("https://api.miloashwolf.gay/v1/packages");
  const data = await res.json();
  return data;
}

Promise.all([
  loadPackages(),
  fetch("./images/atlas.json").then(r => r.json())
]).then(([packages, atlas]) => {
  window.ATLAS = atlas;
  renderPackages(packages);
});
function getStatus(pkg) {
  if (!pkg.status) return null;
  switch (pkg.status.toLowerCase()) {
    case "confirmed":
      return { text: "Confirmed", color: "blue", icon: "check-check" };
    case "delivered":
      return { text: "Delivered!", color: "green", icon: "check-check" };
    case "shipped":
      return { text: "Shipped", color: "orange", icon: "check" };
    case "warehouse":
      return { text: "In Warehouse", color: "blue", icon: "info" };
    default:
      return { text: pkg.status, color: "gray", icon: "circle-question-mark" };
  }
}

function weeksSince(dateString) {
  const added = new Date(dateString);
  const now = new Date();
  return Math.floor((now - added) / (1000 * 60 * 60 * 24 * 7));
}

function timeSince(dateString) {
  const added = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now - added) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""}`;
  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  return `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""}`;
}

function shippingCountdown(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
  const diffHours = Math.round((target - now) / (1000 * 60 * 60));
  if (diffDays === 0 || diffHours === 0) return { text: "Shipped today", type: "info" };
  if (diffDays > 0) {
    if (diffDays >= 7) {
      const weeks = Math.ceil(diffDays / 7);
      return { text: `Ships in ${weeks} week${weeks !== 1 ? "s" : ""}`, type: "info" };
    }
    return { text: `Ships in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, type: "info" };
  }
  return { text: `Shipped ${timeSince(dateString)} ago`, type: "alert" };
}

function arrivalCountdown(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { text: "Arriving today", type: "check" };
  if (diffDays > 0) {
    if (diffDays >= 7) {
      const weeks = Math.ceil(diffDays / 7);
      return { text: `Arriving in ${weeks} week${weeks !== 1 ? "s" : ""}`, type: "info" };
    }
    return { text: `Arrives in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, type: "info" };
  }
  const overdue = Math.abs(diffDays);
  return { text: `Overdue by ${overdue} day${overdue !== 1 ? "s" : ""}`, type: "alert" };
}

function drawScaled(ctx, img, maxW, maxH) {
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
}

function extractFrameToCanvas(atlasImg, frame, rotated) {
  if (!rotated) {
    const c = document.createElement("canvas");
    c.width = frame.w;
    c.height = frame.h;
    c.getContext("2d").drawImage(
      atlasImg,
      frame.x, frame.y, frame.w, frame.h,
      0, 0, frame.w, frame.h
    );
    return c;
  }
  const c = document.createElement("canvas");
  c.width = frame.h;
  c.height = frame.w;
  const ctx = c.getContext("2d");
  ctx.translate(0, c.height);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(
    atlasImg,
    frame.x, frame.y, frame.w, frame.h,
    0, 0, frame.w, frame.h
  );
  return c;
}

function openModal(pkg) {
  const modal = document.getElementById("modal");
  const canvas = document.getElementById("modal-canvas");
  const ctx = canvas.getContext("2d");
  modal.classList.remove("hidden");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!pkg.sprite) {
    const img = new Image();
    img.onload = () => drawScaled(ctx, img, window.innerWidth * 0.9, window.innerHeight * 0.9);
    img.src = pkg.image;
    return;
  }
  const frameObj = ATLAS.frames[pkg.sprite];
  const atlasImg = new Image();
  atlasImg.onload = () => {
    const extracted = extractFrameToCanvas(atlasImg, frameObj.frame, frameObj.rotated);
    drawScaled(ctx, extracted, window.innerWidth * 0.9, window.innerHeight * 0.9);
  };
  atlasImg.src = ATLAS.meta.image;
}

function renderPackages(packages) {
  const container = document.getElementById("package-list");
  container.innerHTML = "";
  packages.forEach(pkg => {
    const div = document.createElement("div");
    div.className = "package";
    const status = getStatus(pkg);
    if (pkg.color) div.style.setProperty("--accent", pkg.color);
    let visual;
    
    if (pkg.sprite && window.ATLAS) {
      visual = document.createElement("img");
      visual.className = "image";
      visual.style.width = "140px";
      visual.style.height = "140px";
      visual.style.objectFit = "contain";
      visual.style.borderRadius = "16px";
      // visual.style.border = "3px solid var(--milo-yellow)";
      visual.style.background = "#fff";
      visual.style.transition = "transform 0.2s";
      
      const frameObj = ATLAS.frames[pkg.sprite];
      const atlasImg = new Image();
      atlasImg.onload = () => {
        const extracted = extractFrameToCanvas(atlasImg, frameObj.frame, frameObj.rotated);
        const maxSize = 140;
        const scale = Math.min(maxSize / extracted.width, maxSize / extracted.height, 1);
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = extracted.width * scale;
        finalCanvas.height = extracted.height * scale;
        const ctx = finalCanvas.getContext("2d");
        ctx.drawImage(extracted, 0, 0, finalCanvas.width, finalCanvas.height);
        visual.src = finalCanvas.toDataURL();
      };
      atlasImg.src = ATLAS.meta.image;
      visual.onclick = () => openModal(pkg);
    } 
    
    else if (pkg.image) {
      visual = document.createElement("img");
      visual.src = pkg.image;
      visual.alt = pkg.productName;
      visual.className = "image";
      visual.onclick = () => openModal(pkg);
    } else {
      visual = document.createElement("div");
      visual.textContent = "No image";
    }
    div.appendChild(visual);
    div.insertAdjacentHTML("beforeend", `
      <div class="package-info">
        <div class="title">${pkg.productName} - ${pkg.seller}</div>
        <div class="date">Date Added: ${pkg.dateAdded}</div>
        ${status ? `<div class="weeks status" style="--status-color:${status.color}"><i data-lucide="${status.icon}"></i><span>${status.text.charAt(0).toUpperCase() + status.text.slice(1)}</span></div>` : `<div class="weeks"><span>In tracker for ${weeksSince(pkg.dateAdded)} weeks</span></div>`}
        ${pkg.officialFuralityMerch ? `
          <div class="official-merch">
            <img src="./images/furality-logo.svg" width="24" height="24" alt="Furality">
          </div>
        ` : ""}
        ${pkg.expectedShipDate && pkg.expectedShipDate !== "null" ? (() => {
          if (pkg.expectedShipDate.toLowerCase() === "soon") {
            return `<div class="weeks expected info"><i data-lucide="info"></i><span>Shipping soon</span></div>`;
          }
          const c = shippingCountdown(pkg.expectedShipDate);
          return `<div class="weeks expected ${c.type}"><i data-lucide="${c.type === "alert" ? "alert-triangle" : "info"}"></i><span>${c.text}</span></div>`;
        })() : ""}
        
        ${pkg.expectedArrival && pkg.expectedArrival !== "null" ? (() => {
          const c = arrivalCountdown(pkg.expectedArrival);
          return `<div class="weeks expected ${c.type}"><i data-lucide="${c.type === "alert" ? "alert-triangle" : "info"}"></i><span>${c.text}</span></div>`;
        })() : ""}
      </div>
    `);
    
    if (status?.text === "Delivered!") {
      const badge = div.querySelector(".weeks.status");
      if (badge) badge.textContent = "Delivered!";
    }
    container.appendChild(div);
  });
  document.getElementById("modal").onclick = e => {
    if (e.target.id === "modal") e.target.classList.add("hidden");
  };
  lucide.createIcons();
}