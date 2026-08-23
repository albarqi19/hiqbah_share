import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Delete, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PIN_LENGTH = 6;

type ViewState = 'pin' | 'welcome';

export function PinLoginPage() {
  const { t, i18n } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<ViewState>('pin');
  const loginDataRef = useRef<{ user: Parameters<typeof setUser>[0]; token: string } | null>(null);
  const isAr = i18n.language === 'ar';

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || isLoading) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      submitPin(newPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const submitPin = async (pinValue: string) => {
    setIsLoading(true);
    try {
      const { data } = await authApi.pinLogin({ pin: pinValue });
      loginDataRef.current = data.data;
      setView('welcome');
    } catch {
      setError(t('invalid_credentials'));
      setPin('');
      setIsLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    if (!loginDataRef.current) return;
    const { user, token } = loginDataRef.current;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    useAuthStore.setState({ token, isAuthenticated: true });
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={view === 'welcome' ? undefined : undefined}>
      {view === 'pin' && (
        <motion.div
          key="pin-card"
          initial={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Card className="bg-card/95 backdrop-blur shadow-2xl">
            <CardContent className="pt-6 space-y-6">
              <h2 className="text-xl font-semibold text-center text-foreground">
                {t('pin_login')}
              </h2>
              <p className="text-sm text-center text-muted-foreground">
                {t('enter_pin')}
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* PIN Dots / Loading */}
              <div className="flex justify-center items-center h-6" dir="ltr">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <div className="flex gap-3">
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={i < pin.length ? { scale: 1.15 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                          i < pin.length
                            ? 'bg-primary border-primary'
                            : 'border-border'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto" dir="ltr">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <Button
                    key={digit}
                    type="button"
                    variant="outline"
                    className="h-14 text-xl font-semibold"
                    onClick={() => handleDigit(digit)}
                    disabled={isLoading}
                  >
                    {digit}
                  </Button>
                ))}
                <div />
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                  onClick={() => handleDigit('0')}
                  disabled={isLoading}
                >
                  0
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Delete className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>

            <CardFooter className="justify-center">
              <Link
                to="/email-login"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {t('login')} ({t('email')})
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {view === 'welcome' && (
        <motion.div
          key="welcome"
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onAnimationComplete={(def) => {
            // After fade-in completes, wait then trigger redirect
            if ((def as { opacity: number }).opacity === 1) {
              setTimeout(handleWelcomeComplete, 1200);
            }
          }}
        >
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            {isAr ? 'أهلاً بك' : 'Welcome'}
          </h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
