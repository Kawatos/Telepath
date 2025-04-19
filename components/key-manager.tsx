"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Key, Trash2, Copy, RefreshCw, Check, Shield, Search } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { generateRandomKey, isValidKey } from "@/lib/crypto-utils"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface KeyData {
  id: string
  key_value: string
  name: string | null
  created_at: string
  is_public: boolean
  share_username: boolean
}

export default function KeyManager() {
  const [keys, setKeys] = useState<KeyData[]>([])
  const [personalKey, setPersonalKey] = useState<KeyData | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [shareUsername, setShareUsername] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [searchKeyValue, setSearchKeyValue] = useState("")
  const [searchResult, setSearchResult] = useState<{
    key_value: string
    username?: string
    user_id?: string
  } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  // Carregar chaves do usuário
  const loadKeys = async () => {
    try {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        return
      }

      // Carregar todas as chaves
      const { data, error } = await supabase
        .from("encryption_keys")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Verificar se existe uma chave pessoal
      const personalKeyData = data?.find((key) => key.name === "PERSONAL_KEY") || null
      setPersonalKey(personalKeyData)

      // Filtrar para não mostrar a chave pessoal na lista geral
      const otherKeys = data?.filter((key) => key.name !== "PERSONAL_KEY") || []
      setKeys(otherKeys)
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

  useEffect(() => {
    loadKeys()
  }, [supabase, toast])

  const handleCreatePersonalKey = async () => {
    try {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      // Se já existe uma chave pessoal, excluir antes de criar uma nova
      if (personalKey) {
        const { error: deleteError } = await supabase.from("encryption_keys").delete().eq("id", personalKey.id)

        if (deleteError) {
          throw deleteError
        }
      }

      // Gerar nova chave
      const newKey = generateRandomKey()
      console.log("Nova chave gerada:", newKey)

      // Inserir nova chave no banco de dados
      const { data, error } = await supabase
        .from("encryption_keys")
        .insert({
          user_id: userData.user.id,
          key_value: newKey,
          name: "PERSONAL_KEY",
          is_public: isPublic,
          share_username: shareUsername,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setPersonalKey(data)
      setRegenerateDialogOpen(false)

      toast({
        title: "Chave pessoal criada",
        description: "Sua chave pessoal foi criada com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao criar chave pessoal:", error)
      toast({
        title: "Erro ao criar chave pessoal",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKeySettings = async () => {
    try {
      if (!personalKey) {
        throw new Error("Nenhuma chave pessoal encontrada")
      }

      const { error } = await supabase
        .from("encryption_keys")
        .update({
          is_public: isPublic,
          share_username: shareUsername,
        })
        .eq("id", personalKey.id)

      if (error) {
        throw error
      }

      setPersonalKey({
        ...personalKey,
        is_public: isPublic,
        share_username: shareUsername,
      })

      toast({
        title: "Configurações atualizadas",
        description: "As configurações da sua chave pessoal foram atualizadas.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreateKey = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      const newKey = generateRandomKey()
      const keyName = newKeyName.trim() || `KEY_${keys.length + 1}`

      const { data, error } = await supabase
        .from("encryption_keys")
        .insert({
          user_id: userData.user.id,
          key_value: newKey,
          name: keyName,
          is_public: false,
          share_username: false,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setKeys([data, ...keys])
      setNewKeyName("")

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

  const handleSearchKey = async () => {
    if (!searchKeyValue.trim()) {
      toast({
        title: "Chave inválida",
        description: "Por favor, insira uma chave válida para pesquisar.",
        variant: "destructive",
      })
      return
    }

    if (!isValidKey(searchKeyValue)) {
      toast({
        title: "Formato de chave inválido",
        description: "A chave deve estar no formato TLPTH-XXXX-XXXX-XXXX-XXXX-XXXX.",
        variant: "destructive",
      })
      return
    }

    setSearchLoading(true)
    setSearchResult(null)

    try {
      // Buscar a chave no banco de dados
      const { data, error } = await supabase
        .from("encryption_keys")
        .select("*, users:user_id(username, id)")
        .eq("key_value", searchKeyValue)
        .eq("is_public", true)
        .single()

      if (error) {
        throw new Error("Chave não encontrada ou não está disponível publicamente")
      }

      // Verificar se o usuário optou por compartilhar o nome de usuário
      const result: any = {
        key_value: data.key_value,
        user_id: data.user_id,
      }

      if (data.share_username) {
        result.username = (data.users as any).username
      }

      setSearchResult(result)
    } catch (error: any) {
      toast({
        title: "Erro ao buscar chave",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddContact = async () => {
    if (!searchResult || !searchResult.user_id) {
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar se o usuário existe
      const { data: userExists, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("id", searchResult.user_id)
        .single()

      if (userError) {
        throw new Error("Usuário não encontrado")
      }

      // Adicionar contato
      const { error } = await supabase.from("contacts").insert({
        user_id: userData.user.id,
        contact_username: userExists.username,
        name: searchResult.username || userExists.username,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Contato adicionado",
        description: "O contato foi adicionado com sucesso.",
      })

      // Limpar a pesquisa
      setSearchKeyValue("")
      setSearchResult(null)
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar contato",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Atualizar estados quando a chave pessoal mudar
  useEffect(() => {
    if (personalKey) {
      setIsPublic(personalKey.is_public)
      setShareUsername(personalKey.share_username)
    }
  }, [personalKey])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-black border border-[#333333]">
          <TabsTrigger value="personal" className="terminal-tab">
            PERSONAL KEY
          </TabsTrigger>
          <TabsTrigger value="search" className="terminal-tab">
            SEARCH KEY
          </TabsTrigger>
          <TabsTrigger value="manage" className="terminal-tab">
            MANAGE KEYS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="bg-[#121212] border-[#333333]">
            <CardHeader className="border-b border-[#333333]">
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                PERSONAL ENCRYPTION KEY
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              {loading ? (
                <p className="text-center py-4 text-[#888888]">LOADING KEY...</p>
              ) : personalKey ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#1a1a1a] border border-[#333333] rounded">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white">YOUR PERSONAL KEY:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(personalKey.id, personalKey.key_value)}
                        className="text-[#888888] hover:text-white h-8 w-8 p-0"
                      >
                        {copiedKeyId === personalKey.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="font-mono text-sm break-all text-white">{personalKey.key_value}</p>
                  </div>

                  <div className="space-y-4 p-3 bg-[#1a1a1a] border border-[#333333] rounded">
                    <h3 className="text-sm font-semibold text-white mb-2">KEY SETTINGS</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-white">Public Key</p>
                        <p className="text-xs text-[#888888]">Allow others to find your key</p>
                      </div>
                      <Switch
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        className="data-[state=checked]:bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-white">Share Username</p>
                        <p className="text-xs text-[#888888]">Show your username when key is found</p>
                      </div>
                      <Switch
                        checked={shareUsername}
                        onCheckedChange={setShareUsername}
                        disabled={!isPublic}
                        className="data-[state=checked]:bg-white"
                      />
                    </div>

                    <Button onClick={handleUpdateKeySettings} className="w-full terminal-button-primary mt-2">
                      UPDATE SETTINGS
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-[#888888]">
                      Created: {new Date(personalKey.created_at).toLocaleDateString()}
                    </p>
                    <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="terminal-button">
                          <RefreshCw className="h-4 w-4 mr-2" /> REGENERATE
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#121212] border-[#333333] text-white">
                        <DialogHeader>
                          <DialogTitle>Regenerate Personal Key</DialogTitle>
                          <DialogDescription className="text-[#888888]">
                            This will create a new personal key and delete your current one. All contacts using your
                            current key will need to be updated.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" className="terminal-button">
                              CANCEL
                            </Button>
                          </DialogClose>
                          <Button
                            className="terminal-button-primary"
                            onClick={handleCreatePersonalKey}
                            disabled={loading}
                          >
                            {loading ? "GENERATING..." : "REGENERATE KEY"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#888888] text-center py-4">NO PERSONAL KEY FOUND</p>

                  <div className="space-y-4 p-3 bg-[#1a1a1a] border border-[#333333] rounded">
                    <h3 className="text-sm font-semibold text-white mb-2">KEY SETTINGS</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-white">Public Key</p>
                        <p className="text-xs text-[#888888]">Allow others to find your key</p>
                      </div>
                      <Switch
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        className="data-[state=checked]:bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-white">Share Username</p>
                        <p className="text-xs text-[#888888]">Show your username when key is found</p>
                      </div>
                      <Switch
                        checked={shareUsername}
                        onCheckedChange={setShareUsername}
                        disabled={!isPublic}
                        className="data-[state=checked]:bg-white"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreatePersonalKey}
                    className="w-full terminal-button-primary mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <span>GENERATING KEY...</span>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" /> GENERATE PERSONAL KEY
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card className="bg-[#121212] border-[#333333]">
            <CardHeader className="border-b border-[#333333]">
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-5 w-5" />
                FIND CONTACT BY KEY
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="search-key" className="text-white">
                  ENTER CONTACT KEY:
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="search-key"
                    placeholder="TLPTH-XXXX-XXXX-XXXX-XXXX-XXXX"
                    value={searchKeyValue}
                    onChange={(e) => setSearchKeyValue(e.target.value.toUpperCase())}
                    className="terminal-input font-mono flex-1"
                  />
                  <Button onClick={handleSearchKey} className="terminal-button-primary" disabled={searchLoading}>
                    {searchLoading ? "..." : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {searchResult && (
                <div className="p-3 bg-[#1a1a1a] border border-[#333333] rounded mt-4">
                  <h3 className="text-sm font-semibold text-white mb-2">KEY FOUND</h3>

                  <div className="space-y-2">
                    {searchResult.username && (
                      <p className="text-sm text-white">
                        <span className="text-[#888888]">Username:</span> {searchResult.username}
                      </p>
                    )}
                    {!searchResult.username && (
                      <p className="text-xs text-[#888888]">The owner of this key has chosen to remain anonymous.</p>
                    )}

                    <Button onClick={handleAddContact} className="w-full terminal-button-primary mt-2">
                      ADD TO CONTACTS
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-xs text-[#888888] mt-4">
                <p>Enter a personal key to find and add a contact.</p>
                <p>Only public keys can be found through search.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="bg-[#121212] border-[#333333]">
            <CardHeader className="border-b border-[#333333]">
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="h-5 w-5" />
                MANAGE ENCRYPTION KEYS
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="new-key-name" className="text-white">
                  NEW KEY NAME (OPTIONAL):
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-key-name"
                    placeholder="Enter key name..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="terminal-input flex-1"
                  />
                  <Button onClick={handleCreateKey} className="terminal-button-primary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-semibold text-white">YOUR KEYS</h3>

                {loading ? (
                  <p className="text-center py-4 text-[#888888]">LOADING KEYS...</p>
                ) : keys.length === 0 ? (
                  <p className="text-[#888888] text-center py-4">NO ADDITIONAL KEYS</p>
                ) : (
                  keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#333333] rounded"
                    >
                      <div className="overflow-hidden">
                        <p className="font-mono text-sm truncate w-48 md:w-64 text-white">{key.key_value}</p>
                        <p className="text-xs text-[#888888]">
                          {key.name} • {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(key.id, key.key_value)}
                          className="text-[#888888] hover:text-white"
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
