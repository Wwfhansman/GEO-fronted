import React, { useState } from "react";

import { RegisterModal } from "../../components/auth/RegisterModal";

export default function TestPage() {
  const [registerOpen, setRegisterOpen] = useState(false);

  // Placeholder flags until context API wiring is implemented.
  const isAuthenticated = false;
  const freeQuotaRemaining = 3;

  const showContactSales = freeQuotaRemaining <= 0;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <section
        style={{
          border: "1px solid #d0d0d0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>测试页</h1>
        <p style={{ margin: 0 }}>总查询次数：0</p>
        <p style={{ margin: 0 }}>被提及次数：0</p>
        <p style={{ margin: 0 }}>曝光次数：0</p>
        <p style={{ margin: 0 }}>剩余免费测试次数：{freeQuotaRemaining}</p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <input type="text" placeholder="公司名" />
        <input type="text" placeholder="产品关键词" />
        <select defaultValue="医疗健康">
          <option>医疗健康</option>
          <option>电商品牌</option>
          <option>IT科技</option>
          <option>智能制造</option>
          <option>传统零售</option>
        </select>
        <select defaultValue="ChatGPT">
          <option>ChatGPT</option>
          <option>DeepSeek</option>
          <option>豆包</option>
          <option>通义</option>
        </select>
        {!showContactSales ? (
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setRegisterOpen(true);
              }
            }}
          >
            查看AI曝光情况
          </button>
        ) : (
          <button type="button">联系销售获取更多测试机会</button>
        )}
      </section>

      <section>
        <h2>最近一次测试结果</h2>
        <p>暂无测试结果</p>
      </section>

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </main>
  );
}
