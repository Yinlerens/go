'use client';
import { motion } from 'framer-motion';
import { Logo } from '@/components/branding/Logo';
import { AnimatedBackground } from '@/components/animated-background';
import Link from 'next/link';
import { Button } from "antd";
const Index = () => {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Welcome to <span className="text-primary">Flow Form</span>
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Experience our beautiful authentication system with elegant animations and smooth
            transitions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="auth-button text-lg font-medium px-8 py-6 h-auto " type={"primary"} size='large'>
                  登录系统
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Index;
