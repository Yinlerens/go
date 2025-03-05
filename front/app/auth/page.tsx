import { AuthForm } from './components/AuthForm';
import { Logo } from '@/components/branding/Logo';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function AuthPage() {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-6xl flex flex-col items-center">
          <header className="mb-8">
            <Logo />
          </header>

          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 max-w-md">
              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  Streamlined Authentication
                </div>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  Experience seamless <br className="hidden sm:inline" />
                  <span className="text-primary">authentication</span>
                </h1>
                <p className="text-muted-foreground md:text-lg">
                  Sign in to your account or create a new one with our beautiful, animated forms
                  designed with simplicity and elegance in mind.
                </p>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md">
              <AuthForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
