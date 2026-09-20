import { useState } from 'react'
import { useI18n } from '../i18n/context.js'
import Icon from './Icon.jsx'

export default function PasswordField({ id, label, hint, ...props }) {
  const [visible, setVisible] = useState(false)
  const { t } = useI18n()
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="password-input">
      <input id={id} type={visible ? 'text' : 'password'} maxLength={128} required aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      <button type="button" aria-label={t(visible ? 'hidePassword' : 'showPassword')} aria-controls={id} aria-pressed={visible} onClick={() => setVisible(value => !value)}><Icon name={visible ? 'eyeOff' : 'eye'} /></button>
    </div>
    {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
  </div>
}
