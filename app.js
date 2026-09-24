const form = document.querySelector('#application-form');
const status = document.querySelector('#form-status');
const requiredFields = [...form.querySelectorAll('[required]')];
const photoGallery = document.querySelector('#madrasa-gallery');
const photoSlot = document.querySelector('.madrasa-photo-slot');

fetch('/api/content').then((response) => response.json()).then((content) => {
  Object.entries(content.icons || {}).forEach(([name, value]) => {
    document.querySelector(`[data-icon="${name}"]`)?.replaceChildren(document.createTextNode(value));
  });
  if (photoGallery) renderPhotos(content.photos || []);
  const homeTeachers = document.querySelector('#public-home-teachers');
  if (homeTeachers) {
    const teachers = [...(content.teachers?.hafiz || []), ...(content.teachers?.alim || [])].slice(0, 3);
    homeTeachers.replaceChildren(...teachers.map((teacher) => {
      const article = document.createElement('article'); article.className = 'teacher-card'; article.innerHTML = `<span class="teacher-icon" aria-hidden="true">♙</span><div><h3></h3><p></p></div>`;
      article.querySelector('h3').textContent = teacher.name; article.querySelector('p').textContent = teacher.subject; return article;
    }));
  }
}).catch(() => { if (photoGallery) renderPhotos([]); });

function renderPhotos(photos) {
  photoGallery.replaceChildren();
  photos.forEach((source, index) => {
    const image = document.createElement('img');
    image.src = source;
    image.alt = `Фотография медресе ${index + 1}`;
    photoGallery.append(image);
  });
  photoSlot.classList.toggle('image-unavailable', photos.length === 0);
}

if (photoGallery) fetch('/api/content').then((response) => response.json()).then((content) => renderPhotos(content.photos || [])).catch(() => renderPhotos([]));

const messages = {
  studentName: 'Укажите ФИО ученика.',
  birthDate: 'Укажите дату рождения.',
  guardianName: 'Укажите имя родителя или опекуна.',
  phone: 'Введите номер телефона.',
  program: 'Выберите программу обучения.',
  consent: 'Необходимо согласие на обработку данных.'
};

function validateField(field) {
  const container = field.closest('.field') || field.parentElement;
  const error = document.querySelector(`#${field.id}-error`);
  const empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
  const invalidPhone = field.name === 'phone' && field.value.trim() && field.value.replace(/\D/g, '').length < 7;
  const message = empty ? messages[field.name] : invalidPhone ? 'Введите телефон полностью.' : '';
  field.setAttribute('aria-invalid', String(Boolean(message)));
  container.classList.toggle('invalid', Boolean(message));
  if (error) error.textContent = message;
  return !message;
}

requiredFields.forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('change', () => validateField(field));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  const valid = requiredFields.map(validateField).every(Boolean);
  if (!valid) {
    status.textContent = 'Проверьте поля, отмеченные красным.';
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Отправляем…';
  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Не удалось отправить заявку. Попробуйте позже.');
  } catch (error) {
    status.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = 'Отправить заявку <span aria-hidden="true">→</span>';
    return;
  }
  form.hidden = true;
  const confirmation = document.createElement('div');
  confirmation.className = 'success-message';
  confirmation.setAttribute('role', 'status');
  confirmation.setAttribute('tabindex', '-1');
  confirmation.innerHTML = '<span class="success-icon" aria-hidden="true">✓</span><h3>Заявка принята</h3><p>Благодарим за доверие. Мы свяжемся с вами после рассмотрения заявки.</p><button class="button" type="button">Отправить ещё одну заявку</button>';
  form.parentElement.append(confirmation);
  confirmation.focus();
  confirmation.querySelector('button').addEventListener('click', () => {
    confirmation.remove(); form.reset(); form.hidden = false; document.querySelector('#student-name').focus();
  });
});
