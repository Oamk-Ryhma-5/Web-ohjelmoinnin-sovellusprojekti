import { useState } from 'react'
import { useLanguage } from '../context/useLanguage.js'

export default function PasswordInput({ id, label, value, onChange, autoComplete, minLength = 1 }) {
  const [visible, setVisible] = useState(false)
  const { texts } = useLanguage()

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={128}
        />
        <button type="button" onClick={() => setVisible(!visible)} aria-pressed={visible}>
          {visible ? texts.hidePassword : texts.showPassword}
        </button>
      </div>
    </div>
  )
}
