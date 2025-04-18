"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [authStep, setAuthStep] = useState<"initial" | "processing" | "success" | "error">("initial")
  const [authMessage, setAuthMessage] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const supabase = getSupabaseClient()

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push("/dashboard")
      }
    }

    checkSession()
  }, [router, supabase])

  const simulateTerminalProcess = async (action: "login" | "signup", callback: () => Promise<void>) => {
    setAuthStep("processing")
    setAuthMessage(`Initializing ${action === "login" ? "authentication" : "registration"} process...`)

    await new Promise((resolve) => setTimeout(resolve, 800))
    setAuthMessage((prev) => prev + "\nValidating credentials...")

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setAuthMessage((prev) => prev + "\nEstablishing secure connection...")

    await new Promise((resolve) => setTimeout(resolve, 1200))

    try {
      await callback()
      setAuthStep("success")
      setAuthMessage((prev) => prev + `\n${action === "login" ? "Authentication" : "Registration"} successful!`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/dashboard")
    } catch (error: any) {
      setAuthStep("error")
      setAuthMessage((prev) => prev + `\nERROR: ${error.message || "An unknown error occurred"}`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setAuthStep("initial")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await simulateTerminalProcess("login", async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }
    })

    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await simulateTerminalProcess("signup", async () => {
      // 1. Criar conta de autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário")
      }

      // 2. Inserir dados do usuário na tabela users
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        username,
      })

      if (profileError) {
        throw profileError
      }
    })

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="terminal-container w-full max-w-md">
        <div className="terminal-header">
          <div className="terminal-controls">
            <div className="terminal-control terminal-close"></div>
            <div className="terminal-control terminal-minimize"></div>
            <div className="terminal-control terminal-maximize"></div>
          </div>
          <div className="terminal-title">telepath_auth.exe</div>
          <div className="w-[68px]"></div>
        </div>

        <div className="terminal-content p-6">
          <Link href="/" className="flex items-center text-white mb-6 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            RETURN TO MAIN TERMINAL
          </Link>

          <h1 className="text-2xl font-bold mb-6 text-center text-white">TELEPATH AUTHENTICATION</h1>

          {authStep === "initial" ? (
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="terminal-tab">
                  LOGIN
                </TabsTrigger>
                <TabsTrigger value="signup" className="terminal-tab">
                  REGISTER
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      EMAIL:
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="terminal-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      PASSWORD:
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="terminal-input"
                      required
                    />
                  </div>

                  <Button type="submit" className="terminal-button-primary w-full mt-6" disabled={loading}>
                    {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">
                      USERNAME:
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="agent_smith"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="terminal-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">
                      EMAIL:
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="user@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="terminal-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">
                      PASSWORD:
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="terminal-input"
                      required
                    />
                  </div>

                  <Button type="submit" className="terminal-button-primary w-full mt-6" disabled={loading}>
                    {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="terminal-process-output bg-black p-4 rounded font-mono text-sm h-64 overflow-auto">
              {authMessage.split("\n").map((line, i) => (
                <div key={i} className="mb-2">
                  <span className="text-white">$</span> {line}
                  {i === authMessage.split("\n").length - 1 && authStep === "processing" && (
                    <span className="terminal-cursor"></span>
                  )}
                </div>
              ))}

              {authStep === "success" && <div className="text-white mt-4">Redirecting to secure terminal...</div>}

              {authStep === "error" && (
                <div className="text-red-500 mt-4">Authentication failed. Returning to login screen...</div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-[#888888]">
            <p>All communications are encrypted and automatically deleted after reading.</p>
            <p className="mt-1">© 2025 TELEPATH SECURE COMMUNICATIONS</p>
          </div>
        </div>
      </div>
    </div>
  )
}
