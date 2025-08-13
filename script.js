// ====== TÌM KIẾM & LỌC ======
const searchInput = document.getElementById('search');
const gallery = document.getElementById('gallery');
const resetFiltersBtn = document.getElementById('resetFilters');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  const cards = gallery.querySelectorAll('.card');
  cards.forEach(card => {
    const text = (card.dataset.label || '') + ' ' + (card.querySelector('figcaption')?.textContent || '');
    card.style.display = text.toLowerCase().includes(q) ? '' : 'none';
  });
});
resetFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
});

// ====== KÉO-THẢ / TẢI ẢNH LÊN ======
const uploader = document.querySelector('.uploader');
const fileInput = document.getElementById('fileInput');

function addImageToGallery(src, label = 'Ảnh của bạn') {
  const fig = document.createElement('figure');
  fig.className = 'card';
  fig.dataset.label = label.toLowerCase();

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = src;
  img.alt = label;

  const cap = document.createElement('figcaption');
  cap.textContent = label;

  fig.appendChild(img);
  fig.appendChild(cap);
  gallery.prepend(fig); // thêm lên đầu
}

uploader.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

['dragenter', 'dragover'].forEach(ev => {
  uploader.addEventListener(ev, e => { e.preventDefault(); uploader.style.background = 'rgba(0,0,0,.03)'; });
});
['dragleave', 'drop'].forEach(ev => {
  uploader.addEventListener(ev, e => { e.preventDefault(); uploader.style.background = ''; });
});
uploader.addEventListener('drop', (e) => {
  handleFiles(e.dataTransfer.files);
});

function handleFiles(fileList) {
  [...fileList].forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => addImageToGallery(reader.result, file.name.replace(/\.[^.]+$/, ''));
    reader.readAsDataURL(file);
  });
}

// ====== LIGHTBOX ======
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

let currentIndex = -1;
function cards() { return [...gallery.querySelectorAll('.card')].filter(c => c.style.display !== 'none'); }

function openLightbox(index) {
  const cs = cards();
  if (!cs.length) return;
  currentIndex = (index + cs.length) % cs.length;
  const card = cs[currentIndex];
  const img = card.querySelector('img');
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  lbCaption.textContent = card.querySelector('figcaption')?.textContent || '';
  lb.classList.add('show');
  lb.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lb.classList.remove('show');
  lb.setAttribute('aria-hidden', 'true');
}
function next() { openLightbox(currentIndex + 1); }
function prev() { openLightbox(currentIndex - 1); }

gallery.addEventListener('click', (e) => {
  const img = e.target.closest('.card img');
  if (!img) return;
  const cs = cards();
  const card = img.closest('.card');
  openLightbox(cs.indexOf(card));
  // đồng thời đưa ảnh vào editor
  loadImageToCanvas(img.src);
});
lbClose.addEventListener('click', closeLightbox);
lbNext.addEventListener('click', next);
lbPrev.addEventListener('click', prev);
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
window.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('show')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
});

// ====== EDITOR (Canvas + Filters) ======
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const controls = {
  grayscale: document.getElementById('grayscale'),
  sepia: document.getElementById('sepia'),
  brightness: document.getElementById('brightness'),
  blur: document.getElementById('blur'),
};
const resetEdits = document.getElementById('resetEdits');
const downloadBtn = document.getElementById('download');

let originalImage = new Image();
let workingImage = new Image();
let naturalW = 800;
let naturalH = 600;

function fitCanvasToImage(img) {
  const maxW = 1200; // giới hạn để không quá to
  const scale = Math.min(1, maxW / img.naturalWidth);
  naturalW = Math.round(img.naturalWidth * scale);
  naturalH = Math.round(img.naturalHeight * scale);
  canvas.width = naturalW;
  canvas.height = naturalH;
}

function currentFilterString() {
  const gs = +controls.grayscale.value;
  const sp = +controls.sepia.value;
  const br = +controls.brightness.value;
  const bl = +controls.blur.value;
  return `grayscale(${gs}%) sepia(${sp}%) brightness(${br}%) blur(${bl}px)`;
}

function render() {
  if (!workingImage.src) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = currentFilterString();
  ctx.drawImage(workingImage, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';
}

function loadImageToCanvas(src) {
  originalImage = new Image();
  originalImage.crossOrigin = 'anonymous'; // cho ảnh demo từ Picsum
  originalImage.onload = () => {
    fitCanvasToImage(originalImage);
    workingImage = originalImage;
    resetSliders();
    render();
  };
  originalImage.src = src;
}

function resetSliders() {
  controls.grayscale.value = 0;
  controls.sepia.value = 0;
  controls.brightness.value = 100;
  controls.blur.value = 0;
}

Object.values(controls).forEach(input => input.addEventListener('input', render));

resetEdits.addEventListener('click', () => {
  resetSliders();
  render();
});

downloadBtn.addEventListener('click', () => {
  if (!workingImage.src) return;
  // Kết xuất với filter hiện tại
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'anh-da-chinh.png';
  a.click();
});

// Nếu muốn tự động load ảnh đầu tiên vào editor
window.addEventListener('DOMContentLoaded', () => {
  const firstImg = gallery.querySelector('.card img');
  if (firstImg) loadImageToCanvas(firstImg.src);
});
