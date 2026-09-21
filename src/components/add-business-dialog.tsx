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
import { addBusiness } from "@/lib/store"

export function AddBusinessDialog({
  open,
  onOpenChange,
  listId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [social, setSocial] = useState("")

  function reset() {
    setName("")
    setCategory("")
    setAddress("")
    setPhone("")
    setSocial("")
  }

  function save() {
    if (!name.trim()) {
      toast.error("El nombre del negocio es obligatorio.")
      return
    }
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
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar negocio</DialogTitle>
          <DialogDescription>
            Cargá un contacto suelto si no está en el Excel o CSV.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Nombre" value={name} onChange={setName} required />
          <Field label="Rubro" value={category} onChange={setCategory} placeholder="Peluquería, estética, canina…" />
          <Field label="Ubicación" value={address} onChange={setAddress} />
          <Field label="WhatsApp" value={phone} onChange={setPhone} placeholder="+54 223 123-4567" />
          <Field label="Instagram u otra red" value={social} onChange={setSocial} placeholder="@negocio" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Agregar</Button>
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
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
