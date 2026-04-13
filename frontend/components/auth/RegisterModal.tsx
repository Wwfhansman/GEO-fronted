import React from "react";

type RegisterModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  if (!open) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #d0d0d0",
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>完成注册后即可查看测试结果</h2>
      <p>注册成功后赠送 3 次免费测试机会。</p>
      <form style={{ display: "grid", gap: 8 }}>
        <input type="email" name="email" placeholder="邮箱（必填）" />
        <input type="password" name="password" placeholder="密码（必填）" />
        <input type="tel" name="phone" placeholder="手机号（必填）" />
        <input type="text" name="companyName" placeholder="公司名（必填）" />
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </form>
    </section>
  );
}
