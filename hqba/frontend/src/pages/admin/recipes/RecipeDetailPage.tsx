import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recipeApi } from '@/api';
import type { Recipe, RecipeStatus, PourOverRecipeData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  Star,
  CheckCircle,
  Send,
  Plus,
  Copy,
} from 'lucide-react';

const statusConfig: Record<RecipeStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  draft: { variant: 'outline', className: 'text-muted-foreground border-border' },
  calibrating: { variant: 'secondary', className: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40' },
  pending_approval: { variant: 'secondary', className: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/40' },
  approved: { variant: 'default', className: 'bg-green-600' },
  published: { variant: 'default', className: 'bg-emerald-600' },
};

interface TrialFormData {
  dose: string;
  grind_setting: string;
  extraction_time: string;
  yield: string;
  tds: string;
  extraction_percent: string;
  acidity: string;
  finish: string;
  balance: string;
  notes: string;
}

const defaultTrialForm: TrialFormData = {
  dose: '',
  grind_setting: '',
  extraction_time: '',
  yield: '',
  tds: '',
  extraction_percent: '',
  acidity: '',
  finish: '',
  balance: '',
  notes: '',
};

export function RecipeDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialForm, setTrialForm] = useState<TrialFormData>({ ...defaultTrialForm });
  const [isAddingTrial, setIsAddingTrial] = useState(false);

  const isAr = i18n.language === 'ar';

  const fetchRecipe = async () => {
    setIsLoading(true);
    try {
      const { data } = await recipeApi.get(Number(id));
      setRecipe(data.data);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRecipe();
  }, [id]);

  const handleApprove = async () => {
    if (!recipe) return;
    setIsActioning(true);
    try {
      await recipeApi.approve(recipe.id);
      fetchRecipe();
    } catch {
      // error handled silently
    } finally {
      setIsActioning(false);
    }
  };

  const handlePublish = async () => {
    if (!recipe) return;
    setIsActioning(true);
    try {
      await recipeApi.publish(recipe.id);
      fetchRecipe();
    } catch {
      // error handled silently
    } finally {
      setIsActioning(false);
    }
  };

  const handleNewVersion = async () => {
    if (!recipe) return;
    setIsActioning(true);
    try {
      const { data } = await recipeApi.createVersion(recipe.id);
      navigate(`/recipes/${data.data.id}`);
    } catch {
      // error handled silently
    } finally {
      setIsActioning(false);
    }
  };

  const handleAddTrial = async () => {
    if (!recipe) return;
    setIsAddingTrial(true);
    try {
      await recipeApi.addTrial(recipe.id, {
        dose: Number(trialForm.dose),
        grind_setting: trialForm.grind_setting,
        extraction_time: Number(trialForm.extraction_time),
        yield: Number(trialForm.yield),
        tds: trialForm.tds ? Number(trialForm.tds) : null,
        extraction_percent: trialForm.extraction_percent ? Number(trialForm.extraction_percent) : null,
        acidity: trialForm.acidity ? Number(trialForm.acidity) : null,
        finish: trialForm.finish ? Number(trialForm.finish) : null,
        balance: trialForm.balance ? Number(trialForm.balance) : null,
        notes: trialForm.notes || null,
      });
      setTrialDialogOpen(false);
      setTrialForm({ ...defaultTrialForm });
      fetchRecipe();
    } catch {
      // error handled silently
    } finally {
      setIsAddingTrial(false);
    }
  };

  const handleSelectBestShot = async (trialId: number) => {
    if (!recipe) return;
    setIsActioning(true);
    try {
      await recipeApi.selectBestShot(recipe.id, trialId);
      fetchRecipe();
    } catch {
      // error handled silently
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-12 text-muted-foreground">{t('no_data')}</div>
    );
  }

  const config = statusConfig[recipe.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/recipes')}>
            <ArrowLeft className="w-4 h-4 me-2" />
            {t('back')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            <span className="font-mono">{recipe.recipe_code}</span>
          </h1>
          <Badge variant={config.variant} className={config.className}>
            {t(recipe.status)}
          </Badge>
          <Badge variant="outline">v{recipe.version}</Badge>
        </div>
        <div className="flex gap-2">
          {recipe.status === 'pending_approval' && (
            <Button onClick={handleApprove} disabled={isActioning} className="gap-2">
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {t('approve')}
            </Button>
          )}
          {recipe.status === 'approved' && (
            <Button onClick={handlePublish} disabled={isActioning} className="gap-2">
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('publish')}
            </Button>
          )}
          <Button variant="outline" onClick={handleNewVersion} disabled={isActioning} className="gap-2">
            {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
            {t('new_version')}
          </Button>
        </div>
      </div>

      {/* Crop Link */}
      {recipe.crop && (
        <div className="text-sm text-muted-foreground">
          {t('crop')}:{' '}
          <Link to={`/crops/${recipe.crop.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {recipe.crop.serial_number} — {isAr ? recipe.crop.name_ar : recipe.crop.name}
          </Link>
        </div>
      )}

      {/* Espresso Recipe */}
      {recipe.recipe_type === 'espresso' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('espresso_trials')}</h2>
            <Button size="sm" onClick={() => setTrialDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('add_trial')}
            </Button>
          </div>

          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t('dose')} (g)</TableHead>
                  <TableHead>{t('grind_setting')}</TableHead>
                  <TableHead>{t('extraction_time')} (s)</TableHead>
                  <TableHead>{t('yield')} (g)</TableHead>
                  <TableHead>TDS</TableHead>
                  <TableHead>{t('extraction')}%</TableHead>
                  <TableHead>{t('acidity')}</TableHead>
                  <TableHead>{t('finish')}</TableHead>
                  <TableHead>{t('balance')}</TableHead>
                  <TableHead>{t('best_shot')}</TableHead>
                  <TableHead>{t('notes')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!recipe.espresso_trials || recipe.espresso_trials.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      {t('no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  recipe.espresso_trials.map((trial) => (
                    <TableRow
                      key={trial.id}
                      className={trial.is_best_shot ? 'bg-green-50 dark:bg-green-950/30' : ''}
                    >
                      <TableCell>{trial.trial_number}</TableCell>
                      <TableCell>{trial.dose}</TableCell>
                      <TableCell>{trial.grind_setting}</TableCell>
                      <TableCell>{trial.extraction_time}</TableCell>
                      <TableCell>{trial.yield}</TableCell>
                      <TableCell>{trial.tds ?? '—'}</TableCell>
                      <TableCell>{trial.extraction_percent != null ? `${trial.extraction_percent}%` : '—'}</TableCell>
                      <TableCell>{trial.acidity ?? '—'}</TableCell>
                      <TableCell>{trial.finish ?? '—'}</TableCell>
                      <TableCell>{trial.balance ?? '—'}</TableCell>
                      <TableCell>
                        {trial.is_best_shot && (
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">{trial.notes || '—'}</TableCell>
                      <TableCell>
                        {!trial.is_best_shot && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectBestShot(trial.id)}
                            disabled={isActioning}
                            title={t('select_best_shot')}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pour Over Recipe */}
      {recipe.recipe_type === 'pour_over' && (
        <div className="space-y-4">
          {!recipe.pour_over_recipe ? (
            <div className="text-center py-12 text-muted-foreground">{t('no_data')}</div>
          ) : (
            <PourOverCard data={recipe.pour_over_recipe} />
          )}
        </div>
      )}

      {/* Add Trial Dialog */}
      <Dialog open={trialDialogOpen} onOpenChange={setTrialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('add_trial')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('dose')} (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={trialForm.dose}
                onChange={(e) => setTrialForm((f) => ({ ...f, dose: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('grind_setting')}</Label>
              <Input
                value={trialForm.grind_setting}
                onChange={(e) => setTrialForm((f) => ({ ...f, grind_setting: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('extraction_time')} (s)</Label>
              <Input
                type="number"
                value={trialForm.extraction_time}
                onChange={(e) => setTrialForm((f) => ({ ...f, extraction_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('yield')} (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={trialForm.yield}
                onChange={(e) => setTrialForm((f) => ({ ...f, yield: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>TDS</Label>
              <Input
                type="number"
                step="0.01"
                value={trialForm.tds}
                onChange={(e) => setTrialForm((f) => ({ ...f, tds: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('extraction')}%</Label>
              <Input
                type="number"
                step="0.1"
                value={trialForm.extraction_percent}
                onChange={(e) => setTrialForm((f) => ({ ...f, extraction_percent: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('acidity')}</Label>
              <Input
                type="number"
                step="0.1"
                value={trialForm.acidity}
                onChange={(e) => setTrialForm((f) => ({ ...f, acidity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('finish')}</Label>
              <Input
                type="number"
                step="0.1"
                value={trialForm.finish}
                onChange={(e) => setTrialForm((f) => ({ ...f, finish: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('balance')}</Label>
              <Input
                type="number"
                step="0.1"
                value={trialForm.balance}
                onChange={(e) => setTrialForm((f) => ({ ...f, balance: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{t('notes')}</Label>
              <Textarea
                value={trialForm.notes}
                onChange={(e) => setTrialForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddTrial}
              disabled={isAddingTrial || !trialForm.dose || !trialForm.grind_setting || !trialForm.extraction_time || !trialForm.yield}
              className="gap-2"
            >
              {isAddingTrial && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PourOverCard({ data }: { data: PourOverRecipeData }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('pour_over_recipe')}
            <Badge variant="secondary" className={data.brew_type === 'hot' ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40' : 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40'}>
              {t(data.brew_type)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">{t('dose')}</span>
            <p className="font-medium">{data.dose}g</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('grind_setting')}</span>
            <p className="font-medium">{data.grind_setting}</p>
          </div>
          <div className="border-t pt-3">
            <span className="text-sm font-medium text-foreground">{t('bloom')}</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-sm text-muted-foreground">{t('bloom_time')}</span>
                <p className="font-medium">{data.bloom_time}s</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('bloom_water')}</span>
                <p className="font-medium">{data.bloom_water}g</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('pours')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.pours && data.pours.length > 0 ? (
            <div className="space-y-2">
              {data.pours.map((pour, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
                  <span className="font-medium">{t('pour')} {pour.pour}</span>
                  <span className="text-sm">{pour.water}g</span>
                  {pour.time !== undefined && (
                    <span className="text-sm text-muted-foreground">{pour.time}s</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('no_data')}</p>
          )}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('total_water')}</span>
              <span className="font-bold">{data.total_water}g</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('total_time')}</span>
              <span className="font-bold">{data.total_time}s</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
