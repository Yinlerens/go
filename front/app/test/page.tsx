
"use client"
declare const G2: any;
import React, { useEffect } from 'react';

const BirthdayParadoxChart = () => {
  useEffect(() => {
    // 计算生日悖论概率数据
    const data = [];
    for (let n = 2; n <= 100; n++) {
      let probNone = 1.0;
      for (let i = 0; i < n; i++) {
        probNone *= (365 - i) / 365;
      }
      const probAtLeastTwo = 1 - probNone;
      data.push({ people: n, probability: probAtLeastTwo });
    }

    // 初始化 G2 图表
    const chart = new G2.Chart({
      container: 'container',
      autoFit: true,
      height: 400
    });

    chart
      .data(data)
      .scale('people', { min: 0 })
      .scale('probability', { min: 0, max: 1, nice: true })
      .axis('people', { title: { text: 'Number of People' } })
      .axis('probability', { title: { text: 'Probability of Shared Birthday' } });

    // Create the line chart
    chart.line().encode('x', 'people').encode('y', 'probability').encode('color', '#1890ff');

    chart.render();
  }, []);

  return <div id="container" style={{ width: '100%', height: '400px' }} />;
};

export default BirthdayParadoxChart;
