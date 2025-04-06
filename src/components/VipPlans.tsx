import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { translations } from '../i18n/translations';
import LanguageSelector from './LanguageSelector';

const VipPlans: React.FC = () => {
  const history = useHistory();
  const [currentLanguage, setCurrentLanguage] = useState('zh');
  const t = translations[currentLanguage as keyof typeof translations].vip;
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 这里应该从全局状态或后端获取登录状态

  const plans = [
    {
      name: t.monthly,
      price: '29',
      features: [
        '无限次处理',
        '优先处理',
        '高级风格',
        '7×24小时支持'
      ]
    },
    {
      name: t.quarterly,
      price: '79',
      features: [
        '无限次处理',
        '优先处理',
        '高级风格',
        '7×24小时支持',
        '专属客服'
      ]
    },
    {
      name: t.yearly,
      price: '299',
      features: [
        '无限次处理',
        '优先处理',
        '高级风格',
        '7×24小时支持',
        '专属客服',
        'API访问'
      ]
    }
  ];

  const handleSubscribe = (planName: string) => {
    if (!isLoggedIn) {
      // 显示登录/注册对话框
      if (window.confirm(t.loginFirst)) {
        // 这里应该跳转到登录页面或显示登录对话框
        history.push('/login');
      }
      return;
    }
    // 处理订阅逻辑
    console.log(`Subscribing to ${planName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <LanguageSelector
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
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
                    ¥{plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    {t.perMonth}
                  </span>
                </p>
                <button
                  onClick={() => handleSubscribe(plan.name)}
                  className="mt-8 block w-full bg-primary-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-primary-700"
                >
                  {t.subscribe}
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  {t.features}
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