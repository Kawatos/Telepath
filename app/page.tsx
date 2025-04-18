import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="terminal-container w-full max-w-3xl">
        <div className="terminal-header">
          <div className="terminal-controls">
            <div className="terminal-control terminal-close"></div>
            <div className="terminal-control terminal-minimize"></div>
            <div className="terminal-control terminal-maximize"></div>
          </div>
          <div className="terminal-title">telepath.exe</div>
          <div className="w-[68px]"></div>
        </div>

        <div className="terminal-content p-6 md:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 terminal-text-green">TELEPATH</h1>
            <div className="flex justify-center mb-4">
              <div className="h-[1px] w-32 bg-[#333333]"></div>
            </div>
            <p className="text-[#cccccc] mb-6">Secure Messaging Protocol v1.0.0</p>

            <div className="space-y-4 mb-8 text-left max-w-xl mx-auto">
              <div className="terminal-message">
                <span className="terminal-text-green">$</span> Initializing secure communication channel...
              </div>
              <div className="terminal-message">
                <span className="terminal-text-green">$</span> End-to-end encryption:{" "}
                <span className="terminal-text-green">ENABLED</span>
              </div>
              <div className="terminal-message">
                <span className="terminal-text-green">$</span> Message persistence:{" "}
                <span className="terminal-text-green">EPHEMERAL</span>
              </div>
              <div className="terminal-message">
                <span className="terminal-text-green">$</span> System ready. Awaiting user authentication...
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4 items-center">
            <Link href="/login" className="w-full max-w-xs">
              <Button className="terminal-button-primary w-full py-2 h-auto">AUTHENTICATE</Button>
            </Link>

            <div className="text-sm text-[#888888] mt-8 text-center">
              <p>All communications are encrypted and automatically deleted after reading.</p>
              <p className="mt-2">© {new Date().getFullYear()} TELEPATH SECURE COMMUNICATIONS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
