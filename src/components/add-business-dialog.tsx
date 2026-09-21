"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { addBusiness, updateBusiness } from "@/lib/store"
import type { Business } from "@/lib/types"

export function AddBusinessDialog({
  open,
  onOpenChange,
  listId,
  business,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string
  business?: Business | null
}) {
  const isEdit = Boolean(business)
  const [name, setName] = useState(business?.name ?? "")
  const [category, setCategory] = useState(business?.category ?? "")
  const [address, setAddress] = useState(business?.address ?? "")
  const [phone, setPhone] = useState(business?.phone ?? "")
  const [social, setSocial] = useState(business?.social ?? "")

  function reset() {
    setName(business?.name ?? "")
    setCategory(business?.category ?? "")
    setAddress(business?.address ?? "")
    setPhone(business?.phone ?? "")
    setSocial(business?.social ?? "")
  }

  function save() {
    if (!name.trim()) {
      toast.error("El nombre del negocio es obligatorio.")
      return
    }
    if (business) {
      updateBusiness(listId, business.id, {
        name: name.trim(),
        category: category.trim(),
        address: address.trim(),
        phone: phone.trim(),
        social: social.trim(),
      })
      toast.success("Datos actualizados")
    } else {
      addBusiness(listId, {
        city: "",
        name: name.trim(),
        category: category.trim(),
        address: address.trim(),
        phone: phone.trim(),
        social: social.trim(),
        contacted: false,
        respondedOk: false,
        respondedNo: false,
        lastMessageAt: null,
      })
      toast.success(`${name.trim()} agregado a la lista`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar negocio" : "Agregar negocio"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Corregí los datos que se importaron mal."
              : "Cargá un contacto suelto si no está en el CSV."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Nombre" value={name} onChange={setName} required />
          <Field
            label="Rubro"
            value={category}
            onChange={setCategory}
            placeholder="Peluquería, estética, canina…"
          />
          <Field label="Ubicación" value={address} onChange={setAddress} />
          <Field
            label="WhatsApp"
            value={phone}
            onChange={setPhone}
            placeholder="+54 223 123-4567"
          />
          <Field
            label="Instagram u otra red"
            value={social}
            onChange={setSocial}
            placeholder="@negocio"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>{isEdit ? "Guardar" : "Agregar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={id}
        className="h-11 text-base lg:h-8 lg:text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
