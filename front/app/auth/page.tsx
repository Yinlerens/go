'use client';
import { motion } from 'framer-motion';
import { AuthForm } from './components/AuthForm';
import { Logo } from '@/components/branding/Logo';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { Suspense } from 'react';

const AuthPage = () => {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          className="w-full max-w-6xl flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8">
            <Logo />
          </header>

          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div
              className="flex-1 max-w-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="space-y-6 text-center lg:text-left">
                <motion.div
                  className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Streamlined Authentication
                </motion.div>
                <motion.h1
                  className="text-4xl font-bold tracking-tight md:text-5xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Experience seamless <br className="hidden sm:inline" />
                  <span className="text-primary">authentication</span>
                </motion.h1>
                <motion.p
                  className="text-muted-foreground md:text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  Sign in to your account or create a new one with our beautiful, animated forms
                  designed with simplicity and elegance in mind.
                </motion.p>
              </div>
            </motion.div>

            <div className="flex-1 w-full max-w-md">
              <Suspense>
                <AuthForm />
              </Suspense>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;
