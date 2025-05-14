"use client";
import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from "@/schemas/auth";
import { AuthMode } from "@/types/auth";
import { useRouter, useSearchParams } from "next/navigation";
// import { useMenuStore } from "@/store/menu-store";
// import { useAuthStore } from "@/store/user-store";
import { Button, Card, Checkbox, Flex, Form, Input } from "antd";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
const { Search, Password } = Input;
const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      type: "spring",
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
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  // const { fetchMenu } = useMenuStore();
  // const { login, register } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const router = useRouter();

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };
  const sendCode = (e: any) => {
    console.log("%c [ e ]-105", "font-size:13px; background:pink; color:#bf2c9f;", e);
  };
  const register = (e: any) => {
    console.log("%c [ e ]-109", "font-size:13px; background:pink; color:#bf2c9f;", e);
  };
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);
  return (
    <AnimatePresence mode="wait">
      {mode === "login" ? (
        <motion.div
          key="login"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md"
        >
          <Card
            title="欢迎回来"
            className="!rounded-3xl"
            classNames={{
              title: "text-center text-3xl font-bold",
              body: "flex items-center justify-center",
              actions: "!rounded-bl-3xl !rounded-br-3xl"
            }}
            actions={[
              <div className="text-center text-sm text-muted-foreground">
                <motion.span
                  className="text-primary cursor-pointer font-medium"
                  onClick={toggleMode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  立即注册
                </motion.span>
              </div>,
              <div className="text-center text-sm text-muted-foreground">
                <motion.span
                  className="text-primary cursor-pointer font-medium"
                  onClick={toggleMode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  忘记密码
                </motion.span>
              </div>
            ]}
          >
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={() => {}}
              className="w-full"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Please input your Username!" }]}
              >
                <Input prefix={<User size="20" />} placeholder="用户名/邮箱" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Please input your Password!" }]}
              >
                <Input prefix={<Lock size="20" />} type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button block type="primary" htmlType="submit">
                  登录
                </Button>
              </Form.Item>
            </Form>
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
          <Card
            title="创建账户"
            className="!rounded-3xl"
            classNames={{
              title: "text-center text-3xl font-bold",
              body: "flex items-center justify-center",
              actions: "!rounded-bl-3xl !rounded-br-3xl"
            }}
            actions={[
              <div className="text-center text-sm text-muted-foreground">
                <motion.span
                  className="text-primary cursor-pointer font-medium"
                  onClick={toggleMode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  去登录
                </motion.span>
              </div>
            ]}
          >
            <Form name="register" onFinish={register} className="w-full">
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "请输入用户名",
                    whitespace: true
                  }
                ]}
              >
                <Input
                  prefix={<User size="20" />}
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: "请输入密码",
                    whitespace: true
                  }
                ]}
              >
                <Password
                  prefix={<Lock size="20" />}
                  type="password"
                  placeholder="请输入密码"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                rules={[
                  {
                    required: true,
                    message: "请再次输入密码",
                    whitespace: true
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("两次密码不一致"));
                    }
                  })
                ]}
              >
                <Password
                  prefix={<Lock size="20" />}
                  type="password"
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="email"
                rules={[
                  {
                    required: true,
                    message: "请输入邮箱"
                  }
                ]}
              >
                <Input prefix={<Mail size="20" />} type="email" placeholder="请输入邮箱地址" />
              </Form.Item>
              <Form.Item
                name="code"
                rules={[
                  {
                    required: true,
                    message: "请输入验证码"
                  }
                ]}
              >
                <Search
                  prefix={<ShieldCheck size="20" />}
                  placeholder="请输入验证码"
                  enterButton="发送验证码"
                  onSearch={sendCode}
                  type="number"
                />
              </Form.Item>
              <Form.Item>
                <Button block type="primary" htmlType="submit">
                  注册
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
