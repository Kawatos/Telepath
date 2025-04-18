"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Key, Trash2, Copy, RefreshCw, Check } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { generateRandomKey } from "@/lib/crypto-utils"
import { useToast } from "@/hooks/use-toast"

interface KeyData {
  id: string
  key_value: string
  name: string | null
  created_at: string
}

export default function KeyManager() {
  const [keys, setKeys] = useState<KeyData[]>([])
  const [newContactKey, setNewContactKey] = useState("")
  const [newContactUsername, setNewContactUsername] = useState("")
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  // Carregar chaves do usuário
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          return
        }

        const { data, error } = await supabase
          .from("encryption_keys")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setKeys(data || [])
      } catch (error: any) {
        toast({
          title: "Erro ao carregar chaves",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadKeys()
  }, [supabase, toast])

  const handleCreateKey = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      const newKey = generateRandomKey()

      const { data, error } = await supabase
        .from("encryption_keys")
        .insert({
          user_id: userData.user.id,
          key_value: newKey,
          name: `KEY_${keys.length + 1}`,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setKeys([data, ...keys])

      toast({
        title: "Chave criada com sucesso",
        description: "Sua nova chave de criptografia está pronta para uso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao criar chave",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteKey = async (id: string) => {
    try {
      const { error } = await supabase.from("encryption_keys").delete().eq("id", id)

      if (error) {
        throw error
      }

      setKeys(keys.filter((key) => key.id !== id))

      toast({
        title: "Chave excluída",
        description: "A chave foi removida permanentemente.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao excluir chave",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCopyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKeyId(id)

    toast({
      title: "Chave copiada",
      description: "A chave foi copiada para a área de transferência.",
    })

    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleAddContactKey = async () => {
    try {
      if (!newContactKey.trim() || !newContactUsername.trim()) {
        throw new Error("Nome de usuário e chave são obrigatórios")
      }

      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar se o usuário existe
      const { data: userExists, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", newContactUsername)
        .single()

      if (userError) {
        throw new Error("Usuário não encontrado")
      }

      // Adicionar contato
      const { error } = await supabase.from("contacts").insert({
        user_id: userData.user.id,
        contact_username: newContactUsername,
        name: newContactUsername,
      })

      if (error) {
        throw error
      }

      setNewContactKey("")
      setNewContactUsername("")

      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar contato",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-[#121212] border-[#333333]">
        <CardHeader className="border-b border-[#333333]">
          <CardTitle className="flex items-center gap-2 text-[#00ff00]">
            <Key className="h-5 w-5" />
            ENCRYPTION KEYS
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {loading ? (
            <p className="text-center py-4 text-[#888888]">LOADING KEYS...</p>
          ) : keys.length === 0 ? (
            <p className="text-[#888888] text-center py-4">NO KEYS GENERATED</p>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#333333] rounded"
              >
                <div className="overflow-hidden">
                  <p className="font-mono text-sm truncate w-48 md:w-64 text-[#00ff00]">{key.key_value}</p>
                  <p className="text-xs text-[#888888]">
                    {key.name} • {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyKey(key.id, key.key_value)}
                    className="text-[#888888] hover:text-[#00ff00]"
                  >
                    {copiedKeyId === key.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <Button onClick={handleCreateKey} className="w-full terminal-button-primary mt-4">
            <Plus className="mr-2 h-4 w-4" /> GENERATE NEW KEY
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#121212] border-[#333333]">
        <CardHeader className="border-b border-[#333333]">
          <CardTitle className="flex items-center gap-2 text-[#00ff00]">
            <RefreshCw className="h-5 w-5" />
            ADD CONTACT KEY
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-username" className="text-[#00ff00] mb-2 block">
                CONTACT USERNAME:
              </Label>
              <Input
                id="contact-username"
                placeholder="username"
                value={newContactUsername}
                onChange={(e) => setNewContactUsername(e.target.value)}
                className="terminal-input"
              />
            </div>

            <div>
              <Label htmlFor="contact-key" className="text-[#00ff00] mb-2 block">
                CONTACT KEY (OPTIONAL):
              </Label>
              <Input
                id="contact-key"
                placeholder="paste_key_here"
                value={newContactKey}
                onChange={(e) => setNewContactKey(e.target.value)}
                className="terminal-input font-mono"
              />
            </div>

            <Button
              onClick={handleAddContactKey}
              className="w-full terminal-button-primary mt-4"
              disabled={!newContactUsername}
            >
              ADD CONTACT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
