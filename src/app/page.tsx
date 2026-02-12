import Link from "next/link";
import { ArrowRight, Code2, Terminal, Users, Zap, Shield, Github, Star, CheckCircle } from "lucide-react";
import { Button } from "src/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      
      <nav className="relative p-8 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white">CodeMaster</span>
        </div>
        <div className="flex gap-6">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800 transition-all">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-blue-600 hover:bg-blue-700 transition-all">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="max-w-6xl mx-auto">
          
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-full text-sm font-medium mb-12">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-blue-400">The Future of Collaborative Coding</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="text-white">
              Code. Collaborate.
            </span>
            <br />
            <span className="text-blue-400">
              & Create.
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-20 leading-relaxed">
            A professional-grade online code editor with real-time collaboration, 
            secure execution, and cloud storage. Ship faster, together.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-32">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 h-14 px-8 text-base font-semibold transition-all">
                Start Coding Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
          </div>

          <div className="flex items-center justify-center gap-12 mb-40 text-gray-500">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              <span>10k+ Developers</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>4.9 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>50+ Countries</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-center mb-20 text-white">
            Everything you need to code, collaborate, and ship
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
            <div className="group relative bg-[#18181b] p-12 rounded-xl border border-gray-800 hover:border-blue-500 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-10">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-white">Secure Execution</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Run code safely in sandboxed environments with support for 10+ programming languages.</p>
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Docker-based isolation</span>
              </div>
            </div>

            <div className="group relative bg-[#18181b] p-12 rounded-xl border border-gray-800 hover:border-purple-500 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-10">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-white">Real-time Collaboration</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Code together with your team in real-time with live cursors, comments, and instant sync.</p>
              <div className="flex items-center gap-2 text-purple-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Live multiplayer editing</span>
              </div>
            </div>

            <div className="group relative bg-[#18181b] p-12 rounded-xl border border-gray-800 hover:border-green-500 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-10">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-white">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Experience blazing-fast performance with optimized compilation and intelligent caching.</p>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Sub-second builds</span>
              </div>
            </div>

            <div className="group relative bg-[#18181b] p-12 rounded-xl border border-gray-800 hover:border-orange-500 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-10">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-white">Enterprise Security</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Bank-level encryption, SOC2 compliance, and advanced access controls for your code.</p>
              <div className="flex items-center gap-2 text-orange-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>GDPR & SOC2 compliant</span>
              </div>
            </div>

            <div className="group relative bg-[#18181b] p-12 rounded-xl border border-gray-800 hover:border-cyan-500 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-10">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-white">Smart IntelliSense</h3>
              <p className="text-gray-400 leading-relaxed mb-8">AI-powered code completion, error detection, and intelligent refactoring suggestions.</p>
              <div className="flex items-center gap-2 text-cyan-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>GitHub Copilot integration</span>
              </div>
            </div>

            <div className="group relative bg-[#18181b] p-12 rounded-xl border border-gray-800 hover:border-pink-500 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-10">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-6 text-white">Premium Templates</h3>
              <p className="text-gray-400 leading-relaxed mb-8">Start faster with 100+ professional templates for React, Node.js, Python, and more.</p>
              <div className="flex items-center gap-2 text-pink-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Industry-standard scaffolds</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full mt-32 text-center">
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-16">
            <h2 className="text-3xl font-bold mb-6 text-white">
              Ready to transform your development workflow?
            </h2>
            <p className="text-gray-400 mb-12 text-lg">
              Join thousands of developers who are already shipping better code, faster.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-14 px-8 text-base font-semibold transition-all">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-gray-500 text-sm mt-6">No credit card required • Free forever for personal use</p>
          </div>
        </div>
      </main>
    </div>
  );
}