/* Shared book-tab navigation: it stays in the same place on every public page. */
const pages = [
  { href: 'index.html', label: 'Главная', icon: '⌂' },
  { href: 'about.html', label: 'О медресе', icon: '☾' },
  { href: 'teachers.html', label: 'Устазы', icon: '✦' },
  { href: 'curriculum.html', label: 'Учебный план', icon: '⌘' },
  { href: 'media.html', label: 'Жизнь медресе', icon: '◈' },
  { href: 'apply.html', label: 'Подать заявку', icon: '✎' }
];
const current = location.pathname.split('/').pop() || 'index.html';
const navigation = document.createElement('nav');
navigation.className = 'book-tabs';
navigation.setAttribute('aria-label', 'Разделы сайта');
navigation.innerHTML = `<div class="book-tabs__inner">${pages.map((page) => `<a href="${page.href}" class="${page.href === current ? 'is-active' : ''}"><span aria-hidden="true">${page.icon}</span>${page.label}</a>`).join('')}</div>`;
document.body.prepend(navigation);
