const root = document.documentElement;

const requestedLang = new URLSearchParams(location.search).get('lang');
const activeLang = window.I18N.apply(window.I18N.resolveLang(requestedLang));

const themeButton = document.querySelector('#theme-toggle');
const menuButton = document.querySelector('#menu-toggle');
const backdrop = document.querySelector('#sidebar-backdrop');
const tocLinks = [...document.querySelectorAll('.toc a')];
const lightbox = document.querySelector('#lightbox');
const langLinks = [...document.querySelectorAll('.lang-switcher a[data-lang]')];

const savedTheme = localStorage.getItem('manual-theme');
const preferredTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
root.dataset.theme = savedTheme || preferredTheme;

function updateThemeLabel() {
  const isDark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', window.I18N.t(isDark ? 'theme.ariaLabelToLight' : 'theme.ariaLabelToDark'));
}

updateThemeLabel();

themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('manual-theme', root.dataset.theme);
  updateThemeLabel();
});

function closeMenu() {
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

backdrop.addEventListener('click', closeMenu);
tocLinks.forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

function refreshLangSwitcher() {
  langLinks.forEach((link) => {
    const code = link.dataset.lang;
    link.href = `?lang=${code}${location.hash}`;
    const isActive = code === activeLang;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

refreshLangSwitcher();
window.addEventListener('hashchange', refreshLangSwitcher);

const sections = tocLinks
  .map((link) => document.querySelector(link.hash))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;
  tocLinks.forEach((link) => {
    const isActive = link.hash === `#${visible.target.id}`;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.2, 0.5] });

sections.forEach((section) => sectionObserver.observe(section));

document.querySelectorAll('figure img').forEach((image) => {
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `${image.alt}${window.I18N.t('lightbox.zoomHintSuffix')}`);

  const openImage = () => {
    lightbox.querySelector('img').src = image.currentSrc || image.src;
    lightbox.querySelector('img').alt = image.alt;
    lightbox.querySelector('p').textContent = image.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
    lightbox.showModal();
  };

  image.addEventListener('click', openImage);
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openImage();
    }
  });
});

lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
