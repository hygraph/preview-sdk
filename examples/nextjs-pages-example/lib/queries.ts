export const GET_RECIPES_QUERY = `
  query GetRecipes($first: Int) {
    recipes(stage: DRAFT, first: $first, orderBy: createdAt_DESC) {
      id
      title
      description {
        text
        html
        markdown
      }
      slug
      difficulty
      prepTime
      cookTime
      servings
      heroImage {
        id
        url
        fileName
        width
        height
      }
      author {
        id
        name
        bio {
          text
        }
        specialty
        profilePhoto {
          id
          url
          width
          height
        }
      }
      categories {
        id
        name
        slug
      }
    }
  }
`;

export const GET_RECIPE_BY_ID_QUERY = `
  query GetRecipeById($id: ID!) {
    recipe(where: { id: $id }, stage: DRAFT) {
      id
      title
      description {
        text
        html
        markdown
      }
      slug
      difficulty
      prepTime
      cookTime
      servings
      heroImage {
        id
        url
        fileName
        width
        height
      }
      author {
        id
        name
        bio {
          text
        }
        specialty
        profilePhoto {
          id
          url
          width
          height
        }
      }
      categories {
        id
        name
        slug
      }
      ingredients {
        id
        quantity
        unit
        ingredient {
          name
        }
      }
      recipeSteps {
        id
        stepNumber
        title
        instruction {
          text
          html
        }
        estimatedTime
        equipment {
          id
          name
          required
          alternatives
          notes {
            text
            html
          }
        }
        ingredientsUsed {
          id
          ingredientName
          preparation
          timing
          notes {
            text
            html
          }
        }
        tips {
          id
          icon
          title
          content {
            text
            html
          }
        }
      }
      nutrition {
        id
        calories
        protein
        carbohydrates
        fat
        fiber
        sugar
        sodium
      }
      reviews {
        id
        rating
        comment {
          text
        }
        reviewerName
        createdAt
      }
      gallery {
        id
        url
        fileName
        width
        height
      }
      featuredContent {
        __typename
        ... on ProTip {
          id
          icon
          tipTitle: title
          tipContent: content {
            text
            html
          }
        }
        ... on VideoEmbed {
          id
          videoTitle: title
          videoUrl
          videoDescription: description {
            text
            html
          }
        }
        ... on IngredientSpotlight {
          id
          ingredient {
            id
            name
          }
          ingredientImage: image {
            id
            url
            width
            height
          }
          ingredientDescription: description {
            text
            html
          }
          substitutes
        }
      }
      additionalSections {
        __typename
        ... on ProTip {
          id
          icon
          tipTitle: title
          tipContent: content {
            text
            html
          }
        }
        ... on VideoEmbed {
          id
          videoTitle: title
          videoUrl
          videoDescription: description {
            text
            html
          }
        }
        ... on IngredientSpotlight {
          id
          ingredient {
            id
            name
          }
          ingredientImage: image {
            id
            url
            width
            height
          }
          ingredientDescription: description {
            text
            html
          }
          substitutes
        }
      }
    }
  }
`;

