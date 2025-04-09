'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from '@/schemas/auth';
import { AuthMode } from '@/types/auth';
import { login, logout, register } from '@/app/api/auth';
import { useRouter } from 'next/navigation';

const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      type: 'spring',
      damping: 20,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const inputVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.03 },
  tap: { scale: 0.97 }
};

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: ''
    }
  });

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const onLoginSubmit = async (value: LoginFormData) => {
    setIsLoading(true);
    try {
      const { code, data } = await login(value);
      if (code === 0) {
        toast.success('登录成功');
        localStorage.setItem('access_token', data.access_token);
        router.push('/dashboard');
        // const res = await logout();
      }
      loginForm.reset();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (value: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { code, data } = await register(value);
      if (code === 0) {
        toast.success('注册成功');
      }
      registerForm.reset();
      setMode('login');
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {mode === 'login' ? (
        <motion.div
          key="login"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md"
        >
          <Card className="glass-card rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">欢迎回来</CardTitle>
              {/* <CardDescription>Enter your credentials to sign in to your account</CardDescription> */}
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                placeholder="admin"
                                className="pl-10 rounded-xl input-focus-ring h-12"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="请输入密码"
                                className="pl-10 pr-10 rounded-xl input-focus-ring h-12"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <motion.div
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 auth-button text-base font-medium"
                        disabled={isLoading}
                      >
                        {isLoading ? '登录中...' : '登录'}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                没有账号?
                <motion.span
                  className="text-primary cursor-pointer font-medium"
                  onClick={toggleMode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  立即注册
                </motion.span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="register"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md"
        >
          <Card className="glass-card rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">创建账户</CardTitle>
              {/* <CardDescription>Enter your information to create your account</CardDescription> */}
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                placeholder="admin"
                                className="pl-10 rounded-xl input-focus-ring h-12"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="请输入密码"
                                className="pl-10 pr-10 rounded-xl input-focus-ring h-12"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                  >
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>重复密码</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="请重复输入密码"
                                className="pl-10 pr-10 rounded-xl input-focus-ring h-12"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    custom={4}
                  >
                    <motion.div
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 auth-button text-base font-medium"
                        disabled={isLoading}
                      >
                        {isLoading ? '注册中...' : '注册'}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                已有账号?
                <motion.span
                  className="text-primary cursor-pointer font-medium"
                  onClick={toggleMode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  去登录
                </motion.span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
