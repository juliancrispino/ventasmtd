"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ExternalLink, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contactar por WhatsApp</DialogTitle>
          <DialogDescription>
            {business ? (
              <span>
                Se va a escribir a <strong>{business.name}</strong>
                {hasPhone(business.phone)
                  ? ` (${formatPhone(business.phone)})`
                  : ""}
                . Podés editar el mensaje antes de enviarlo.
              </span>
            ) : (
              "Elegí un negocio de la tabla."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="contact-message">Mensaje</Label>
          <Textarea
            id="contact-message"
            className="min-h-40"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={!business || !hasPhone(business.phone)}>
            <MessageCircle />
            Abrir WhatsApp
            <ExternalLink />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
