import { useState, useRef } from 'react';
import { Card, CardContent, Button, Input, Tabs, Tab, TabList } from '@heroui/react';
import { UserIcon, LockClosedIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
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
  const cardRef = useRef(null);

  useGSAP(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out' });
    }
  }, { scope: cardRef });

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
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div ref={cardRef} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <AcademicCapIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">考研背诵</h1>
          <p className="text-sm text-default-400 mt-1">高效记忆，轻松备考</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs
              selectedKey={mode}
              onSelectionChange={(k) => { setMode(k); setError(''); }}
              variant="underlined"
              classNames={{ tabList: 'gap-4 w-full', tab: 'flex-1' }}
            >
              <TabList>
                <Tab id="login" key="login">登录</Tab>
                <Tab id="register" key="register">注册</Tab>
              </TabList>
            </Tabs>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                startContent={<UserIcon className="w-4 h-4 text-default-300" />}
                variant="bordered"
                isRequired
              />
              {mode === 'register' && (
                <Input
                  label="昵称"
                  placeholder="可选，默认为用户名"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  variant="bordered"
                />
              )}
              <Input
                label="密码"
                type="password"
                placeholder={mode === 'register' ? '至少4位' : '请输入密码'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                startContent={<LockClosedIcon className="w-4 h-4 text-default-300" />}
                variant="bordered"
                isRequired
              />

              {error && (
                <p className="text-sm text-danger text-center">{error}</p>
              )}

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full h-11 rounded-xl font-bold"
                isLoading={loading}
              >
                {mode === 'login' ? '登录' : '注册'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
