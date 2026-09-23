import { navigate } from '../navigation.js'

export default function Link({ to, children, onClick, ...props }) {
  return <a href={to} {...props} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }}>{children}</a>
}
