import React from "react";

const industries = ["医疗健康", "电商品牌", "IT科技", "智能制造", "传统零售"];

export function IndustrySection() {
  return (
    <section style={{ padding: "24px 0" }}>
      <h2>行业场景示意</h2>
      <ul>
        {industries.map((industry) => (
          <li key={industry}>{industry}</li>
        ))}
      </ul>
    </section>
  );
}
