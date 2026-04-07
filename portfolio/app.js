const COPY_PATHS = {
  en: './content/portfolio-en.json',
  ko: './content/portfolio-ko.json'
};

const UI_COPY = {
  en: {
    nav: {
      about: 'About',
      projects: 'Paper & Project',
      experience: 'Experience',
      education: 'Education',
      awards: 'Awards',
      patents: 'Patents',
      skills: 'Skills'
    },
    educationTitle: 'Education',
    langAria: 'View in Korean',
    title: 'Yongdeuk Seo | Portfolio',
    loadError: 'Failed to load portfolio content.'
  },
  ko: {
    nav: {
      about: '소개',
      projects: '논문 & 프로젝트',
      experience: '경력',
      education: '학력',
      awards: '수상',
      patents: '특허',
      skills: '기술'
    },
    educationTitle: '학력',
    langAria: '영어로 보기',
    title: '서용득 | Portfolio',
    loadError: '포트폴리오 내용을 불러오지 못했습니다.'
  }
};

const cache = {};
let currentLang = 'en';

const PROJECT_ICON_BY_KIND = {
  paper: '💙',
  submission: '🩵',
  project: '🧩'
};

const langToggle = document.getElementById('lang-toggle');
const heroEyebrowEl = document.getElementById('hero-eyebrow');
const heroTitleEl = document.getElementById('hero-title');
const heroBulletsEl = document.getElementById('hero-bullets');
const heroDetailsEl = document.getElementById('hero-details');
const overviewTitleEl = document.getElementById('overview-title');
const overviewListEl = document.getElementById('overview-list');
const projectsTitleEl = document.getElementById('projects-title');
const projectsLegendEl = document.getElementById('projects-legend');
const projectsListEl = document.getElementById('projects-list');
const experienceTitleEl = document.getElementById('experience-title');
const experienceListEl = document.getElementById('experience-list');
const educationTitleEl = document.getElementById('education-title');
const educationListEl = document.getElementById('education-list');
const awardsTitleEl = document.getElementById('awards-title');
const awardsListEl = document.getElementById('awards-list');
const patentsTitleEl = document.getElementById('patents-title');
const patentsListEl = document.getElementById('patents-list');
const skillsTitleEl = document.getElementById('skills-title');
const skillGroupsEl = document.getElementById('skill-groups');
const footerTextEl = document.getElementById('footer-text');
const profilePhotoButton = document.getElementById('profile-photo-button');
const thumbsPopEl = profilePhotoButton ? profilePhotoButton.querySelector('.thumbs-pop') : null;

function setText(element, text = '') {
  if (!element) return;
  element.textContent = text ?? '';
}

function renderList(container, items = []) {
  if (!container) return;
  container.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = item;
    container.appendChild(li);
  });
}

function renderEntries(container, items = [], options = {}) {
  if (!container) return;
  container.innerHTML = '';

  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'entry';

    const dateEl = document.createElement('span');
    dateEl.className = 'entry-date';
    dateEl.textContent = item.date || '';
    article.appendChild(dateEl);

    const textEl = document.createElement('p');
    textEl.className = 'entry-text';
    const textValue = options.stripStrong
      ? (item.text || '').replace(/<\/?strong>/g, '')
      : (item.text || '');
    textEl.innerHTML = textValue;

    const links = getEntryLinks(item);
    links.forEach((link) => {
      textEl.appendChild(document.createTextNode(' '));
      const linkEl = document.createElement('a');
      linkEl.className = 'entry-link';
      linkEl.href = link.href;
      linkEl.target = '_blank';
      linkEl.rel = 'noreferrer noopener';
      linkEl.textContent = `[${link.label || 'Link'}]`;
      textEl.appendChild(linkEl);
    });

    article.appendChild(textEl);
    container.appendChild(article);
  });
}

function getEntryLinks(item) {
  if (Array.isArray(item?.links)) {
    return item.links.filter((link) => link?.href);
  }
  return item?.link?.href ? [item.link] : [];
}

function normalizeProjectText(item) {
  const rawText = item?.text || '';
  const fallbackIcon = item?.icon || PROJECT_ICON_BY_KIND[item?.kind] || '';
  if (!fallbackIcon || rawText.trim().startsWith(fallbackIcon)) {
    return rawText;
  }
  return `${fallbackIcon} ${rawText}`.trim();
}

