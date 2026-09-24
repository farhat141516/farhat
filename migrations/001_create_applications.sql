CREATE TABLE IF NOT EXISTS applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  birth_date DATE NOT NULL,
  guardian_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  program VARCHAR(80) NOT NULL CHECK (program IN (
    'Начальный уровень',
    'Основная программа',
    'Изучение Корана',
    'Арабский язык'
  )),
  comment VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  consent_given_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications (created_at DESC);
