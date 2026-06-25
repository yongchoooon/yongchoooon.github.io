const COPY_PATH = './content/papers-en.json';

const UI_COPY = {
  topbarNav: {
    home: 'Home',
    papers: 'Paper & Project'
  },
  loadError: 'Failed to load paper and project content.'
};

const KIND_ICON_BY_TYPE = {
  paper: '💙',
  submission: '🩵',
  project: '🧩'
};

let cachedCopy = null;

const detailEyebrowEl = document.getElementById('detail-eyebrow');
const detailTitleEl = document.getElementById('detail-title');
const detailLegendEl = document.getElementById('detail-legend');
const detailSectionsEl = document.getElementById('detail-sections');
const footerTextEl = document.getElementById('footer-text');
const imageLightboxEl = document.getElementById('image-lightbox');
const imageLightboxBackdropEl = document.getElementById('image-lightbox-backdrop');
const imageLightboxDialogEl = document.querySelector('.image-lightbox-dialog');
const imageLightboxDismissEl = document.getElementById('image-lightbox-dismiss');
const imageLightboxImageEl = document.getElementById('image-lightbox-image');

function setText(element, text = '') {
  if (!element) return;
  element.textContent = text ?? '';
}

function updateTopNavigation() {
  const navCopy = UI_COPY.topbarNav || {};
  Object.entries(navCopy).forEach(([key, label]) => {
    const linkEl = document.querySelector(`[data-topnav-key="${key}"]`);
    if (linkEl) {
      linkEl.textContent = label;
    }
  });
}

function renderLegend(items = []) {
  if (!detailLegendEl) return;
  detailLegendEl.innerHTML = '';

  items.forEach((item) => {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'detail-legend-badge';
    badgeEl.textContent = `${item.icon || ''} ${item.label || ''}`.trim();
    detailLegendEl.appendChild(badgeEl);
  });
}

function openImageLightbox(src, alt = '') {
  if (!imageLightboxEl || !imageLightboxImageEl) return;
  imageLightboxImageEl.src = src;
  imageLightboxImageEl.alt = alt;
  imageLightboxEl.hidden = false;
  requestAnimationFrame(() => {
    imageLightboxEl.classList.add('is-visible');
  });
  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  if (!imageLightboxEl || !imageLightboxImageEl) return;
  imageLightboxEl.classList.remove('is-visible');
  window.setTimeout(() => {
    imageLightboxEl.hidden = true;
    imageLightboxImageEl.removeAttribute('src');
    imageLightboxImageEl.alt = '';
    document.body.style.overflow = '';
  }, 220);
}

function renderLinks(links = []) {
  const wrapperEl = document.createElement('p');
  wrapperEl.className = 'detail-links';

  links.forEach((link, index) => {
    if (index > 0) {
      const separatorEl = document.createElement('span');
      separatorEl.textContent = '/';
      wrapperEl.appendChild(separatorEl);
    }

    const linkEl = document.createElement('a');
    linkEl.href = link.href;
    linkEl.target = '_blank';
    linkEl.rel = 'noreferrer noopener';
    linkEl.textContent = link.label || 'Link';
    wrapperEl.appendChild(linkEl);
  });

  return wrapperEl;
}

function normalizeDetailTitle(item) {
  const rawTitle = item.title || '';
  const icon = item.icon || KIND_ICON_BY_TYPE[item.kind] || '';
  if (!icon || rawTitle.trim().startsWith(icon)) {
    return rawTitle;
  }
  return `${icon}&nbsp;&nbsp;${rawTitle}`;
}

function getMediaImages(item) {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images
      .map((image) => (typeof image === 'string' ? { src: image } : image))
      .filter((image) => image?.src);
  }

  return item.image ? [{ src: item.image, alt: item.imageAlt || '' }] : [];
}

