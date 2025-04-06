import React, { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface VipPlan {
  name: string;
  price: number;
  days: number;
  features: string[];
}

interface VipPlans {
  monthly: VipPlan;
  quarterly: VipPlan;
  yearly: VipPlan;
}

const VipPlans: React.FC = () => {
  const [plans, setPlans] = useState<VipPlans | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/payment/plans');
      if (!response.ok) throw new Error('获取套餐信息失败');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取套餐信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planType: string) => {
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          userId: 'current-user-id' // 这里需要替换为实际的用户ID
        }),
      });

      if (!response.ok) throw new Error('创建订单失败');
      const data = await response.json();
      
      // 跳转到支付页面
      window.location.href = data.paymentUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建订单失败');
    }
  };

  if (loading) return <div className="text-center">加载中...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!plans) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          选择适合您的会员套餐
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          升级会员，享受更多特权
        </p>
      </div>

      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">¥{plan.price}</span>
                <span className="text-base font-medium text-gray-500">/{plan.days}天</span>
              </p>
              <button
                onClick={() => handlePurchase(key)}
                className="mt-6 block w-full bg-primary-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary-700"
              >
                立即购买
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h4 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                包含特权
              </h4>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature: string) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VipPlans; 