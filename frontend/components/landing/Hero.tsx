import React from "react";

export function Hero() {
  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        padding: "24px 0",
      }}
    >
      <h1 style={{ margin: 0 }}>
        AI 正在替客户做选择，你的品牌可能根本没有进入候选名单
      </h1>
      <p style={{ margin: 0 }}>
        注册后即可查看测试结果，注册成功后赠送 3 次免费测试机会。
      </p>
      <div>
        <a href="/test">立即免费测试</a>
      </div>
    </section>
  );
}
