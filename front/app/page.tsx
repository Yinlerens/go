import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function HomePage() {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-primary">Flow Form</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Experience our beautiful authentication system with elegant animations and smooth
            transitions.
          </p>

          <div>
            <Link href="/auth">
              <Button className="auth-button text-lg font-medium px-8 py-6 h-auto">
                Try the Auth Flow
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
