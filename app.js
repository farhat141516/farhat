const form = document.querySelector('#application-form');
const status = document.querySelector('#form-status');
const requiredFields = [...form.querySelectorAll('[required]')];
const madrasaPhoto = document.querySelector('.madrasa-photo-slot img');

if (madrasaPhoto) {
  const showPhotoPlaceholder = () => {
    madrasaPhoto.hidden = true;
    madrasaPhoto.closest('.madrasa-photo-slot')?.classList.add('image-unavailable');
  };
  madrasaPhoto.addEventListener('error', showPhotoPlaceholder);
  if (madrasaPhoto.complete && !madrasaPhoto.naturalWidth) showPhotoPlaceholder();
}

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
