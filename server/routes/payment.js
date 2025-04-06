import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// 会员套餐配置
const VIP_PLANS = {
  monthly: {
    name: '月度会员',
    price: 29.9,
    days: 30,
    features: ['无限次使用', '优先处理', '高级风格']
  },
  quarterly: {
    name: '季度会员',
    price: 79.9,
    days: 90,
    features: ['无限次使用', '优先处理', '高级风格', '专属客服']
  },
  yearly: {
    name: '年度会员',
    price: 299.9,
    days: 365,
    features: ['无限次使用', '优先处理', '高级风格', '专属客服', 'API访问']
  }
};

// 获取会员套餐信息
router.get('/plans', (req, res) => {
  res.json(VIP_PLANS);
});

// 创建支付订单
router.post('/create-order', async (req, res) => {
  try {
    const { planType, userId } = req.body;
    const plan = VIP_PLANS[planType];
    
    if (!plan) {
      return res.status(400).json({ error: '无效的套餐类型' });
    }

    // 这里应该调用实际的支付接口（如支付宝、微信支付等）
    // 为了演示，我们直接返回支付链接
    const orderId = Date.now().toString();
    const paymentUrl = `https://example.com/pay/${orderId}`;

    res.json({
      orderId,
      paymentUrl,
      amount: plan.price,
      planName: plan.name
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 支付回调接口
router.post('/payment-callback', async (req, res) => {
  try {
    const { orderId, userId, planType } = req.body;
    const plan = VIP_PLANS[planType];
    
    if (!plan) {
      return res.status(400).json({ error: '无效的套餐类型' });
    }

    // 更新用户会员状态
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + plan.days);

    user.isVip = true;
    user.vipExpireDate = expireDate;
    await user.save();

    res.json({ success: true, message: '支付成功' });
  } catch (error) {
    console.error('处理支付回调失败:', error);
    res.status(500).json({ error: '处理支付失败' });
  }
});

// 检查会员状态
router.get('/vip-status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      isVip: user.isVip,
      vipExpireDate: user.vipExpireDate,
      dailyUsage: user.dailyUsage,
      remainingUsage: user.isVip ? '无限' : Math.max(0, 5 - user.dailyUsage)
    });
  } catch (error) {
    console.error('获取会员状态失败:', error);
    res.status(500).json({ error: '获取会员状态失败' });
  }
});

export default router; 