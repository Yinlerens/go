"use client";
import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthMode } from "@/types/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Form, Input } from "antd";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { useCountdown } from "@/hooks/useCountdown";

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

export function AuthForm() {
  const [form] = Form.useForm();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const { countdown, start: startCountdown } = useCountdown();
  const { setAuth, setLoading: setAuthLoading } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const router = useRouter();

  const handleSendCode = async () => {
    // ✅ 使用countdown判断是否可以发送
    if (countdown > 0) return;

    try {
      const { email } = await form.validateFields(["email"]);
      setSendCodeLoading(true);
      const { code, message } = await authApi.sendVerificationCode({ email });

      if (code === 200) {
        toast.success(message);
        startCountdown(60);
      } else {
        toast.error(message);
        // 如果服务器返回剩余等待时间
        if (message && message.includes("秒后重试")) {
          const match = message.match(/(\d+)\s*秒后重试/);
          if (match && match[1]) {
            startCountdown(parseInt(match[1], 10));
          }
        }
      }
    } catch (errorInfo) {
      toast.error("发送验证码失败，请稍后重试");
    } finally {
      setSendCodeLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  const login = async (values: any) => {
    try {
      setLoading(true);
      setAuthLoading(true);
      const { code, message, data } = await authApi.login(values);
      if (code === 200) {
        toast.success(message);
        setAuth(data!);
        router.push(callbackUrl);
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("登录失败，请稍后重试");
    } finally {
      setLoading(false);
      setAuthLoading(false);
    }
  };

  const register = async (value: any) => {
    try {
      setLoading(true);
      setAuthLoading(true);
      const { code, message, data } = await authApi.register(value);

      if (code === 200) {
        toast.success(message);
        setAuth(data!);
        router.push(callbackUrl);
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("注册失败，请稍后重试");
    } finally {
      setLoading(false);
      setAuthLoading(false);
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
              onFinish={login}
              className="w-full"
            >
              <Form.Item name="email" rules={[{ required: true, message: "请输入邮箱!" }]}>
                <Input prefix={<User size="20" />} placeholder="邮箱" autoComplete="username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: "请输入密码!" }]}>
                <Input
                  prefix={<Lock size="20" />}
                  type="password"
                  placeholder="密码"
                  autoComplete="password"
                />
              </Form.Item>
              <Form.Item>
                <Button block type="primary" htmlType="submit" loading={loading}>
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
                      disabled={countdown > 0 || sendCodeLoading} // ✅ 使用countdown
                    >
                      {countdown > 0 ? `${countdown}秒后重发` : "发送验证码"}{" "}
                      {/* ✅ 使用countdown */}
                    </Button>
                  }
                  onSearch={handleSendCode}
                  type="number"
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
              <Form.Item>
                <Button block type="primary" htmlType="submit" loading={loading}>
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