function renderImageMedia(item, mediaEl) {
  const images = getMediaImages(item);
  let activeIndex = 0;

  const frameEl = document.createElement('div');
  frameEl.className = 'detail-media-frame';

  const mediaTriggerEl = document.createElement('button');
  mediaTriggerEl.className = 'detail-media-trigger';
  mediaTriggerEl.type = 'button';

  if (item.carousel && images.length > 1) {
    frameEl.classList.add('detail-media-frame--carousel');
    if (item.mediaAspectRatio) {
      frameEl.style.setProperty('--media-aspect-ratio', item.mediaAspectRatio);
    }

    const trackEl = document.createElement('span');
    trackEl.className = 'detail-media-track';

    images.forEach((image, index) => {
      const slideEl = document.createElement('span');
      slideEl.className = index === 0
        ? 'detail-media-slide detail-media-slide--first'
        : 'detail-media-slide detail-media-slide--contain';
      slideEl.style.backgroundImage = `url("${image.src}")`;
      slideEl.dataset.src = image.src;
      slideEl.dataset.alt = image.alt || item.imageAlt || '';
      trackEl.appendChild(slideEl);
    });

    mediaTriggerEl.appendChild(trackEl);

    const navButtonEl = document.createElement('button');
    navButtonEl.className = 'detail-media-nav detail-media-nav--next';
    navButtonEl.type = 'button';

    function updateCarousel(index) {
      activeIndex = index === 0 ? 0 : 1;
      const activeImage = images[activeIndex];
      trackEl.style.transform = `translateX(-${activeIndex * 100}%)`;
      frameEl.dataset.activeIndex = String(activeIndex);
      mediaTriggerEl.setAttribute('aria-label', `${activeImage.alt || item.imageAlt || 'Image'} preview`);
      navButtonEl.className = activeIndex === 0
        ? 'detail-media-nav detail-media-nav--next'
        : 'detail-media-nav detail-media-nav--prev';
      navButtonEl.setAttribute('aria-label', activeIndex === 0 ? 'Show next image' : 'Show previous image');
      navButtonEl.innerHTML = activeIndex === 0
        ? '<span aria-hidden="true">›</span>'
        : '<span aria-hidden="true">‹</span>';
    }

    mediaTriggerEl.addEventListener('click', () => {
      const activeSlideEl = trackEl.children[activeIndex];
      openImageLightbox(activeSlideEl.dataset.src || '', activeSlideEl.dataset.alt || '');
    });

    navButtonEl.addEventListener('click', (event) => {
      event.stopPropagation();
      updateCarousel(activeIndex === 0 ? 1 : 0);
    });

    frameEl.appendChild(mediaTriggerEl);
    frameEl.appendChild(navButtonEl);
    updateCarousel(0);
    mediaEl.appendChild(frameEl);
    return;
  }

  const imageEl = document.createElement('img');
  imageEl.loading = 'lazy';
  mediaTriggerEl.appendChild(imageEl);

  function showImage(index) {
    activeIndex = (index + images.length) % images.length;
    const activeImage = images[activeIndex];
    imageEl.src = activeImage.src;
    imageEl.alt = activeImage.alt || item.imageAlt || '';
    mediaTriggerEl.setAttribute('aria-label', `${imageEl.alt || 'Image'} preview`);
  }

  mediaTriggerEl.addEventListener('click', () => {
    openImageLightbox(imageEl.currentSrc || imageEl.src, imageEl.alt);
  });

  frameEl.appendChild(mediaTriggerEl);

  if (images.length > 1) {
    const nextButtonEl = document.createElement('button');
    nextButtonEl.className = 'detail-media-next';
    nextButtonEl.type = 'button';
    nextButtonEl.setAttribute('aria-label', 'Show next image');
    nextButtonEl.innerHTML = '<span aria-hidden="true">›</span>';
    nextButtonEl.addEventListener('click', (event) => {
      event.stopPropagation();
      showImage(activeIndex + 1);
    });
    frameEl.appendChild(nextButtonEl);
  }

  showImage(0);
  mediaEl.appendChild(frameEl);
}

