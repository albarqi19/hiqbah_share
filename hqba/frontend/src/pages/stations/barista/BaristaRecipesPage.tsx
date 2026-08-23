import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { recipeApi } from '@/api';
import type { Recipe } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coffee, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';

export function BaristaRecipesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const { data } = await recipeApi.list({ 'filter[status]': 'published', include: 'crop,espressoRecipe,pourOverRecipe' });
        setRecipes(data.data);
      } catch {
        // silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Detail view
  if (selectedRecipe) {
    const r = selectedRecipe;
    const BackIcon = isAr ? ChevronRight : ChevronLeft;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedRecipe(null)}
          className="flex items-center gap-2 text-muted-foreground/70 hover:text-white transition-colors"
        >
          <BackIcon className="w-5 h-5" />
          {t('back')}
        </button>

        {/* Recipe Header */}
        <div className="bg-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            {r.recipe_type === 'espresso' ? (
              <Coffee className="w-8 h-8 text-amber-400" />
            ) : (
              <Droplets className="w-8 h-8 text-blue-400" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{r.recipe_code}</h1>
              <p className="text-muted-foreground/70">
                {r.crop ? (isAr ? r.crop.name_ar : r.crop.name) : ''} &middot; v{r.version}
              </p>
            </div>
            <Badge className={`ms-auto text-sm ${r.recipe_type === 'espresso' ? 'bg-amber-600' : 'bg-blue-600'}`}>
              {t(r.recipe_type)}
            </Badge>
          </div>
        </div>

        {/* Espresso Recipe */}
        {r.recipe_type === 'espresso' && r.espresso_recipe && (
          <div className="bg-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 text-amber-400">{t('espresso')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <ParamCard label={t('dose')} value={`${r.espresso_recipe.dose}g`} />
              <ParamCard label={t('grind_setting')} value={r.espresso_recipe.grind_setting} />
              <ParamCard label={t('extraction_time')} value={`${r.espresso_recipe.extraction_time}s`} />
              <ParamCard label={t('yield_label')} value={`${r.espresso_recipe.yield}g`} />
              <ParamCard label={t('tds')} value={`${r.espresso_recipe.tds}`} />
              <ParamCard label={t('extraction_percent')} value={`${r.espresso_recipe.extraction_percent}%`} />
            </div>
          </div>
        )}

        {/* Pour Over Recipe */}
        {r.recipe_type === 'pour_over' && r.pour_over_recipe && (
          <div className="bg-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 text-blue-400">{t('pour_over')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <ParamCard label={t('dose')} value={`${r.pour_over_recipe.dose}g`} />
              <ParamCard label={t('grind_setting')} value={r.pour_over_recipe.grind_setting} />
              <ParamCard label={t('brew_type')} value={t(r.pour_over_recipe.brew_type)} />
              <ParamCard label={t('total_water')} value={`${r.pour_over_recipe.total_water}ml`} />
              <ParamCard label={t('total_time')} value={`${r.pour_over_recipe.total_time}s`} />
              <ParamCard label={t('bloom_water')} value={`${r.pour_over_recipe.bloom_water}ml`} />
            </div>

            {/* Pours */}
            {r.pour_over_recipe.pours && r.pour_over_recipe.pours.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">{t('pours')}</h3>
                <div className="space-y-2">
                  {r.pour_over_recipe?.pours?.map((p, i) => (
                    <div key={i} className="flex items-center gap-4 bg-accent rounded-lg px-4 py-3">
                      <span className="text-blue-400 font-bold text-lg w-10">{p.pour}</span>
                      <span className="text-white">{p.water}ml</span>
                      {p.time && <span className="text-muted-foreground/70">{p.time}s</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <Coffee className="w-7 h-7 text-primary" />
        {t('recipes_dashboard')}
      </h1>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
          <Coffee className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t('no_published_recipes')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="text-start bg-card rounded-xl p-5 border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {recipe.recipe_type === 'espresso' ? (
                    <Coffee className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Droplets className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="font-bold text-lg">{recipe.recipe_code}</span>
                </div>
                <Badge className={`text-xs ${recipe.recipe_type === 'espresso' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                  {t(recipe.recipe_type)}
                </Badge>
              </div>

              {recipe.crop && (
                <p className="text-muted-foreground/70 text-sm mb-3">
                  {isAr ? recipe.crop.name_ar : recipe.crop.name}
                </p>
              )}

              {/* Quick params */}
              {recipe.recipe_type === 'espresso' && recipe.espresso_recipe && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniParam label={t('dose')} value={`${recipe.espresso_recipe.dose}g`} />
                  <MiniParam label={t('yield_label')} value={`${recipe.espresso_recipe.yield}g`} />
                  <MiniParam label={t('extraction_time')} value={`${recipe.espresso_recipe.extraction_time}s`} />
                </div>
              )}

              {recipe.recipe_type === 'pour_over' && recipe.pour_over_recipe && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniParam label={t('dose')} value={`${recipe.pour_over_recipe.dose}g`} />
                  <MiniParam label={t('total_water')} value={`${recipe.pour_over_recipe.total_water}ml`} />
                  <MiniParam label={t('brew_type')} value={t(recipe.pour_over_recipe.brew_type)} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ParamCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-accent rounded-lg p-4 text-center">
      <div className="text-xs text-muted-foreground/70 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function MiniParam({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg py-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}
