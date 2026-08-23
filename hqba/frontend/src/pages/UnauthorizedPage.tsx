import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-md">
        <div className="flex justify-center">
          <ShieldAlert className="w-20 h-20 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">{t('unauthorized_title')}</h1>
        <p className="text-muted-foreground">{t('unauthorized_message')}</p>
        <Link to="/" className={buttonVariants()}>
          {t('back_to_dashboard')}
        </Link>
      </div>
    </div>
  );
}