function renderSections(sections = []) {
  if (!detailSectionsEl) return;
  detailSectionsEl.innerHTML = '';

  sections.forEach((section) => {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'detail-section';

    const headerEl = document.createElement('div');
    headerEl.className = 'detail-section-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'detail-section-title';
    titleEl.textContent = section.title || '';
    headerEl.appendChild(titleEl);

    if (section.description) {
      const copyEl = document.createElement('p');
      copyEl.className = 'detail-section-copy';
      copyEl.textContent = section.description;
      headerEl.appendChild(copyEl);
    }

    sectionEl.appendChild(headerEl);

    const listEl = document.createElement('div');
    listEl.className = 'detail-list';

    (section.items || []).forEach((item) => {
      const entryEl = document.createElement('article');
      entryEl.className = 'detail-entry';

      if (item.image || item.images || item.video) {
        const mediaEl = document.createElement('figure');
        mediaEl.className = 'detail-media';
        if (item.video) {
          const videoEl = document.createElement('video');
          videoEl.controls = true;
          videoEl.playsInline = true;
          videoEl.preload = 'metadata';
          videoEl.className = 'detail-media-video';
          videoEl.volume = 0.5;
          videoEl.addEventListener('loadedmetadata', () => {
            videoEl.volume = 0.5;
          });

          const sourceEl = document.createElement('source');
          sourceEl.src = item.video;
          sourceEl.type = 'video/mp4';
          videoEl.appendChild(sourceEl);

          mediaEl.appendChild(videoEl);
        } else {
          renderImageMedia(item, mediaEl);
        }
        entryEl.appendChild(mediaEl);
      } else {
        entryEl.classList.add('detail-entry--no-media');
      }

      const copyEl = document.createElement('div');
      copyEl.className = 'detail-copy';

      const entryTitleEl = document.createElement('h3');
      entryTitleEl.className = 'detail-entry-title';
      entryTitleEl.innerHTML = normalizeDetailTitle(item);
      copyEl.appendChild(entryTitleEl);

      if (item.meta) {
        const metaEl = document.createElement('p');
        metaEl.className = 'detail-meta';
        metaEl.innerHTML = item.meta;
        copyEl.appendChild(metaEl);
      }

      if (Array.isArray(item.links) && item.links.length > 0) {
        copyEl.appendChild(renderLinks(item.links));
      }

      if (item.summary) {
        const summaryEl = document.createElement('p');
        summaryEl.className = 'detail-summary';
        summaryEl.textContent = item.summary;
        copyEl.appendChild(summaryEl);
      }

      entryEl.appendChild(copyEl);
      listEl.appendChild(entryEl);
    });

    sectionEl.appendChild(listEl);
    detailSectionsEl.appendChild(sectionEl);
  });
}

async function loadCopy() {
  if (cachedCopy) {
    return cachedCopy;
  }

  const response = await fetch(COPY_PATH);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${COPY_PATH}`);
  }

  const data = await response.json();
  cachedCopy = data;
  return data;
}

function applyCopy(copy) {
  document.documentElement.lang = 'en';
  document.title = copy.meta?.title || 'Yongdeuk Seo | Paper & Project';
  updateTopNavigation();

  setText(detailEyebrowEl, copy.hero?.eyebrow || '');
  setText(detailTitleEl, copy.hero?.title || '');
  renderLegend(copy.hero?.legend || []);
  renderSections(copy.sections || []);

  const footer = copy.footer || '© %YEAR% Seo Yongdeuk. All rights reserved.';
  setText(footerTextEl, footer.replace('%YEAR%', new Date().getFullYear()));
}

async function initializePapers() {
  try {
    const copy = await loadCopy();
    applyCopy(copy);
  } catch (error) {
    setText(detailTitleEl, UI_COPY.loadError);
    console.error(error);
  }
}

if (imageLightboxBackdropEl) {
  imageLightboxBackdropEl.addEventListener('click', closeImageLightbox);
}

if (imageLightboxDialogEl) {
  imageLightboxDialogEl.addEventListener('click', (event) => {
    if (event.target === imageLightboxDialogEl) {
      closeImageLightbox();
    }
  });
}

if (imageLightboxDismissEl) {
  imageLightboxDismissEl.addEventListener('click', closeImageLightbox);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && imageLightboxEl && !imageLightboxEl.hidden) {
    closeImageLightbox();
  }
});

initializePapers();
