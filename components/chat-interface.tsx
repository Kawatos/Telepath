"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Send, Trash2, AlertTriangle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { encryptMessage, decryptMessage } from "@/lib/crypto-utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Message {
  id: string
  text: string
  sender: "user" | "contact"
  timestamp: Date
  read: boolean
}

interface ChatInterfaceProps {
  contactId: string
  contactUsername: string
  onDeleteConversation?: () => void
}

export default function ChatInterface({ contactId, contactUsername, onDeleteConversation }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  // Carregar mensagens e configurar listener em tempo real
  useEffect(() => {
    let channel: any = null

    const loadMessages = async () => {
      try {
        setLoading(true)
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          return
        }

        // Buscar mensagens temporárias não entregues
        const { data: tempMessages, error: tempError } = await supabase
          .from("temp_messages")
          .select("*")
          .or(`recipient_id.eq.${userData.user.id},sender_id.eq.${userData.user.id}`)
          .or(`recipient_id.eq.${contactId},sender_id.eq.${contactId}`)
          .order("created_at", { ascending: true })

        if (tempError) {
          throw tempError
        }

        // Processar mensagens recebidas
        if (tempMessages && tempMessages.length > 0) {
          const processedMessages = tempMessages.map((msg) => {
            // Descriptografar mensagem
            const decryptedText = decryptMessage(msg.encrypted_content)
            const isSender = msg.sender_id === userData.user.id

            return {
              id: msg.id,
              text: decryptedText,
              sender: isSender ? "user" : "contact",
              timestamp: new Date(msg.created_at),
              read: isSender ? true : msg.is_delivered,
            }
          })

          setMessages(processedMessages)

          // Marcar mensagens como entregues
          for (const msg of tempMessages) {
            if (msg.recipient_id === userData.user.id && !msg.is_delivered) {
              await supabase
                .from("temp_messages")
                .update({
                  is_delivered: true,
                  delivered_at: new Date().toISOString(),
                })
                .eq("id", msg.id)
            }
          }
        }

        // Configurar listener em tempo real para novas mensagens
        channel = supabase
          .channel(`messages-${contactId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "temp_messages",
              filter: `recipient_id=eq.${userData.user.id}`,
            },
            async (payload) => {
              // Processar nova mensagem recebida
              const msg = payload.new as any

              // Verificar se a mensagem é do contato atual
              if (msg.sender_id === contactId) {
                // Descriptografar mensagem
                const decryptedText = decryptMessage(msg.encrypted_content)

                const newMsg: Message = {
                  id: msg.id,
                  text: decryptedText,
                  sender: "contact",
                  timestamp: new Date(msg.created_at),
                  read: false,
                }

                setMessages((prev) => [...prev, newMsg])

                // Marcar mensagem como entregue
                await supabase
                  .from("temp_messages")
                  .update({
                    is_delivered: true,
                    delivered_at: new Date().toISOString(),
                  })
                  .eq("id", msg.id)
              }
            },
          )
          .subscribe()
      } catch (error: any) {
        toast({
          title: "Erro ao carregar mensagens",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, contactId, toast])

  // Rolar para o final quando as mensagens mudarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    try {
      setSendingMessage(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      // Buscar o ID do usuário de contato pelo nome de usuário
      const { data: contactData, error: contactError } = await supabase
        .from("users")
        .select("id")
        .eq("username", contactUsername)
        .single()

      if (contactError) {
        throw new Error("Contato não encontrado")
      }

      // Criptografar a mensagem
      const encryptedText = await encryptMessage(newMessage)

      // Adicionar mensagem ao banco de dados
      const { data: msgData, error: msgError } = await supabase
        .from("temp_messages")
        .insert({
          sender_id: userData.user.id,
          recipient_id: contactData.id,
          encrypted_content: encryptedText,
        })
        .select()
        .single()

      if (msgError) {
        throw msgError
      }

      // Adicionar mensagem à interface
      const message: Message = {
        id: msgData.id,
        text: newMessage,
        sender: "user",
        timestamp: new Date(),
        read: true,
      }

      setMessages([...messages, message])
      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      // Atualizar localmente
      setMessages(messages.map((msg) => (msg.id === id ? { ...msg, read: true } : msg)))

      // Excluir a mensagem do banco de dados
      const { error } = await supabase.from("temp_messages").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Mensagem lida",
        description: "A mensagem foi marcada como lida e excluída do servidor.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao marcar mensagem como lida",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteConversation = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Usuário não autenticado")
      }

      // Buscar o ID do usuário de contato pelo nome de usuário
      const { data: contactData, error: contactError } = await supabase
        .from("users")
        .select("id")
        .eq("username", contactUsername)
        .single()

      if (contactError) {
        throw new Error("Contato não encontrado")
      }

      // Excluir todas as mensagens entre os usuários
      const { error } = await supabase
        .from("temp_messages")
        .delete()
        .or(`(sender_id.eq.${userData.user.id}.and.recipient_id.eq.${contactData.id}),
             (sender_id.eq.${contactData.id}.and.recipient_id.eq.${userData.user.id})`)

      if (error) {
        throw error
      }

      // Limpar mensagens na interface
      setMessages([])

      toast({
        title: "Conversa excluída",
        description: "Todas as mensagens foram excluídas permanentemente.",
      })

      // Notificar o componente pai
      if (onDeleteConversation) {
        onDeleteConversation()
      }
    } catch (error: any) {
      toast({
        title: "Erro ao excluir conversa",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="border-b border-[#333333] p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">
          SECURE CHANNEL: <span className="text-white">{contactUsername}</span>
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121212] border-[#333333] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Delete Conversation
              </DialogTitle>
              <DialogDescription className="text-[#888888]">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="terminal-button">
                CANCEL
              </Button>
              <Button
                className="bg-red-900 hover:bg-red-800 text-white border-red-700"
                onClick={handleDeleteConversation}
              >
                DELETE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-96 overflow-y-auto p-4 bg-[#0a0a0a]">
        {loading ? (
          <p className="text-center py-4 text-[#888888]">LOADING MESSAGES...</p>
        ) : messages.length === 0 ? (
          <p className="text-center py-4 text-[#888888]">NO MESSAGES. CHANNEL SECURE.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded p-3 ${
                    message.sender === "user"
                      ? "bg-[#1a1a1a] border border-white text-white"
                      : "bg-[#1a1a1a] border border-[#333333] text-white"
                  }`}
                >
                  <p className="font-mono">{message.text}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs opacity-70 text-[#888888]">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {message.sender === "contact" && !message.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2 text-white hover:text-white"
                        onClick={() => handleMarkAsRead(message.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-[#333333] p-4">
        <div className="flex w-full gap-2">
          <Input
            placeholder="TYPE MESSAGE..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="terminal-input"
            disabled={sendingMessage}
          />
          <Button onClick={handleSendMessage} className="terminal-button-primary" disabled={sendingMessage}>
            {sendingMessage ? "..." : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  )
}
