function makeTeacherCard(teacher, icon) { const article = document.createElement('article'); article.className = 'teacher-card'; article.innerHTML = `<span class="teacher-icon" aria-hidden="true">${icon}</span><div><h3>${escapeHtml(teacher.name)}</h3><p>${escapeHtml(teacher.subject)}</p></div>`; return article; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character])); }
fetch('/api/content').then((response) => response.json()).then((content) => {
  Object.entries(content.icons || {}).forEach(([name, value]) => document.querySelector(`[data-icon="${name}"]`)?.replaceChildren(document.createTextNode(value)));
  const gallery = document.querySelector('#about-gallery');
  if (gallery) { const empty = document.querySelector('#about-empty'); (content.photos || []).forEach((source, index) => { const image = document.createElement('img'); image.src = source; image.alt = `Фотография медресе ${index + 1}`; gallery.append(image); }); empty.hidden = content.photos?.length > 0; }
  ['hafiz', 'alim'].forEach((group) => { const target = document.querySelector(`#public-${group}-teachers`); if (target) { target.replaceChildren(...(content.teachers?.[group] || []).map((teacher) => makeTeacherCard(teacher, content.icons?.[group] || '♙'))); } });
  const wall = document.querySelector('#media-wall');
  if (wall) {
    const empty = document.querySelector('#media-empty');
    (content.media || []).forEach((item, index) => {
      const card = document.createElement('article'); card.className = `media-card media-card--${item.type}`;
      const visual = item.type === 'video' ? document.createElement('video') : document.createElement('img');
      visual.src = item.path; visual.controls = item.type === 'video'; visual.preload = 'metadata';
      if (item.type === 'image') { visual.loading = 'lazy'; visual.alt = item.title || `Момент медресе ${index + 1}`; }
      const caption = document.createElement('div'); caption.className = 'media-card__caption';
      caption.innerHTML = `<span>${item.type === 'video' ? '▶ Видео' : '✦ Фотография'}</span><h2>${escapeHtml(item.title || 'Жизнь медресе')}</h2>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}`;
      card.append(visual, caption); wall.append(card);
    });
    empty.hidden = (content.media || []).length > 0;
  }
}).catch(() => {});

if (document.body.classList.contains('home-page')) {
  const links = document.querySelector('.hero-page-links');
  const mediaLink = document.createElement('a');
  mediaLink.className = 'nav-link media-home-link'; mediaLink.href = 'media.html';
  mediaLink.innerHTML = '<span class="nav-icon-round" aria-hidden="true">✦</span> Жизнь медресе';
  links?.prepend(mediaLink);
  document.querySelector('.hero-cta')?.classList.add('hero-cta--quiet');
}
