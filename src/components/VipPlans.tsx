import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { translations } from '../i18n/translations';
import { useLanguage } from '../contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';

// 初始化 Stripe
const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY || 'pk_test_your_stripe_public_key');

const VipPlans: React.FC = () => {
  const history = useHistory();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage as keyof typeof translations].vip;
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: t.plans.monthly.name,
      price: t.plans.monthly.price,
      period: t.plans.monthly.period,
      features: [
        t.features.unlimited,
        t.features.priority,
        t.features.styles,
        t.features.support
      ],
      button: t.plans.monthly.button,
      priceId: 'price_monthly' // 替换为实际的 Stripe Price ID
    },
    {
      name: t.plans.yearly.name,
      price: t.plans.yearly.price,
      period: t.plans.yearly.period,
      features: [
        t.features.unlimited,
        t.features.priority,
        t.features.styles,
        t.features.support
      ],
      button: t.plans.yearly.button,
      save: t.plans.yearly.save,
      priceId: 'price_yearly' // 替换为实际的 Stripe Price ID
    }
  ];

  const handleSubscribe = async (plan: typeof plans[0]) => {
    // 检查用户是否已登录
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('请先登录');
      history.push('/login');
      return;
    }

    try {
      setLoading(true);
      
      // 创建支付会话
      const response = await fetch('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: localStorage.getItem('userEmail'),
          successUrl: `${window.location.origin}/vip/success`,
          cancelUrl: `${window.location.origin}/vip`,
        }),
      });

      const session = await response.json();

      // 重定向到 Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: session.id,
        });

        if (error) {
          console.error('Stripe checkout error:', error);
          alert('支付过程中出现错误，请重试');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('创建支付会话失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    {plan.period}
                  </span>
                </p>
                {plan.save && (
                  <p className="mt-2 text-sm text-green-600">
                    {plan.save}
                  </p>
                )}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading}
                  className={`mt-8 block w-full bg-primary-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary-700 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? '处理中...' : plan.button}
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  包含特权
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VipPlans; 