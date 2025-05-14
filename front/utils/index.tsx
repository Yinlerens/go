/**
 * 生成一个随机验证码。
 * @returns 生成的验证码字符串
 */
export function generateVerificationCode(): string {
  const characterSet = "0123456789";
  let code = "";
  const characterSetLength = characterSet.length;
  // 生成验证码
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characterSetLength);
    code += characterSet[randomIndex];
  }
  return code;
}
