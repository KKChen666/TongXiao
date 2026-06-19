import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Button, Checkbox } from '@heroui/react';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const containerRef = useRef(null);
  const sliderRef = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => {
    const activeTab = tabRefs.current[mode];
    const slider = sliderRef.current;
    if (activeTab && slider) {
      const container = activeTab.parentElement;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      gsap.to(slider, {
        x: tabRect.left - containerRect.left,
        width: tabRect.width,
        duration: 0.35,
        ease: 'power2.out',
      });
    }
  }, [mode]);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.login-icon', { opacity: 0, scale: 0.5, duration: 0.6, ease: 'back.out(1.7)' })
      .from('.login-title', { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' }, '-=0.2')
      .from('.login-card', { opacity: 0, y: 40, duration: 0.6, ease: 'power3.out' }, '-=0.2');
  }, { scope: containerRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请填写用户名和密码'); return; }
    if (mode === 'register' && password.length < 4) { setError('密码至少4位'); return; }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const body = mode === 'login'
        ? { username, password }
        : { username, password, display_name: displayName || username };
      const res = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLogin(res.user);
    } catch (err) {
      setError(err.message.replace('Error: ', '') || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="login-icon text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 shadow-lg mb-4">
            <AcademicCapIcon className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="login-title text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">考研背诵</h1>
          <p className="text-sm text-default-400 mt-1">高效记忆，轻松备考</p>
        </div>

        {/* Card */}
        <Card className="login-card shadow-xl p-0">
          <CardContent className="p-6 pb-4">
            <div className="relative flex bg-gray-100/80 rounded-xl p-1">
              <div
                ref={sliderRef}
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
                style={{ left: 0, width: '50%' }}
              />
              <button
                ref={el => { tabRefs.current.login = el; }}
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'login' ? 'text-primary' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                登录
              </button>
              <button
                ref={el => { tabRefs.current.register = el; }}
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'register' ? 'text-primary' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                注册
              </button>
            </div>
          </CardContent>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* 用户名 */}
            <label className="block">
              <span className="text-sm font-medium text-foreground mb-1.5 block">
                用户名 <span className="text-danger">*</span>
              </span>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-300" />
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-default-200 bg-content1 text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>
            </label>

            {/* 昵称（注册模式） */}
            {mode === 'register' && (
              <label className="block">
                <span className="text-sm font-medium text-foreground mb-1.5 block">昵称</span>
                <input
                  type="text"
                  placeholder="可选，默认为用户名"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-default-200 bg-content1 text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </label>
            )}

            {/* 密码 */}
            <label className="block">
              <span className="text-sm font-medium text-foreground mb-1.5 block">
                密码 <span className="text-danger">*</span>
              </span>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? '至少4位' : '请输入密码'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full h-11 pl-9 pr-10 rounded-lg border border-default-200 bg-content1 text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-default-400 hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlashIcon className="w-4 h-4" />
                    : <EyeIcon className="w-4 h-4" />
                  }
                </button>
              </div>
            </label>

            {/* 记住我 & 忘记密码 */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <Checkbox
                  isSelected={rememberMe}
                  onChange={setRememberMe}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm ml-1">记住我</span>
                  </Checkbox.Content>
                </Checkbox>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  忘记密码？
                </button>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="text-sm text-danger text-center bg-danger-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isPending={loading}
              className="h-11 font-semibold"
            >
              {mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>
        </Card>

        {/* 底部 */}
        <p className="text-center text-xs text-default-300 mt-6">
          &copy; 2026 考研背诵
        </p>
      </div>
    </div>
  );
}

export default LoginPage;