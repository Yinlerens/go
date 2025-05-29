import React from "react";
import { Turnstile } from "@marsidev/react-turnstile"; // 假设包名

interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onUnsupported?: () => void;
  onTimeout?: () => void;
  action?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact"; // 在 Modal 中通常用这两种
  // 你可以根据需要添加更多 options 里的属性
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  onUnsupported,
  onTimeout,
  action = "default_action", // 提供一个默认 action
  theme = "auto",
  size = "normal"
}) => {
  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      onUnsupported={onUnsupported}
      onTimeout={onTimeout}
      options={{
        action: action,
        theme: theme,
        size: size,
        retry:"never"
      }}
    />
  );
};

export default TurnstileWidget;
