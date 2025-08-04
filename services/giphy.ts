import { ENV } from '@/constants/Env';

const GIPHY_API_KEY = ENV.GIPHY_API_KEY;
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

type GifObject = {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
  title: string;
};

export const searchGifs = async (
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<GifObject[]> => {
  try {
    if (!GIPHY_API_KEY) {
      console.error('GIPHY API key is not configured');
      return [];
    }

    const response = await fetch(
      `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
        query
      )}&limit=${limit}&offset=${offset}&rating=g&lang=en`
    );
    
    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('GIPHY Search Response:', { query, data });
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Error searching GIFs:', error);
    return [];
  }
};

export const getTrendingGifs = async (
  limit: number = 20,
  offset: number = 0
): Promise<GifObject[]> => {
  try {
    if (!GIPHY_API_KEY) {
      console.error('GIPHY API key is not configured');
      return [];
    }

    const response = await fetch(
      `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`
    );
    
    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('GIPHY Trending Response:', { data });
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Error fetching trending GIFs:', error);
    return [];
  }
};

export const getGifCategories = async (): Promise<{name: string, gif: GifObject}[]> => {
  try {
    if (!GIPHY_API_KEY) {
      console.error('GIPHY API key is not configured');
      return [];
    }

    const response = await fetch(
      `${GIPHY_BASE_URL}/categories?api_key=${GIPHY_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('GIPHY Categories:', data);
    
    // Extract categories and their representative GIFs
    const categories = [];
    if (data.data && Array.isArray(data.data)) {
      for (const category of data.data) {
        if (category.gif) {
          categories.push({
            name: category.name,
            gif: category.gif
          });
        }
      }
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching GIF categories:', error);
    return [];
  }
};
