"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ExternalLink, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { buildWhatsAppUrl, fillTemplate } from "@/lib/whatsapp"
import { formatPhone, hasPhone } from "@/lib/phone"
import { updateBusiness } from "@/lib/store"
import type { Business, Settings } from "@/lib/types"

export function ContactDialog({
  open,
  onOpenChange,
  listId,
  city,
  business,
  settings,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string
  city: string
  business: Business | null
  settings: Settings
}) {
  const [message, setMessage] = useState(() =>
    business ? fillTemplate(settings.whatsappMessage, business, city) : ""
  )

  function send() {
    if (!business) return
    const url = buildWhatsAppUrl(business.phone, message)
    if (!url) {
      toast.error("Este negocio no tiene un número de WhatsApp válido.")
      return
    }
    updateBusiness(listId, business.id, {
      contacted: true,
      lastMessageAt: new Date().toISOString(),
    })
    window.open(url, "_blank", "noopener,noreferrer")
    toast.success(`WhatsApp abierto · último mensaje actualizado para ${business.name}`)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] w-full gap-0 rounded-t-2xl sm:max-w-none"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Contactar por WhatsApp</SheetTitle>
          <SheetDescription>
            {business ? (
              <span>
                Se va a escribir a <strong>{business.name}</strong>
                {hasPhone(business.phone)
                  ? ` (${formatPhone(business.phone)})`
                  : ""}
                . Podés editar el mensaje antes de enviarlo.
              </span>
            ) : (
              "Elegí un negocio."
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 overflow-y-auto px-4 pb-2">
          <Label htmlFor="contact-message">Mensaje</Label>
          <Textarea
            id="contact-message"
            className="min-h-36 text-base"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button className="h-11 w-full" onClick={send} disabled={!business || !hasPhone(business.phone)}>
            <MessageCircle />
            Abrir WhatsApp
            <ExternalLink />
          </Button>
          <Button className="h-11 w-full" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
