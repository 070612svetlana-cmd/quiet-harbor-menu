(function () {
  const STORAGE_FAV = 'tihaya-harbor-favorites';
  const STORAGE_THEME = 'tihaya-harbor-theme';
  const buttons = document.querySelectorAll('.toolbar-btn');
  const sections = document.querySelectorAll('.menu-section');
  const topBtn = document.getElementById('topBtn');
  const menuSearch = document.getElementById('menuSearch');
  const favBadge = document.getElementById('favBadge');
  const scrollFeaturesBtn = document.getElementById('scrollFeatures');
  const featuresEl = document.getElementById('features');
  const themeToggle = document.getElementById('themeToggle');

  let activeSectionId = 'breakfasts';

  function getFavorites() {
    try {
      const raw = localStorage.getItem(STORAGE_FAV);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function setFavorites(keys) {
    localStorage.setItem(STORAGE_FAV, JSON.stringify(keys));
  }

  function updateFavBadge() {
    const n = getFavorites().length;
    if (!favBadge) return;
    if (n === 0) {
      favBadge.textContent = '';
      favBadge.setAttribute('hidden', '');
    } else {
      favBadge.removeAttribute('hidden');
      favBadge.innerHTML = 'В избранном: <strong>' + n + '</strong>';
    }
  }

  function applyFavState() {
    const favs = new Set(getFavorites());
    document.querySelectorAll('.item-card').forEach(function (card) {
      const key = card.dataset.favKey;
      if (!key) return;
      const on = favs.has(key);
      card.classList.toggle('is-fav', on);
      const btn = card.querySelector('.fav-btn');
      if (btn) {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? 'Убрать из избранного' : 'В избранное');
        btn.textContent = on ? '♥' : '♡';
      }
    });
    updateFavBadge();
  }

  document.querySelectorAll('.menu-section').forEach(function (section) {
    const sid = section.id;
    let idx = 0;
    section.querySelectorAll('.item-card').forEach(function (card) {
      card.dataset.favKey = sid + '::' + idx++;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fav-btn';
      btn.textContent = '♡';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'В избранное');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const key = card.dataset.favKey;
        let favs = getFavorites();
        const i = favs.indexOf(key);
        if (i >= 0) favs.splice(i, 1);
        else favs.push(key);
        setFavorites(favs);
        applyFavState();
      });
      card.appendChild(btn);
    });
  });

  applyFavState();

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const targetId = button.dataset.target;
      activeSectionId = targetId;

      buttons.forEach(function (btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      if (menuSearch && menuSearch.value.trim()) {
        menuSearch.value = '';
      }
      exitSearchMode();

      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 110,
          behavior: 'smooth'
        });
      }
    });
  });

  function exitSearchMode() {
    document.body.classList.remove('search-mode');
    sections.forEach(function (section) {
      section.classList.remove('section-empty');
      section.querySelectorAll('.item-card').forEach(function (card) {
        card.classList.remove('search-hidden');
      });
    });
    sections.forEach(function (section) {
      section.classList.toggle('active', section.id === activeSectionId);
    });
  }

  function runSearch(q) {
    const query = q.trim().toLowerCase();
    if (!query) {
      exitSearchMode();
      return;
    }

    document.body.classList.add('search-mode');
    sections.forEach(function (section) {
      section.classList.add('active');
      let any = false;
      section.querySelectorAll('.item-card').forEach(function (card) {
        const name = card.querySelector('.item-name');
        const desc = card.querySelector('.item-desc');
        const price = card.querySelector('.item-price');
        const blob = [name && name.textContent, desc && desc.textContent, price && price.textContent]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const match = blob.indexOf(query) !== -1;
        card.classList.toggle('search-hidden', !match);
        if (match) any = true;
      });
      section.classList.toggle('section-empty', !any);
    });

    const menuEl = document.getElementById('menu');
    if (menuEl) {
      window.scrollTo({ top: menuEl.offsetTop - 8, behavior: 'smooth' });
    }
  }

  if (menuSearch) {
    menuSearch.addEventListener('input', function () {
      runSearch(menuSearch.value);
    });
    menuSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        menuSearch.value = '';
        exitSearchMode();
      }
    });
  }

  if (scrollFeaturesBtn && featuresEl) {
    scrollFeaturesBtn.addEventListener('click', function () {
      featuresEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (topBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        topBtn.style.display = 'block';
      } else {
        topBtn.style.display = 'none';
      }
    });

    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function syncThemeToggle() {
    if (!themeToggle) return;
    var root = document.documentElement;
    var dark = root.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeToggle.textContent = dark ? '☀' : '🌙';
    themeToggle.title = dark ? 'Светлая тема' : 'Тёмная тема';
  }

  if (themeToggle) {
    syncThemeToggle();
    themeToggle.addEventListener('click', function () {
      var root = document.documentElement;
      var dark = root.getAttribute('data-theme') === 'dark';
      if (dark) {
        root.removeAttribute('data-theme');
        try {
          localStorage.removeItem(STORAGE_THEME);
        } catch (e) {}
      } else {
        root.setAttribute('data-theme', 'dark');
        try {
          localStorage.setItem(STORAGE_THEME, 'dark');
        } catch (e) {}
      }
      syncThemeToggle();
    });
  }
})();
