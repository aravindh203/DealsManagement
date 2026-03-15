import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Check, X, Info } from "lucide-react"

function ToastIcon({ variant }: { variant?: "default" | "destructive" | "success" }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
  if (variant === "success") {
    return (
      <div className={`${base} bg-emerald-500`} aria-hidden>
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </div>
    )
  }
  if (variant === "destructive") {
    return (
      <div className={`${base} bg-red-500`} aria-hidden>
        <X className="h-4 w-4" strokeWidth={2.5} />
      </div>
    )
  }
  return (
    <div className={`${base} bg-blue-500`} aria-hidden>
      <Info className="h-4 w-4" strokeWidth={2.5} />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <ToastViewport />
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <ToastIcon variant={variant} />
            <div className="flex-1 min-w-0 text-center pr-[44px]">
              {title && <ToastTitle>{title}</ToastTitle>}
            </div>
            {action}
          </Toast>
        )
      })}
    </ToastProvider>
  )
}
