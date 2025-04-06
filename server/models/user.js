import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVip: { type: Boolean, default: false },
  vipExpireDate: { type: Date },
  dailyUsage: { type: Number, default: 0 },
  lastUsageDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 更新用户使用次数
userSchema.methods.incrementUsage = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastUsageDate || this.lastUsageDate < today) {
    this.dailyUsage = 0;
    this.lastUsageDate = today;
  }

  this.dailyUsage += 1;
  await this.save();
};

// 检查用户是否可以继续使用
userSchema.methods.canUse = function() {
  if (this.isVip) return true;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastUsageDate || this.lastUsageDate < today) {
    return true;
  }

  return this.dailyUsage < 5;
};

const User = mongoose.model('User', userSchema);

export default User; 