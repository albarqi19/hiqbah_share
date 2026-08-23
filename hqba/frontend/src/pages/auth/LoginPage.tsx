import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch {
      setError(t('invalid_credentials'));
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur shadow-2xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-semibold text-center text-foreground">
            {t('welcome_back')}
          </h2>
          <p className="text-sm text-center text-muted-foreground mb-6">
            {t('enter_credentials')}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              placeholder="admin@hiqbah.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin me-2" />}
            {t('login')}
          </Button>
          <Link
            to="/login"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {t('pin_login')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
