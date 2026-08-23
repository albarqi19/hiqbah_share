import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { recipeApi } from '@/api';
import type { Recipe, RecipeStatus, RecipeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

const statusConfig: Record<RecipeStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  draft: { variant: 'outline', className: 'text-muted-foreground border-border' },
  calibrating: { variant: 'secondary', className: 'text-amber-700 bg-amber-100' },
  pending_approval: { variant: 'secondary', className: 'text-yellow-700 bg-yellow-100' },
  approved: { variant: 'default', className: 'bg-green-600' },
  published: { variant: 'default', className: 'bg-emerald-600' },
};

const typeConfig: Record<RecipeType, { className: string }> = {
  espresso: { className: 'text-amber-700 bg-amber-100' },
  pour_over: { className: 'text-blue-700 bg-blue-100' },
};

export function RecipesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCropId, setNewCropId] = useState('');
  const [newRecipeType, setNewRecipeType] = useState<RecipeType>('espresso');

  const isAr = i18n.language === 'ar';

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const { data } = await recipeApi.list({ include: 'crop' });
      setRecipes(data.data);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleCreate = async () => {
    if (!newCropId) return;
    setIsCreating(true);
    try {
      await recipeApi.create({
        crop_id: Number(newCropId),
        recipe_type: newRecipeType,
      });
      setDialogOpen(false);
      setNewCropId('');
      setNewRecipeType('espresso');
      fetchRecipes();
    } catch {
      // error handled silently
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('recipes')}</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('add')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('recipe_code')}</TableHead>
                <TableHead>{t('crop')}</TableHead>
                <TableHead>{t('recipe_type')}</TableHead>
                <TableHead>{t('version')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('published_at')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('no_data')}
                  </TableCell>
                </TableRow>
              ) : (
                recipes.map((recipe) => {
                  const sConfig = statusConfig[recipe.status];
                  const tConfig = typeConfig[recipe.recipe_type];
                  return (
                    <TableRow
                      key={recipe.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{recipe.recipe_code}</TableCell>
                      <TableCell className="font-medium">
                        {recipe.crop ? (isAr ? recipe.crop.name_ar : recipe.crop.name) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tConfig.className}>
                          {t(recipe.recipe_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>v{recipe.version}</TableCell>
                      <TableCell>
                        <Badge variant={sConfig.variant} className={sConfig.className}>
                          {t(recipe.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recipe.published_at
                          ? new Date(recipe.published_at).toLocaleDateString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Recipe Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_recipe')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('crop_id')}</Label>
              <Input
                type="number"
                value={newCropId}
                onChange={(e) => setNewCropId(e.target.value)}
                placeholder={t('enter_crop_id')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('recipe_type')}</Label>
              <Select value={newRecipeType} onValueChange={(v) => setNewRecipeType(v as RecipeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="espresso">{t('espresso')}</SelectItem>
                  <SelectItem value="pour_over">{t('pour_over')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newCropId} className="gap-2">
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
