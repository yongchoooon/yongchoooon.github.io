const COPY_PATHS = {
  en: './content/papers-en.json',
  ko: './content/papers-ko.json'
};

const LANG_STORAGE_KEY = 'portfolio-language';

const UI_COPY = {
  en: {
    topbarNav: {
      home: 'Home',
      papers: 'Paper & Project'
    },
    langAria: 'View in Korean',
    loadError: 'Failed to load paper and project content.'
  },
  ko: {
    topbarNav: {
      home: '홈',
      papers: '논문 & 프로젝트'
    },
    langAria: '영어로 보기',
    loadError: '논문 및 프로젝트 내용을 불러오지 못했습니다.'
  }
};

const KIND_ICON_BY_TYPE = {
  paper: '💙',
  submission: '🩵',
  project: '🧩'
};

const cache = {};
let currentLang = 'en';

const langToggle = document.getElementById('lang-toggle');
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

function getStoredLanguage() {
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY) === 'ko' ? 'ko' : 'en';
  } catch (_error) {
    return 'en';
  }
}

function persistLanguage(lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang === 'ko' ? 'ko' : 'en');
  } catch (_error) {
    // Ignore storage failures and keep the current in-memory state.
  }
}

function setText(element, text = '') {
  if (!element) return;
  element.textContent = text ?? '';
}

function updateTopNavigation(lang) {
  const navCopy = UI_COPY[lang].topbarNav || {};
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

      if (item.image || item.video) {
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
          const imageEl = document.createElement('img');
          imageEl.src = item.image;
          imageEl.alt = item.imageAlt || '';
          imageEl.loading = 'lazy';

          const mediaTriggerEl = document.createElement('button');
          mediaTriggerEl.className = 'detail-media-trigger';
          mediaTriggerEl.type = 'button';
          mediaTriggerEl.setAttribute('aria-label', `${imageEl.alt || 'Image'} preview`);
          mediaTriggerEl.appendChild(imageEl);
          mediaTriggerEl.addEventListener('click', () => {
            openImageLightbox(imageEl.currentSrc || imageEl.src, imageEl.alt);
          });

          mediaEl.appendChild(mediaTriggerEl);
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

async function loadCopy(lang) {
  if (cache[lang]) {
    return cache[lang];
  }

  const response = await fetch(COPY_PATHS[lang]);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${COPY_PATHS[lang]}`);
  }

  const data = await response.json();
  cache[lang] = data;
  return data;
}

function applyCopy(copy) {
  currentLang = copy.lang === 'ko' ? 'ko' : 'en';
  persistLanguage(currentLang);
  const uiCopy = UI_COPY[currentLang];

  document.documentElement.lang = currentLang;
  document.title = copy.meta?.title || 'Yongdeuk Seo | Paper & Project';
  langToggle.dataset.activeLang = currentLang;
  langToggle.setAttribute('aria-label', uiCopy.langAria);
  updateTopNavigation(currentLang);

  setText(detailEyebrowEl, copy.hero?.eyebrow || '');
  setText(detailTitleEl, copy.hero?.title || '');
  renderLegend(copy.hero?.legend || []);
  renderSections(copy.sections || []);

  const footer = copy.footer || '© %YEAR% Seo Yongdeuk. All rights reserved.';
  setText(footerTextEl, footer.replace('%YEAR%', new Date().getFullYear()));
}

async function setLanguage(lang) {
  try {
    const copy = await loadCopy(lang);
    applyCopy(copy);
  } catch (error) {
    setText(detailTitleEl, UI_COPY[lang].loadError);
    console.error(error);
  }
}

langToggle.addEventListener('click', () => {
  setLanguage(currentLang === 'en' ? 'ko' : 'en');
});

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

setLanguage(getStoredLanguage());
