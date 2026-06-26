type FormFieldErrorProps = {
  message?: string
}

export function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) return null

  return <p className="text-sm font-medium text-destructive">{message}</p>
}