function localizePatentMeta(metaText) {
  const rawMeta = metaText || '';
  if (currentLang === 'ko') {
    return rawMeta
      .replace(/Application No\./g, '출원번호')
      .replace(/Publication No\./g, '공개번호');
  }
  return rawMeta
    .replace(/출원번호/g, 'Application No.')
    .replace(/공개번호/g, 'Publication No.');
}

function normalizePatentEntry(item) {
  if (!item) {
    return { title: '', meta: '' };
  }

  if (item.title || item.meta) {
    return {
      title: item.title || '',
      meta: localizePatentMeta(item.meta || '')
    };
  }

  const lines = (item.text || '')
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { title: '', meta: '' };
  }

  const titleLines = lines.slice(0, Math.min(2, lines.length));
  const koTitle = titleLines.find((line) => /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(line)) || titleLines[0] || '';
  const enTitle = titleLines.find((line) => !/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(line)) || titleLines[1] || '';
  const title = enTitle && enTitle !== koTitle ? `${koTitle} (${enTitle})` : koTitle;
  const meta = localizePatentMeta(lines.slice(2).join(' / '));

  return { title, meta };
}

function renderProjectLegend(legendItems = []) {
  if (!projectsLegendEl) return;
  projectsLegendEl.innerHTML = '';

  legendItems.forEach((item) => {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'project-legend-badge';

    const iconEl = document.createElement('span');
    iconEl.className = 'project-legend-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = item.icon || '';

    const labelEl = document.createElement('span');
    labelEl.textContent = item.label || '';

    badgeEl.appendChild(iconEl);
    badgeEl.appendChild(labelEl);
    projectsLegendEl.appendChild(badgeEl);
  });
}

function renderProjectEntries(container, items = []) {
  if (!container) return;
  container.innerHTML = '';

  items.forEach((item) => {
    const articleEl = document.createElement('article');
    articleEl.className = 'entry project-entry';

    const dateEl = document.createElement('span');
    dateEl.className = 'entry-date';
    dateEl.textContent = item.date || '';
    articleEl.appendChild(dateEl);

    const titleRowEl = document.createElement('p');
    titleRowEl.className = 'entry-text project-title-row';

    const titleEl = document.createElement('span');
    titleEl.className = 'project-title-text';
    titleEl.innerHTML = normalizeProjectText(item);
    titleRowEl.appendChild(titleEl);

    getEntryLinks(item).forEach((link) => {
      titleRowEl.appendChild(document.createTextNode(' '));
      const linkEl = document.createElement('a');
      linkEl.className = 'entry-link';
      linkEl.href = link.href;
      linkEl.target = '_blank';
      linkEl.rel = 'noreferrer noopener';
      linkEl.textContent = `[${link.label || 'Link'}]`;
      titleRowEl.appendChild(linkEl);
    });

    articleEl.appendChild(titleRowEl);

    const metaText = [item.authors, item.venue].filter(Boolean).join(' ');
    if (metaText) {
      const metaEl = document.createElement('p');
      metaEl.className = 'project-meta';
      metaEl.innerHTML = metaText;
      articleEl.appendChild(metaEl);
    }

    container.appendChild(articleEl);
  });
}

function renderPatentEntries(container, items = []) {
  if (!container) return;
  container.innerHTML = '';

  items.forEach((item) => {
    const articleEl = document.createElement('article');
    articleEl.className = 'entry patent-entry';

    const dateEl = document.createElement('span');
    dateEl.className = 'entry-date';
    dateEl.textContent = item.date || '';
    articleEl.appendChild(dateEl);

    const titleEl = document.createElement('p');
    titleEl.className = 'patent-line entry-text';
    const normalizedPatent = normalizePatentEntry(item);
    titleEl.innerHTML = normalizedPatent.title;
    articleEl.appendChild(titleEl);

    if (normalizedPatent.meta) {
      const metaEl = document.createElement('p');
      metaEl.className = 'patent-line patent-meta';
      metaEl.innerHTML = normalizedPatent.meta;
      articleEl.appendChild(metaEl);
    }

    container.appendChild(articleEl);
  });
}

