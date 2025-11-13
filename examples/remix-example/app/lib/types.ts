interface ProTip {
  __typename: 'ProTip';
  id: string;
  icon?: string;
  tipTitle: string;
  tipContent: {
    text: string;
    html: string;
  };
}

interface VideoEmbed {
  __typename: 'VideoEmbed';
  id: string;
  videoTitle: string;
  videoUrl: string;
  videoDescription?: {
    text: string;
    html: string;
  };
}

interface IngredientSpotlight {
  __typename: 'IngredientSpotlight';
  id: string;
  ingredient?: {
    id: string;
    name: string;
  } | null;
  ingredientImage?: {
    id: string;
    url: string;
    width: number;
    height: number;
  };
  ingredientDescription: {
    text: string;
    html: string;
  };
  substitutes?: string;
}

interface StepEquipment {
  id: string;
  name: string;
  required?: boolean;
  alternatives?: string;
  notes?: {
    text: string;
    html: string;
  };
}

interface StepIngredientReference {
  id: string;
  ingredientName: string;
  preparation?: string;
  timing?: string;
  notes?: {
    text: string;
    html: string;
  };
}

interface StepTip {
  id: string;
  icon?: string;
  title: string;
  content: {
    text: string;
    html: string;
  };
}

type ContentSection = ProTip | VideoEmbed | IngredientSpotlight;

export interface Recipe {
  id: string;
  title: string;
  description: {
    text: string;
    html: string;
  };
  slug: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  heroImage?: {
    id: string;
    url: string;
    fileName: string;
    width: number;
    height: number;
  };
  author?: {
    id: string;
    name: string;
    bio: {
      text: string;
    };
    specialty?: string;
    profilePhoto?: {
      id: string;
      url: string;
      width: number;
      height: number;
    };
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  ingredients?: Array<{
    id: string;
    quantity: number;
    unit: string;
    ingredient: {
      name: string;
    };
  }>;
  recipeSteps?: Array<{
    id: string;
    stepNumber: number;
    title?: string;
    instruction: {
      text: string;
      html: string;
    };
    estimatedTime?: number;
    equipment?: StepEquipment[];
    ingredientsUsed?: StepIngredientReference[];
    tips?: StepTip[];
  }>;
  nutrition?: {
    id: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: {
      text: string;
    };
    reviewerName: string;
    createdAt: string;
  }>;
  gallery?: Array<{
    id: string;
    url: string;
    fileName: string;
    width: number;
    height: number;
  }>;
  featuredContent?: ContentSection;
  additionalSections?: ContentSection[];
}
