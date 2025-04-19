"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, User, RefreshCw, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import ChatInterface from "@/components/chat-interface"
import KeyManager from "@/components/key-manager"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidKey } from "@/lib/crypto-utils"

interface Contact {
  id: string
  name: string | null
  contact_username: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("messages")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [selectedContactUsername, setSelectedContactUsername] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [searchKey, setSearchKey] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<{
    username?: string
    user_id?: string
  } | null>(null)
  const [username, setUsername] = useState("")
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  // Verificar autenticação e carregar dados do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          router.push("/login")
          return
        }

        // Carregar nome de usuário
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("username")
          .eq("id", data.session.user.id)
          .single()

        if (userError) {
          throw userError
        }

        setUsername(userData.username)

        // Carregar contatos
        loadContacts()
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router, toast])

  const loadContacts = async () => {
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })

      if (contactsError) {
        throw contactsError
      }

      setContacts(contactsData || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contatos",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSearchKey = async () => {
    if (!searchKey.trim()) {
      toast({
        title: "Chave inválida",
        description: "Por favor, insira uma chave válida para pesquisar.",
        variant: "destructive",
      })
      return
    }

    if (!isValidKey(searchKey)) {
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
        .eq("key_value", searchKey)
        .eq("is_public", true)
        .single()

      if (error) {
        throw new Error("Chave não encontrada ou não está disponível publicamente")
      }

      // Verificar se o usuário optou por compartilhar o nome de usuário
      const result: any = {
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
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: userData.user.id,
          contact_username: userExists.username,
          name: searchResult.username || userExists.username,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Atualizar a lista de contatos
      setContacts([data, ...contacts])

      // Limpar a pesquisa
      setSearchKey("")
      setSearchResult(null)

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

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact.id)
    setSelectedContactUsername(contact.contact_username)
  }

  const handleDeleteConversation = () => {
    // Recarregar contatos após excluir conversa
    loadContacts()
    setSelectedContact(null)
    setSelectedContactUsername("")
  }

  const handleRefreshContacts = () => {
    setLoading(true)
    loadContacts().finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto p-4">
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-controls">
              <div className="terminal-control terminal-close"></div>
              <div className="terminal-control terminal-minimize"></div>
              <div className="terminal-control terminal-maximize"></div>
            </div>
            <div className="terminal-title">telepath_secure_terminal.exe</div>
            <div className="w-[68px]"></div>
          </div>

          <div className="p-4">
            <header className="flex justify-between items-center mb-6 py-2 border-b border-[#333333]">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white">TELEPATH</h1>
                <div className="ml-4 flex items-center text-sm text-[#888888]">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-white">{username}</span>@telepath
                </div>
              </div>
              <Button variant="ghost" className="text-[#888888] hover:text-white" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> LOGOUT
              </Button>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-black border border-[#333333]">
                <TabsTrigger value="messages" className="terminal-tab">
                  MESSAGES
                </TabsTrigger>
                <TabsTrigger value="keys" className="terminal-tab">
                  ENCRYPTION KEYS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Sidebar de Contatos */}
                  <Card className="md:col-span-1 bg-[#121212] border-[#333333]">
                    <div className="p-4 border-b border-[#333333] flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white">CONTACTS</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#888888] hover:text-white h-8 w-8 p-0"
                        onClick={handleRefreshContacts}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Busca de contato por chave */}
                    <div className="p-4 border-b border-[#333333]">
                      <div className="space-y-2">
                        <Label htmlFor="search-contact-key" className="text-white text-sm">
                          ADD CONTACT BY KEY:
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="search-contact-key"
                            placeholder="TLPTH-XXXX-XXXX-XXXX-XXXX-XXXX"
                            value={searchKey}
                            onChange={(e) => setSearchKey(e.target.value.toUpperCase())}
                            className="terminal-input font-mono text-xs"
                          />
                          <Button
                            onClick={handleSearchKey}
                            className="terminal-button-primary"
                            disabled={searchLoading}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>

                        {searchResult && (
                          <div className="mt-2 p-2 bg-[#1a1a1a] border border-[#333333] rounded">
                            <p className="text-xs text-white mb-1">
                              {searchResult.username ? `User found: ${searchResult.username}` : "Anonymous user found"}
                            </p>
                            <Button
                              onClick={handleAddContact}
                              className="w-full terminal-button-primary text-xs py-1 h-auto"
                            >
                              ADD CONTACT
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      {loading ? (
                        <p className="text-center py-4 text-[#888888]">Loading contacts...</p>
                      ) : contacts.length === 0 ? (
                        <p className="text-[#888888] text-center py-4">No contacts found</p>
                      ) : (
                        contacts.map((contact) => (
                          <Button
                            key={contact.id}
                            variant={selectedContact === contact.id ? "default" : "ghost"}
                            className={`w-full justify-start ${
                              selectedContact === contact.id
                                ? "bg-[#333333] text-white border border-white"
                                : "text-white hover:bg-[#1e1e1e] hover:text-white"
                            }`}
                            onClick={() => handleSelectContact(contact)}
                          >
                            {contact.name || contact.contact_username}
                          </Button>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Área de Chat */}
                  <Card className="md:col-span-3 bg-[#121212] border-[#333333]">
                    {selectedContact ? (
                      <ChatInterface
                        contactId={selectedContact}
                        contactUsername={selectedContactUsername}
                        onDeleteConversation={handleDeleteConversation}
                      />
                    ) : (
                      <div className="h-96 flex items-center justify-center text-[#888888] p-4">
                        <div className="text-center">
                          <p>SELECT A CONTACT TO START SECURE COMMUNICATION</p>
                          <div className="terminal-cursor mx-auto mt-4"></div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="keys">
                <KeyManager />
              </TabsContent>
            </Tabs>

            <div className="mt-8 text-center text-xs text-[#888888]">
              <p>All communications are encrypted and automatically deleted after reading.</p>
              <p className="mt-1">© 2025 TELEPATH SECURE COMMUNICATIONS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