function renderSkills(groups = []) {
  if (!skillGroupsEl) return;
  skillGroupsEl.innerHTML = '';

  groups.forEach((group) => {
    const section = document.createElement('section');

    const titleEl = document.createElement('h3');
    titleEl.className = 'skill-group-title';
    titleEl.textContent = group.title || '';
    section.appendChild(titleEl);

    const tagListEl = document.createElement('div');
    tagListEl.className = 'tag-list';

    (group.tags || []).forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = group.style === 'secondary'
        ? 'skill-tag skill-tag-secondary'
        : 'skill-tag';
      tagEl.textContent = tag;
      tagListEl.appendChild(tagEl);
    });

    section.appendChild(tagListEl);
    skillGroupsEl.appendChild(section);
  });
}

function updateNavigation(lang) {
  const navCopy = UI_COPY[lang].nav;
  Object.entries(navCopy).forEach(([key, label]) => {
    const linkEl = document.querySelector(`[data-nav-key="${key}"]`);
    if (linkEl) {
      linkEl.textContent = label;
    }
  });
}

function getSectionTitle(lang, fallbackTitle, navTitle) {
  if (lang === 'ko') {
    return navTitle || fallbackTitle || '';
  }
  return fallbackTitle || navTitle || '';
}

async function loadPortfolioCopy(lang) {
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
  const uiCopy = UI_COPY[currentLang];
  const cards = copy.cards || {};

  document.documentElement.lang = currentLang;
  document.title = uiCopy.title;
  langToggle.dataset.activeLang = currentLang;
  langToggle.setAttribute('aria-label', uiCopy.langAria);
  updateNavigation(currentLang);

  setText(heroEyebrowEl, copy.hero?.eyebrow || copy.bannerTitle || 'Portfolio');
  setText(heroTitleEl, copy.hero?.title || 'Yongdeuk Seo');
  renderList(heroBulletsEl, copy.hero?.bullets || []);
  renderList(heroDetailsEl, copy.hero?.details || []);

  setText(
    overviewTitleEl,
    getSectionTitle(currentLang, copy.overview?.title, uiCopy.nav.about)
  );
  renderList(overviewListEl, copy.overview?.bullets || []);

  setText(
    projectsTitleEl,
    getSectionTitle(currentLang, cards.projects?.title, uiCopy.nav.projects)
  );
  renderProjectLegend(cards.projects?.legend || []);
  renderProjectEntries(projectsListEl, cards.projects?.items || []);

  setText(
    experienceTitleEl,
    getSectionTitle(currentLang, cards.experience?.title, uiCopy.nav.experience)
  );
  renderEntries(experienceListEl, cards.experience?.items || [], { stripStrong: true });

  setText(educationTitleEl, uiCopy.educationTitle);
  renderEntries(educationListEl, cards.education?.items || []);

  setText(
    awardsTitleEl,
    getSectionTitle(currentLang, cards.awards?.title, uiCopy.nav.awards)
  );
  renderEntries(awardsListEl, cards.awards?.items || []);

  setText(
    patentsTitleEl,
    getSectionTitle(currentLang, cards.patents?.title, uiCopy.nav.patents)
  );
  renderPatentEntries(patentsListEl, cards.patents?.items || []);

  setText(
    skillsTitleEl,
    getSectionTitle(currentLang, cards.skills?.title, uiCopy.nav.skills)
  );
  renderSkills(cards.skills?.groups || []);

  const footer = copy.footer || '© %YEAR% Seo Yongdeuk. All rights reserved.';
  setText(footerTextEl, footer.replace('%YEAR%', new Date().getFullYear()));
}

async function setLanguage(lang) {
  try {
    const copy = await loadPortfolioCopy(lang);
    applyCopy(copy);
  } catch (error) {
    setText(heroTitleEl, UI_COPY[lang].loadError);
    console.error(error);
  }
}

langToggle.addEventListener('click', () => {
  setLanguage(currentLang === 'en' ? 'ko' : 'en');
});

if (profilePhotoButton && thumbsPopEl) {
  profilePhotoButton.addEventListener('click', () => {
    thumbsPopEl.classList.remove('is-active');
    void thumbsPopEl.offsetWidth;
    thumbsPopEl.classList.add('is-active');
  });
}

document.querySelectorAll('[data-placeholder-link="true"]').forEach((linkEl) => {
  linkEl.addEventListener('click', (event) => {
    event.preventDefault();
  });
});

setLanguage('en');
