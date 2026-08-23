import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Coffee } from 'lucide-react';
import loginBg from '@/assets/login-bg.png';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <img
        src={loginBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient overlay — stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-card/10 backdrop-blur-sm mb-4 ring-1 ring-white/20">
            <Coffee className="size-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
            {t('app_name')}
          </h1>
          <p className="text-white/60 mt-1.5 text-sm">
            {t('coffee_roastery')}
          </p>
        </div>

        {/* Login Card */}
        <Outlet />
      </div>
    </div>
  );
}
