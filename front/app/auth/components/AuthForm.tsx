"use client";
import "@ant-design/v5-patch-for-react-19";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from "@/schemas/auth";
import { AuthMode } from "@/types/auth";
import { useRouter, useSearchParams } from "next/navigation";
// import { useMenuStore } from "@/store/menu-store";
// import { useAuthStore } from "@/store/user-store";
import { Button, Card, Checkbox, Flex, Form, Input } from "antd";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
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
  const [form] = Form.useForm();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // 用于倒计时的 state
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); // 用于存储 interval ID

  // const { fetchMenu } = useMenuStore();
  // const { login, register } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const router = useRouter();
  // 清理 interval 的 effect
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const handleSendCode = async () => {
    if (countdown > 0) return; // 如果正在倒计时，则不执行
    try {
      const { email } = await form.validateFields(["email"]);

      setSendCodeLoading(true);
      const response = await fetch("/api/auth/verification", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      const result = await response.json();

      if (result.code === "0") {
        toast.success(result.msg || "验证码已发送，请检查您的邮箱。");
        startCountdown(60); // 发送成功后开始60秒倒计时
      } else {
        toast.error(result.msg || "发送验证码失败。");
        if (result.msg && result.msg.includes("秒后重试")) {
          const match = result.msg.match(/(\d+)\s*秒后重试/);
          if (match && match[1]) {
            startCountdown(parseInt(match[1], 10));
          }
        }
      }
    } catch (errorInfo) {
      // ...
    } finally {
      setSendCodeLoading(false);
    }
  };
  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };
  const register = async (value: any) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(value),
        headers: {
          "Content-Type": "application/json"
        }
      });
      const { code, msg } = await response.json();
      if (code == 200) {
        toast.success(msg);
        form.resetFields();
        setMode("login");
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
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
            <Form name="register" onFinish={register} className="w-full" form={form}>
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
                    type: "email",
                    message: "请输入有效邮箱地址"
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
                  enterButton={
                    <Button
                      type="primary"
                      loading={sendCodeLoading}
                      disabled={countdown > 0 || sendCodeLoading} // 倒计时期间或加载中禁用按钮
                    >
                      {countdown > 0 ? `${countdown}秒后重发` : "发送验证码"}
                    </Button>
                  }
                  onSearch={handleSendCode}
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
